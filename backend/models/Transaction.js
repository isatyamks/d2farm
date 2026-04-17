const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // Nullable if it's a top-up
  
  amount: { type: Number, required: true },
  type: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
  
  purpose: { 
    type: String, 
    enum: ['DEPOSIT_PAYMENT', 'FINAL_PAYMENT', 'WALLET_TOPUP', 'PARTIAL_ORDER_REFUND'], 
    required: true 
  },
  
  status: { 
    type: String, 
    enum: ['PENDING', 'SUCCESS', 'FAILED'], 
    default: 'SUCCESS' 
  },
  
  balanceAfter: { type: Number }, // Snapshot of wallet balance after transaction
  
  paymentMethod: { type: String, enum: ['WALLET', 'CREDIT_CARD', 'UPI', 'BANK_TRANSFER'], default: 'WALLET' },
  referenceId: { type: String } // Gateway transaction ID
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);
