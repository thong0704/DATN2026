const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: { type: String, unique: true, required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', index: true }, // legacy single room
    rooms: [
      {
        room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
        roomTotal: { type: Number, default: 0 },
      },
    ],
    checkIn: { type: Date, required: true, index: true },
    checkOut: { type: Date, required: true, index: true },
    nights: { type: Number, required: true, min: 1 },
    guests: {
      adults: { type: Number, default: 1, min: 1 },
      children: { type: Number, default: 0, min: 0 },
    },
    guestInfo: {
      name: String,
      email: String,
      phone: String,
      idCard: String,
    },
    specialRequests: String,
    services: [{ name: String, price: Number, qty: { type: Number, default: 1 } }],
    pricing: {
      roomTotal: { type: Number, default: 0 },
      servicesTotal: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'paid', 'checked_in', 'checked_out', 'cancelled', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'pending', 'partially_paid', 'paid', 'refunded'],
      default: 'unpaid',
    },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    cancelReason: String,
    cancelledAt: Date,
  },
  { timestamps: true }
);

// Compound index used by availability lookup
bookingSchema.index({ room: 1, checkIn: 1, checkOut: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
