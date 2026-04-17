const express = require('express');
const router = express.Router();
const Proposal = require('../models/Proposal');
const FarmerProfile = require('../models/FarmerProfile');
const CropListing = require('../models/CropListing');
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

    // Update payment status based on lifecycle
    if (status === 'PAYMENT_RECEIVED') {
      proposal.paymentStatus = 'COMPLETED';
      
      // Update farmer metrics
      await FarmerProfile.findByIdAndUpdate(proposal.farmerId, {
        $inc: { 
          'metrics.completedDeliveries': 1,
          'metrics.acceptedProposals': status === 'ACCEPTED' ? 1 : 0
        }
      });
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
