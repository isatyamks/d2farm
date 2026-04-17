const mongoose = require('mongoose');

const priceForecastSchema = new mongoose.Schema({
    cropName: { type: String, required: true, index: true },
    weekNumber: { type: Number, required: true },                         // 1=current, 2,3,4=future
    weekLabel: { type: String, required: true },                          // "Current Week", "Week 2"

    predictedNeedKg: { type: Number, required: true },
    expectedPricePerKg: { type: Number, required: true },
    confidence: { type: Number, min: 0, max: 100, required: true },
    supplyOutlook: { type: String, enum: ['tight', 'balanced', 'surplus'], default: 'balanced' },

    // ML Model metadata
    modelVersion: { type: String, default: 'v1.2' },
    generatedAt: { type: Date, default: Date.now },
    validUntil: { type: Date },

    // Contributing factors
    factors: {
        weatherImpact: { type: Number, default: 0 },                     // -1 to 1 scale
        demandSurge: { type: Number, default: 0 },
        supplyDisruption: { type: Number, default: 0 },
        seasonalAdjustment: { type: Number, default: 0 },
    },
}, {
    timestamps: true
});

priceForecastSchema.index({ cropName: 1, weekNumber: 1 }, { unique: true });

module.exports = mongoose.model('PriceForecast', priceForecastSchema);
