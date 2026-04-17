const mongoose = require('mongoose');

const cropListingSchema = new mongoose.Schema({
  farmerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'FarmerProfile', 
    required: true, 
    index: true 
  },

  // Crop Identity
  category: { 
    type: String, 
    enum: ['VEGETABLE', 'FRUIT', 'GRAIN', 'SPICE', 'PULSE'], 
    required: true 
  },
  cropName: { type: String, required: true, index: true },
  variety: { type: String, default: 'Standard' },

  // Cultivation Method
  method: { 
    type: String, 
    enum: ['ORGANIC', 'CONVENTIONAL', 'HYDROPONIC'], 
    default: 'CONVENTIONAL' 
  },

  // Quantity
  totalQuantity: { type: Number, required: true },
  unit: { type: String, default: 'kg' },
  moqRange: {
    min: { type: Number, default: 1 },
    max: { type: Number }
  },

  // Harvest Window
  harvestDateRange: {
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  },

  // Pricing
  pricePerUnit: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },

  // Status
  status: {
    type: String,
    enum: ['ACTIVE', 'SOLD_OUT', 'EXPIRED'],
    default: 'ACTIVE'
  },

  // Blockchain immutability hash (set after on-chain recording)
  blockchainHash: { type: String, default: null },

  // Offline sync tracking
  syncedAt: { type: Date, default: null },

  // AI Quality Inspection Report
  qualityReport: { type: Object, default: null }
}, {
  timestamps: true
});

// Compound index for matching logic
cropListingSchema.index({ cropName: 1, variety: 1, status: 1 });
cropListingSchema.index({ 'harvestDateRange.start': 1, 'harvestDateRange.end': 1 });

module.exports = mongoose.model('CropListing', cropListingSchema);
