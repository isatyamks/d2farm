const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
  farmerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'FarmerProfile', 
    required: true, 
    index: true 
  },
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order', 
    required: true 
  },
  cropListingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'CropListing' 
  },

  // Proposal Details
  proposedQuantity: { type: Number, required: true },
  proposedPricePerUnit: { type: Number, required: true },
  message: { type: String, default: '' }, // Optional farmer note

  // Lifecycle Status
  status: {
    type: String,
    enum: [
      'SENT',
      'ACCEPTED',
      'REJECTED',
      'LOGISTICS_DISPATCHED',
      'DELIVERED',
      'PAYMENT_RECEIVED'
    ],
    default: 'SENT'
  },

  // Full timeline for the Transaction Tracker view
  timeline: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String, default: '' }
  }],

  // Payment details
  totalValue: { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PARTIAL', 'ESCROW_LOCKED', 'COMPLETED'],
    default: 'PENDING'
  },

  // Blockchain
  blockchainTxHash: { type: String, default: null }
}, {
  timestamps: true
});

// Auto-push initial timeline entry on creation
proposalSchema.pre('save', function(next) {
  if (this.isNew) {
    this.timeline.push({
      status: 'SENT',
      timestamp: new Date(),
      note: 'Proposal submitted to buyer'
    });
    this.totalValue = this.proposedQuantity * this.proposedPricePerUnit;
  }
  next();
});

module.exports = mongoose.model('Proposal', proposalSchema);
