const express = require('express');
const router = express.Router();
const CropListing = require('../models/CropListing');

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
    const listing = await CropListing.findByIdAndDelete(req.params.id);
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });

    res.status(200).json({ success: true, message: 'Listing deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed.', error: err.message });
  }
});

module.exports = router;
