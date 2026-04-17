const express = require('express');
const router = express.Router();
const FarmerProfile = require('../models/FarmerProfile');
const BlockchainService = require('../services/blockchainService');

// ─── POST /api/farmer/register ───
// Multi-step onboarding: creates profile + custodial wallet + mints NFTs
router.post('/register', async (req, res) => {
  try {
    const { fullName, phone, govId, farmLocation, farmAddress, farmSizeAcres } = req.body;

    // Check if phone already registered
    const existing = await FarmerProfile.findOne({ 'phone': phone });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Phone number already registered.' });
    }

    // Safely limit base64 sizes and ensure memory stability
    if (govId && govId.imageBase64 && govId.imageBase64.length > 10000000) {
      console.log('⚠️ Warning: Uploaded ID image is massive. Stripping to fit MongoDB limit.');
      govId.imageBase64 = 'image_stored_in_s3_mock';
    }

    // 1. Create farmer profile
    const farmer = new FarmerProfile({
      fullName: fullName.trim(),
      phone: phone.trim(),
      govId: govId || {},
      farmLocation: farmLocation || { type: 'Point', coordinates: [0, 0] },
      farmAddress: farmAddress || '',
      farmSizeAcres: farmSizeAcres || 0,
      onboardingStatus: 'PENDING'
    });

    if (!farmer.wallet) farmer.wallet = {};
    if (!farmer.blockchainMeta) farmer.blockchainMeta = {};

    // 2. Generate custodial wallet (Blockchain Lite)
    const wallet = BlockchainService.generateCustodialWallet(farmer._id.toString());
    farmer.wallet.custodialAddress = wallet.address;

    await farmer.save();

    // 3. Mint Farmer ID NFT (background, non-blocking for UX)
    try {
      const farmerNFT = await BlockchainService.mintFarmerIdNFT(farmer._id.toString(), {
        fullName: farmer.fullName,
        govIdNumber: farmer.govId?.number || ''
      });
      farmer.blockchainMeta.farmerIdTokenId = farmerNFT.tokenId;
      farmer.blockchainMeta.txHash = farmerNFT.txHash;
      farmer.blockchainMeta.mintedAt = new Date();

      // 4. Mint Farmland NFT if location provided
      if (farmLocation && farmLocation.coordinates && farmLocation.coordinates[0] !== 0) {
        const farmlandNFT = await BlockchainService.mintFarmlandNFT(farmer._id.toString(), {
          longitude: farmLocation.coordinates[0],
          latitude: farmLocation.coordinates[1]
        }, { farmSizeAcres, farmAddress });
        farmer.blockchainMeta.farmlandTokenId = farmlandNFT.tokenId;
      }

      farmer.onboardingStatus = 'VERIFIED';
      await farmer.save();
    } catch (bcErr) {
      console.log('⚠️ Blockchain minting deferred:', bcErr.message);
    }

    console.log(`✅ Farmer registered: ${fullName} (${phone})`);
    res.status(201).json({
      success: true,
      message: 'Registration successful! Your identity is being verified on the blockchain.',
      farmer: {
        id: farmer._id,
        fullName: farmer.fullName,
        phone: farmer.phone,
        walletAddress: farmer.wallet.custodialAddress,
        onboardingStatus: farmer.onboardingStatus,
        blockchainMeta: farmer.blockchainMeta
      }
    });

  } catch (err) {
    console.error('❌ Registration Error:', err);
    res.status(500).json({ success: false, message: 'Registration failed.', error: err.message });
  }
});

// ─── POST /api/farmer/login ───
// Simplified phone-based auth (MVP — no JWT yet)
router.post('/login', async (req, res) => {
  try {
    const { phone } = req.body;
    const farmer = await FarmerProfile.findOne({ phone });

    if (!farmer) {
      return res.status(404).json({ success: false, message: 'No farmer found with this phone number.' });
    }

    res.status(200).json({
      success: true,
      farmer: {
        id: farmer._id,
        fullName: farmer.fullName,
        phone: farmer.phone,
        walletAddress: farmer.wallet.custodialAddress,
        onboardingStatus: farmer.onboardingStatus,
        farmLocation: farmer.farmLocation,
        farmAddress: farmer.farmAddress,
        farmSizeAcres: farmer.farmSizeAcres,
        metrics: farmer.metrics,
        blockchainMeta: farmer.blockchainMeta,
        wallet: farmer.wallet,
        joinedAt: farmer.joinedAt
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login failed.', error: err.message });
  }
});

// ─── GET /api/farmer/:id ───
router.get('/:id', async (req, res) => {
  try {
    const farmer = await FarmerProfile.findById(req.params.id);
    if (!farmer) return res.status(404).json({ success: false, message: 'Farmer not found.' });

    res.status(200).json({ success: true, farmer });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch farmer.', error: err.message });
  }
});

// ─── PUT /api/farmer/:id ───
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;
    const farmer = await FarmerProfile.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!farmer) return res.status(404).json({ success: false, message: 'Farmer not found.' });

    res.status(200).json({ success: true, farmer });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed.', error: err.message });
  }
});

module.exports = router;
