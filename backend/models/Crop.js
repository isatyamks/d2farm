const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true }, // e.g., 'Tomato (Hybrid)'
  category: { type: String, enum: ['VEGETABLE', 'FRUIT', 'GRAIN'], default: 'VEGETABLE' },
  
  // Real-time market insights
  marketData: {
    currentPricePerKg: { type: Number, required: true },
    priceTrend: { type: String, enum: ['UP', 'DOWN', 'STABLE'], default: 'STABLE' },
    trendPercentage: { type: Number, default: 0 }, // e.g., +12%
    supplyCondition: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' }
  },

  // Time-series array for the historical pricing chart (Procurement AI)
  priceHistory: [{
    weekStartDate: { type: Date },
    weekEndDate: { type: Date },
    averagePrice: { type: Number },
    note: { type: String } // e.g., "Price spiked due to low supply"
  }],

  // Total global supply predicted to be available across all farmers
  totalAvailableSupply: {
    quantityKg: { type: Number, default: 0 },
    lastComputedAt: { type: Date, default: Date.now }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Crop', cropSchema);
