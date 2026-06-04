const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
    roomNumber: { type: String, required: true },
    type: {
      type: String,
      enum: ['basic', 'standard', 'vip'],
      default: 'standard',
      index: true,
    },
    floor: { type: Number, default: 1 },
    capacity: {
      adults: { type: Number, default: 2, min: 1 },
      children: { type: Number, default: 0, min: 0 },
    },
    bedType: { type: String, default: 'Queen' },
    size: { type: Number, default: 25 }, // m²
    pricePerNight: { type: Number, required: true, min: 0 },
    weekendPrice: { type: Number, default: 0 },
    seasonalPricing: [
      { from: Date, to: Date, price: Number, label: String },
    ],
    amenities: [String],
    images: [{ url: String, public_id: String }],
    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance', 'cleaning'],
      default: 'available',
      index: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

roomSchema.index({ hotel: 1, roomNumber: 1 }, { unique: true });
roomSchema.index({ hotel: 1, type: 1, pricePerNight: 1 });

module.exports = mongoose.model('Room', roomSchema);
