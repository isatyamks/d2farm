const express = require('express');
const router = express.Router();
const CropListing = require('../models/CropListing');
const Proposal = require('../models/Proposal');
const FarmerProfile = require('../models/FarmerProfile');

// ─── POST /api/listings ───
// Create a new crop listing (supports offline sync batch)
router.post('/', async (req, res) => {
  try {
    const listingData = req.body;

    // Support batch creation for offline sync
    if (Array.isArray(listingData)) {
      const listings = await CropListing.insertMany(listingData);
      return res.status(201).json({
        success: true,
        message: `${listings.length} listings synced successfully.`,
        listings
      });
    }

    // Constraint: Farmer can only have one active crop at a time
    if (listingData.farmerId) {
      const activeCount = await CropListing.countDocuments({ farmerId: listingData.farmerId, status: 'ACTIVE' });
      if (activeCount > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'You can only list one active crop at a time. Wait until your current crop is sold or delivered.' 
        });
      }
    }

    const listing = await CropListing.create(listingData);
    console.log(`🌾 New crop listed: ${listing.cropName} (${listing.variety}) by farmer ${listing.farmerId}`);

    res.status(201).json({ success: true, listing });
  } catch (err) {
    console.error('❌ Listing Error:', err);
    res.status(500).json({ success: false, message: 'Failed to create listing.', error: err.message });
  }
});

// ─── GET /api/listings ───
// Get listings (optionally filtered by farmerId)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.farmerId) filter.farmerId = req.query.farmerId;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.cropName) filter.cropName = { $regex: req.query.cropName, $options: 'i' };

    const listings = await CropListing.find(filter)
      .sort({ createdAt: -1 })
      .populate('farmerId', 'fullName phone farmLocation');

    res.status(200).json({ success: true, listings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch listings.', error: err.message });
  }
});

// ─── GET /api/listings/:id ───
router.get('/:id', async (req, res) => {
  try {
    const listing = await CropListing.findById(req.params.id)
      .populate('farmerId', 'fullName phone farmLocation metrics');
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });

    res.status(200).json({ success: true, listing });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch listing.', error: err.message });
  }
});

// ─── PUT /api/listings/:id ───
router.put('/:id', async (req, res) => {
  try {
    const listing = await CropListing.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });

    res.status(200).json({ success: true, listing });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed.', error: err.message });
  }
});

// ─── DELETE /api/listings/:id ───
router.delete('/:id', async (req, res) => {
  try {
    const listingId = req.params.id;
    const listing = await CropListing.findById(listingId);
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });

    // Fetch existing proposals connected to this crop
    const proposals = await Proposal.find({ cropListingId: listingId });
    
    // Check if farmer had active proposals for this crop
    const activeProposals = proposals.filter(p => p.status !== 'REJECTED');
    if (activeProposals.length > 0) {
      // Apply 10 point trust score penalty
      await FarmerProfile.findByIdAndUpdate(listing.farmerId, {
        $inc: { 'metrics.trustScore': -10 }
      });
      console.log(`⚠️ Farmer ${listing.farmerId} penalized for deleting crop with active proposals.`);
    }

    // Cascade delete proposals from buyer systems
    if (proposals.length > 0) {
      await Proposal.deleteMany({ cropListingId: listingId });
      console.log(`🗑️ Deleted ${proposals.length} proposals associated with listing ${listingId}`);
    }

    await CropListing.findByIdAndDelete(listingId);

    res.status(200).json({ success: true, message: 'Listing and associated proposals deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed.', error: err.message });
  }
});

module.exports = router;
