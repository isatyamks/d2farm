const mongoose = require('mongoose');

const consumptionLogSchema = new mongoose.Schema({
    cropName: { type: String, required: true, index: true },              // "Tomato"
    buyerName: { type: String, required: true },                          // "Grand Hotel Kitchens"
    quantityKg: { type: Number, required: true },
    pricePerKg: { type: Number, required: true },
    totalCost: { type: Number, required: true },
    variety: { type: String, default: 'Standard' },

    // Date tracking
    orderDate: { type: Date, required: true, index: true },
    deliveryDate: { type: Date },
    weekNumber: { type: Number },                                          // 1-52
    monthNumber: { type: Number },                                         // 1-12

    // Quality & Fulfillment
    qualityScore: { type: Number, min: 1, max: 5, default: 4 },
    fulfillmentStatus: { type: String, enum: ['completed', 'partial', 'cancelled'], default: 'completed' },
    spoilagePercentage: { type: Number, default: 0, min: 0, max: 100 },

    // Source
    supplierName: { type: String },
    supplierLocation: { type: String },
}, {
    timestamps: true
});

// Compound index for fast aggregation queries
consumptionLogSchema.index({ cropName: 1, orderDate: -1 });
consumptionLogSchema.index({ buyerName: 1, cropName: 1 });

module.exports = mongoose.model('ConsumptionLog', consumptionLogSchema);
