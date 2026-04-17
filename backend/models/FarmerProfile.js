const mongoose = require('mongoose');

const farmerProfileSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true, unique: true, index: true },
  
  // Government Identity
  govId: {
    type: { type: String, enum: ['AADHAAR', 'PAN', 'VOTER_ID', 'DRIVING_LICENSE'], default: 'AADHAAR' },
    number: { type: String },
    imageBase64: { type: String } // Base64 encoded Gov ID image
  },

  // Custodial Wallet (Blockchain Lite — farmer never sees private keys)
  wallet: {
    custodialAddress: { type: String },
    balance: { type: Number, default: 0 },           // Total credited (locked + withdrawable)
    lockedBalance: { type: Number, default: 0 },     // Escrow hold — cannot withdraw
    withdrawableBalance: { type: Number, default: 0 }, // Free to withdraw
    currency: { type: String, default: 'INR' }
  },

  // Farm Location (GeoJSON Point — MongoDB 2dsphere index)
  farmLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },
  farmAddress: { type: String },
  farmSizeAcres: { type: Number, default: 0 },

  // Blockchain Verification Metadata
  blockchainMeta: {
    farmerIdTokenId: { type: String, default: null },
    farmlandTokenId: { type: String, default: null },
    mintedAt: { type: Date, default: null },
    txHash: { type: String, default: null }
  },

  // Onboarding Status
  onboardingStatus: {
    type: String,
    enum: ['PENDING', 'VERIFIED', 'REJECTED'],
    default: 'PENDING'
  },

  // Trust & Performance Metrics
  metrics: {
    trustScore: { type: Number, default: 80, min: 0, max: 100 },
    totalProposals: { type: Number, default: 0 },
    acceptedProposals: { type: Number, default: 0 },
    completedDeliveries: { type: Number, default: 0 },
    rejectedProposals: { type: Number, default: 0 }
  },

  joinedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Geospatial index for proximity-based matching
farmerProfileSchema.index({ farmLocation: '2dsphere' });

module.exports = mongoose.model('FarmerProfile', farmerProfileSchema);
