const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    name: { type: String, required: true, index: true },
    businessType: { type: String, enum: ['farmer', 'aggregator', 'cooperative'], default: 'farmer' },
    location: { type: String, required: true },
    state: { type: String, required: true },
    district: { type: String },

    // Contact
    phone: { type: String },
    email: { type: String },

    // Performance Metrics
    rating: { type: Number, min: 0, max: 5, default: 4.0 },
    totalDeliveries: { type: Number, default: 0 },
    onTimeDeliveryRate: { type: Number, default: 95, min: 0, max: 100 },  // percentage
    reliability: { type: Number, default: 90, min: 0, max: 100 },

    // Crops they supply
    cropsSupplied: [{
        cropName: { type: String, required: true },
        avgPricePerKg: { type: Number, required: true },
        maxCapacityKg: { type: Number, default: 1000 },
        qualityGrade: { type: String, enum: ['A', 'B', 'C'], default: 'A' },
    }],

    // Verification
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    documentsSubmitted: { type: Boolean, default: false },

    // Geolocation
    coordinates: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        lat: { type: Number },
        lng: { type: Number },
    },
}, {
    timestamps: true
});

supplierSchema.index({ 'cropsSupplied.cropName': 1, rating: -1 });

module.exports = mongoose.model('Supplier', supplierSchema);
