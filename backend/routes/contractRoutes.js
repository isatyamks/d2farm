const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const Contract = require('../models/Contract');
const Proposal = require('../models/Proposal');

// ── Helper ────────────────────────────────────────────────────────────────────
const buildContractFromProposal = async (proposal) => {
    const buyer  = proposal.buyerId  || {};
    const farmer = proposal.farmerId || {};
    const order  = proposal.orderId  || {};
    const listing= proposal.cropListingId || {};

    const cropName  = order.crop   || listing.cropName  || 'Unknown Crop';
    const variety   = order.variety|| listing.variety   || '';
    const qty       = proposal.proposedQuantity    || 0;
    const price     = proposal.proposedPricePerUnit|| 0;
    const total     = proposal.totalValue          || qty * price;
    const escrow    = parseFloat((total * 0.02).toFixed(2));

    return {
        proposalId: proposal._id,
        orderId:    proposal.orderId?._id || proposal.orderId,

        buyer: {
            name:          buyer.fullName     || buyer.buyerName || 'Buyer',
            businessName:  buyer.businessName || buyer.companyName|| '',
            gstNumber:     buyer.gstNumber    || '',
            panNumber:     buyer.panNumber    || '',
            address:       buyer.address      || '',
            city:          buyer.city         || '',
            state:         buyer.state        || 'Maharashtra',
            phone:         buyer.phone        || '',
            email:         buyer.email        || '',
        },

        farmer: {
            name:     farmer.fullName  || 'Farmer',
            farmName: farmer.farmName  || '',
            village:  farmer.village   || '',
            district: farmer.district  || '',
            state:    farmer.state     || 'Maharashtra',
            phone:    farmer.phone     || '',
        },

        produce: {
            cropName,
            variety,
            quantityKg:     qty,
            pricePerKg:     price,
            deliveryLocation: order.location || '',
            packagingType:  'Jute Bags / HDPE Bags',
        },

        financials: {
            totalContractValue: total,
            escrowAmount:       escrow,
            remainingBalance:   parseFloat((total - escrow).toFixed(2)),
        },

        blockchain: {
            transactionHash: proposal.blockchainTxHash || '',
            verificationUrl: proposal.blockchainTxHash
                ? `https://polygonscan.com/tx/${proposal.blockchainTxHash}`
                : '',
        },

        status: 'ACTIVE',
        timeline: [{
            event:     'Contract Generated',
            timestamp: new Date(),
            note:      'Contract created from accepted proposal. Escrow locked on-chain.',
            txHash:    proposal.blockchainTxHash || '',
        }],

        signatures: {
            buyerSigned:   true,
            farmerSigned:  true,
            buyerSignedAt: new Date(proposal.updatedAt || Date.now()),
            farmerSignedAt:new Date(proposal.createdAt || Date.now()),
        },

        contractDate: new Date(),
        expiryDate:   new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    };
};


// ── POST /api/contracts  — Create contract from proposal ──────────────────────
router.post('/', async (req, res) => {
    try {
        const { proposalId } = req.body;
        if (!proposalId) return res.status(400).json({ success: false, message: 'proposalId required' });

        // Check if contract already exists for this proposal
        const existing = await Contract.findOne({ proposalId });
        if (existing) {
            return res.json({ success: true, contract: existing, message: 'Existing contract returned.' });
        }

        const proposal = await Proposal.findById(proposalId)
            .populate('farmerId', 'fullName phone village district state farmName')
            .populate('orderId',  'crop variety location buyerName')
            .populate('cropListingId', 'cropName variety');

        if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found.' });
        if (!['ACCEPTED', 'LOGISTICS_DISPATCHED', 'DELIVERED', 'PAYMENT_RECEIVED'].includes(proposal.status)) {
            return res.status(400).json({ success: false, message: 'Contract can only be generated for accepted proposals.' });
        }

        const data = await buildContractFromProposal(proposal);
        const contract = await new Contract(data).save();

        res.status(201).json({ success: true, contract, message: 'Contract created successfully.' });
    } catch (err) {
        console.error('[CONTRACT CREATE]', err);
        res.status(500).json({ success: false, message: err.message });
    }
});


// ── GET /api/contracts  — List all contracts ──────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const contracts = await Contract.find().sort({ contractDate: -1 }).lean();
        res.json({ success: true, contracts, count: contracts.length });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


// ── GET /api/contracts/:id  — Get one contract ────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const contract = await Contract.findById(req.params.id).lean();
        if (!contract) return res.status(404).json({ success: false, message: 'Contract not found.' });
        res.json({ success: true, contract });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


// ── GET /api/contracts/proposal/:proposalId  — Fetch by proposal ──────────────
router.get('/proposal/:proposalId', async (req, res) => {
    try {
        const contract = await Contract.findOne({ proposalId: req.params.proposalId }).lean();
        if (!contract) return res.status(404).json({ success: false, message: 'No contract found for this proposal.' });
        res.json({ success: true, contract });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


// ── PUT /api/contracts/:id/status  — Update contract status ───────────────────
router.put('/:id/status', async (req, res) => {
    try {
        const { status, note, txHash } = req.body;
        const contract = await Contract.findById(req.params.id);
        if (!contract) return res.status(404).json({ success: false, message: 'Contract not found.' });

        contract.status = status;
        contract.timeline.push({ event: status, note: note || '', txHash: txHash || '' });
        await contract.save();

        res.json({ success: true, contract });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


module.exports = router;
