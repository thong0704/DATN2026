const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'VND' },
    method: {
      type: String,
      enum: ['credit_card', 'bank_transfer', 'cash', 'momo', 'vnpay'],
      default: 'credit_card',
    },
    stripePaymentIntentId: { type: String, index: true },
    stripeChargeId: String,
    transactionId: { type: String },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    refundAmount: { type: Number, default: 0 },
    refundReason: String,
    receiptUrl: String,
    paidAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
