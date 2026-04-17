const mongoose = require('mongoose');

const cropProfileSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, index: true },   // "Tomato"
    varieties: [{ type: String }],                                        // ["Hybrid", "Cherry", "Roma"]
    category: { type: String, enum: ['perishable', 'semi-perishable', 'stable'], required: true },
    seasonality: { type: String, enum: ['high', 'medium', 'low'], required: true },
    shelfLife: { type: String, required: true },                          // "3-4 days"
    refrigerationRequired: { type: Boolean, default: false },

    // Pricing parameters
    basePrice: { type: Number, required: true },                          // ₹/kg base market price
    baseCost: { type: Number, required: true },                           // ₹/kg cultivation cost
    mspPrice: { type: Number, default: 0 },                               // Minimum Support Price

    // Consumption intelligence
    avgMonthlyConsumption: { type: Number, required: true },              // kg per month (buyer average)
    peakSeasonMonths: [{ type: Number }],                                  // [3, 4, 5] = Mar-May
    riskFactors: [{ type: String }],                                       // ["weather", "pest", "transport_delay"]

    // Metadata
    iconEmoji: { type: String, default: '🌱' },
    colorHex: { type: String, default: '#10B981' },
    unit: { type: String, default: 'kg' },
}, {
    timestamps: true
});

module.exports = mongoose.model('CropProfile', cropProfileSchema);
