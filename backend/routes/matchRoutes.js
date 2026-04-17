const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const CropListing = require('../models/CropListing');
const FarmerProfile = require('../models/FarmerProfile');
const Proposal = require('../models/Proposal');

// ─── GET /api/match/orders?farmerId= ───
// CORE MATCHING ENDPOINT
// Finds open buyer orders that match a farmer's crop listings.
// Filters by: crop variety match + harvest date overlap + geo-proximity.
// Returns "Open Orders" for the farmer's Proposal Center.
router.get('/orders', async (req, res) => {
  try {
    const { farmerId } = req.query;

    if (!farmerId) {
      return res.status(400).json({ success: false, message: 'farmerId is required.' });
    }

    // 1. Get farmer's active crop listings
    const farmerListings = await CropListing.find({
      farmerId,
      status: 'ACTIVE'
    });

    if (farmerListings.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No active crop listings found. Add crops first!',
        matchedOrders: []
      });
    }

    // 2. Get farmer's location for geo-proximity
    const farmer = await FarmerProfile.findById(farmerId);
    const farmerCoords = farmer?.farmLocation?.coordinates || [0, 0];

    // 3. Build crop filter from farmer's listings
    const cropNames = [...new Set(farmerListings.map(l => l.cropName))];
    const varieties = [...new Set(farmerListings.map(l => l.variety))];

    // 4. Find matching open orders
    // Exclude orders we've already proposed to
    const existingProposals = await Proposal.find({ farmerId }).select('orderId');
    const proposedOrderIds = existingProposals.map(p => p.orderId);

    let query = {
      _id: { $nin: proposedOrderIds },
      status: 'Open',
      $or: [
        // Match by crop name (case-insensitive)
        { crop: { $regex: new RegExp(cropNames.join('|'), 'i') } },
      ]
    };

    // Add geo-proximity filter if farmer has valid coordinates
    if (farmerCoords[0] !== 0 && farmerCoords[1] !== 0) {
      query.location = {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: farmerCoords
          },
          $maxDistance: 200000 // 200km radius
        }
      };
    }

    let matchedOrders = await Order.find(query).sort({ createdAt: -1 }).limit(20);

    // If geo-filtered query returns nothing, try without geo
    if (matchedOrders.length === 0) {
      delete query.location;
      matchedOrders = await Order.find(query).sort({ createdAt: -1 }).limit(20);
    }

    // 5. Enrich with match quality score
    const enrichedOrders = matchedOrders.map(order => {
      const orderObj = order.toObject();
      
      // Find matching listing for this order
      const matchingListing = farmerListings.find(l =>
        l.cropName.toLowerCase() === order.crop.toLowerCase() ||
        order.crop.toLowerCase().includes(l.cropName.toLowerCase())
      );

      // Calculate match score
      let matchScore = 0;
      let matchReasons = [];

      if (matchingListing) {
        // Crop name match
        matchScore += 40;
        matchReasons.push('Crop match');

        // Variety match
        if (matchingListing.variety.toLowerCase() === (order.variety || '').toLowerCase()) {
          matchScore += 30;
          matchReasons.push('Variety match');
        }

        // Quantity feasibility
        if (matchingListing.totalQuantity >= order.quantityRequired) {
          matchScore += 20;
          matchReasons.push('Quantity available');
        } else {
          matchScore += 10;
          matchReasons.push('Partial quantity');
        }

        // Has MOQ
        if (order.quantityRequired >= (matchingListing.moqRange?.min || 0)) {
          matchScore += 10;
          matchReasons.push('Above MOQ');
        }
      }

      return {
        ...orderObj,
        matchScore: Math.min(matchScore, 100),
        matchReasons,
        matchingListing: matchingListing ? {
          id: matchingListing._id,
          cropName: matchingListing.cropName,
          variety: matchingListing.variety,
          pricePerUnit: matchingListing.pricePerUnit,
          totalQuantity: matchingListing.totalQuantity,
          harvestDateRange: matchingListing.harvestDateRange
        } : null
      };
    });

    // Sort by match score (highest first)
    enrichedOrders.sort((a, b) => b.matchScore - a.matchScore);

    res.status(200).json({
      success: true,
      totalMatches: enrichedOrders.length,
      farmerCrops: cropNames,
      matchedOrders: enrichedOrders
    });

  } catch (err) {
    console.error('❌ Matching Error:', err);
    res.status(500).json({ success: false, message: 'Matching failed.', error: err.message });
  }
});

module.exports = router;
