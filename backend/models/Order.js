const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyerName: { type: String, required: true },
  crop: { type: String, required: true },
  variety: { type: String, default: 'Standard' },
  quantityRequired: { type: Number, required: true },
  unit: { type: String, default: 'kg' },
  priceOffered: { type: Number, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  status: { type: String, default: 'Open' }
}, {
  timestamps: true
});

orderSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Order', orderSchema);
