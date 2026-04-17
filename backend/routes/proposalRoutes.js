const express = require('express');
const router = express.Router();
const Proposal = require('../models/Proposal');
const FarmerProfile = require('../models/FarmerProfile');
const CropListing = require('../models/CropListing');
const User = require('../models/User');
const BlockchainService = require('../services/blockchainService');

// ─── POST /api/proposals ───
// Farmer sends a proposal on an open buyer order
router.post('/', async (req, res) => {
  try {
    const { farmerId, orderId, cropListingId, proposedQuantity, proposedPricePerUnit, message } = req.body;

    // Check for duplicate
    const existing = await Proposal.findOne({ farmerId, orderId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already sent a proposal for this order.' });
    }

    // Check quantity limit and deduct
    const listing = await CropListing.findById(cropListingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Crop listing not found.' });
    }
    if (listing.totalQuantity < proposedQuantity) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient stock limit. You only have ${listing.totalQuantity} available.` 
      });
    }

    // Deduct stock
    listing.totalQuantity -= proposedQuantity;
    await listing.save();

    const proposal = await Proposal.create({
      farmerId,
      orderId,
      cropListingId,
      proposedQuantity,
      proposedPricePerUnit,
      message
    });

    // Update farmer metrics
    await FarmerProfile.findByIdAndUpdate(farmerId, {
      $inc: { 'metrics.totalProposals': 1 }
    });

    // Record on blockchain (non-blocking)
    BlockchainService.recordProposalOnChain(proposal._id.toString(), {
      farmerId, orderId, quantity: proposedQuantity, price: proposedPricePerUnit
    }).then(result => {
      proposal.blockchainTxHash = result.txHash;
      proposal.save();
    }).catch(err => console.log('⚠️ Blockchain record deferred:', err.message));

    console.log(`📩 Proposal sent by farmer ${farmerId} for order ${orderId}`);
    res.status(201).json({ success: true, proposal });
  } catch (err) {
    console.error('❌ Proposal Error:', err);
    res.status(500).json({ success: false, message: 'Failed to send proposal.', error: err.message });
  }
});

// ─── GET /api/proposals ───
// Get proposals for a farmer
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.farmerId) filter.farmerId = req.query.farmerId;
    if (req.query.status) filter.status = req.query.status;

    const proposals = await Proposal.find(filter)
      .sort({ createdAt: -1 })
      .populate('orderId')
      .populate('cropListingId', 'cropName variety category')
      .populate('farmerId', 'fullName phone');

    res.status(200).json({ success: true, proposals });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch proposals.', error: err.message });
  }
});

// ─── GET /api/proposals/:id ───
router.get('/:id', async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id)
      .populate('orderId')
      .populate('cropListingId')
      .populate('farmerId', 'fullName phone wallet');

    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found.' });
    res.status(200).json({ success: true, proposal });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch proposal.', error: err.message });
  }
});

// ─── PUT /api/proposals/:id/status ───
// Update proposal status (used by buyer system or automated triggers)
router.put('/:id/status', async (req, res) => {
  try {
    const { status, note } = req.body;
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found.' });

    proposal.status = status;
    proposal.timeline.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status}`
    });

    // ── On full payment: unlock escrow + credit full 100% to farmer withdrawable balance
    if (status === 'PAYMENT_RECEIVED') {
      proposal.paymentStatus = 'COMPLETED';
      const escrowAmount    = parseFloat((proposal.totalValue * 0.02).toFixed(2));
      const remainingAmount = parseFloat((proposal.totalValue - escrowAmount).toFixed(2));

      const farmer = await FarmerProfile.findById(proposal.farmerId);
      if (farmer) {
        // Unlock the locked escrow → move to withdrawable
        farmer.wallet.lockedBalance      = parseFloat(Math.max(0, (farmer.wallet.lockedBalance || 0) - escrowAmount).toFixed(2));
        // Credit full remaining 98% as new withdrawable
        farmer.wallet.withdrawableBalance = parseFloat(((farmer.wallet.withdrawableBalance || 0) + proposal.totalValue).toFixed(2));
        farmer.metrics.completedDeliveries = (farmer.metrics.completedDeliveries || 0) + 1;

        farmer.walletTransactions.push({
          type:       'ESCROW_RELEASE',
          amount:     proposal.totalValue,
          proposalId: proposal._id,
          note:       `Payment received. ₹${proposal.totalValue} credited.`
        });
        await farmer.save();
        console.log(`💰 Payment settled: ₹${proposal.totalValue} | Farmer ${farmer.fullName} wallet: withdrawable=₹${farmer.wallet.withdrawableBalance}`);
      }
    }

    if (status === 'ACCEPTED') {
      await FarmerProfile.findByIdAndUpdate(proposal.farmerId, {
        $inc: { 'metrics.acceptedProposals': 1 }
      });
    }

    if (status === 'REJECTED') {
      await FarmerProfile.findByIdAndUpdate(proposal.farmerId, {
        $inc: { 'metrics.rejectedProposals': 1 }
      });

      // Refund the quantity back to the crop listing
      if (proposal.cropListingId) {
        await CropListing.findByIdAndUpdate(proposal.cropListingId, {
          $inc: { totalQuantity: proposal.proposedQuantity }
        });
        console.log(`♻️ Refunded ${proposal.proposedQuantity} kg back to crop listing ${proposal.cropListingId}`);
      }
    }

    await proposal.save();
    res.status(200).json({ success: true, proposal });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Status update failed.', error: err.message });
  }
});

// ─── PUT /api/proposals/:id/accept-contract ───
// Buyer accepts: 2% escrow held in farmer wallet as LOCKED (not withdrawable until delivery)
router.put('/:id/confirm-acceptance', async (req, res) => {
  console.log(`📡 [API] PUT /api/proposals/${req.params.id}/accept-contract received`);
  try {
    const proposal = await Proposal.findById(req.params.id).populate('orderId');
    if (!proposal) {
      console.log(`❌ [API] Proposal ${req.params.id} NOT FOUND in database`);
      return res.status(404).json({ success: false, message: `Proposal ${req.params.id} not found in database.` });
    }
    if (proposal.status === 'ACCEPTED') return res.status(400).json({ success: false, message: 'Already locked.' });

    const escrowAmount = parseFloat((proposal.totalValue * 0.02).toFixed(2));

    // ── 1. Credit farmer wallet atomically
    const farmer = await FarmerProfile.findById(proposal.farmerId);
    if (!farmer) {
      console.log(`❌ [API] Farmer Profile ${proposal.farmerId} missing for proposal ${proposal._id}`);
      return res.status(404).json({ success: false, message: 'Associated farmer profile not found. Contract cannot be locked.' });
    }

    farmer.wallet.balance       = parseFloat(((farmer.wallet.balance || 0)       + escrowAmount).toFixed(2));
    farmer.wallet.lockedBalance = parseFloat(((farmer.wallet.lockedBalance || 0) + escrowAmount).toFixed(2));

    // Push permanent ledger entry
    farmer.walletTransactions.push({
      type:       'ESCROW_CREDIT',
      amount:     escrowAmount,
      proposalId: proposal._id,
      note:       `2% escrow (₹${escrowAmount}) locked for order.`
    });

    farmer.metrics.acceptedProposals = (farmer.metrics.acceptedProposals || 0) + 1;
    await farmer.save();

    // ── 2. Update proposal state
    proposal.status        = 'ACCEPTED';
    proposal.paymentStatus = 'ESCROW_LOCKED';
    proposal.timeline.push({
      status:    'ACCEPTED',
      timestamp: new Date(),
      note:      `Accepted. ₹${escrowAmount} escrow locked.`
    });
    await proposal.save();

    console.log(`✅ Escrow locked: ₹${escrowAmount} | Farmer ${farmer.fullName} | Proposal ${proposal._id}`);
    console.log(`   Farmer wallet: balance=₹${farmer.wallet.balance} | locked=₹${farmer.wallet.lockedBalance}`);

    res.status(200).json({
      success: true,
      message: `Contract accepted. ₹${escrowAmount} escrowed and locked in farmer wallet pending delivery.`,
      escrowAmount,
      farmerWallet: {
        balance:            farmer.wallet.balance,
        lockedBalance:      farmer.wallet.lockedBalance,
        withdrawableBalance:farmer.wallet.withdrawableBalance
      },
      proposal
    });
  } catch (err) {
    console.error('Accept Contract Error:', err);
    res.status(500).json({ success: false, message: 'Failed to initiate Smart Contract lock.', error: err.message });
  }
});

// ─── PUT /api/proposals/:id/cancel-contract ───
// Farmer cancels post-acceptance — escrow is FORFEITED as trust penalty
router.put('/:id/cancel-contract', async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found.' });
    if (proposal.status !== 'ACCEPTED') return res.status(400).json({ success: false, message: 'Only accepted contracts can be cancelled.' });

    const escrowAmount = parseFloat((proposal.totalValue * 0.02).toFixed(2));

    // ── Slash farmer wallet atomically + push penalty ledger entry
    const farmer = await FarmerProfile.findById(proposal.farmerId);
    if (farmer) {
      farmer.wallet.balance       = parseFloat(((farmer.wallet.balance || 0)       - escrowAmount).toFixed(2));
      farmer.wallet.lockedBalance = parseFloat(((farmer.wallet.lockedBalance || 0) - escrowAmount).toFixed(2));
      farmer.metrics.trustScore        = Math.max(0, (farmer.metrics.trustScore || 80) - 10);
      farmer.metrics.rejectedProposals = (farmer.metrics.rejectedProposals || 0) + 1;

      farmer.walletTransactions.push({
        type:       'ESCROW_PENALTY',
        amount:     -escrowAmount,
        proposalId: proposal._id,
        note:       `Contract cancelled. ₹${escrowAmount} forfeited.`
      });
      await farmer.save();
    }

    proposal.status = 'REJECTED';
    proposal.paymentStatus = 'PENDING';
    proposal.timeline.push({
      status:    'REJECTED',
      timestamp: new Date(),
      note:      `Cancelled. ₹${escrowAmount} escrow forfeited.`
    });
    await proposal.save();

    console.log(`⚠️ Contract cancelled. ₹${escrowAmount} forfeited. Proposal ${proposal._id}`);
    res.status(200).json({
      success: true,
      message: `Contract cancelled. ₹${escrowAmount} escrow slashed as trust penalty.`,
      proposal
    });
  } catch (err) {
    console.error('Cancel Contract Error:', err);
    res.status(500).json({ success: false, message: 'Failed to cancel contract.', error: err.message });
  }
});

// ─── GET /api/proposals/:id/timeline ───
router.get('/:id/timeline', async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id).select('timeline status totalValue paymentStatus');
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found.' });

    res.status(200).json({ success: true, timeline: proposal.timeline, status: proposal.status, totalValue: proposal.totalValue, paymentStatus: proposal.paymentStatus });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch timeline.', error: err.message });
  }
});

module.exports = router;
