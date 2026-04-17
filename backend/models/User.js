const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  role: { 
    type: String, 
    enum: ['BUYER', 'FARMER', 'ADMIN'], 
    required: true,
    index: true 
  },
  businessName: { 
    type: String, 
    required: true 
  },
  contact: {
    email: { type: String, unique: true },
    phone: { type: String, required: true },
    address: { type: String }
  },
  
  // Wallet System
  wallet: {
    balance: { type: Number, default: 50000 },        // Available to spend
    lockedBalance: { type: Number, default: 0 },      // Escrowed (deducted but not yet paid out)
    creditLimit: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' }
  },
  
  // Smart Metrics (Feeds the Profile & Trust Score UI)
  metrics: {
    trustScore: { type: Number, default: 100, min: 0, max: 100 },
    totalOrders: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    cancelledOrders: { type: Number, default: 0 },
    orderCompletionRate: { type: Number, default: 100 }, // Percentage
  },
  
  joinedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
