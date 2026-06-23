const mongoose = require('mongoose');

const holidayPricingSchema = new mongoose.Schema(
  {
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
    name: { type: String, required: true, trim: true }, 
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    multiplier: { type: Number, default: 1.5, min: 1 }, 
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

holidayPricingSchema.index({ hotel: 1, from: 1, to: 1 });

module.exports = mongoose.model('HolidayPricing', holidayPricingSchema);
