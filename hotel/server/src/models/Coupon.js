const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String, default: '' },
    discountType: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
    discountValue: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, default: 0 }, // 0 = không giới hạn
    minOrderAmount: { type: Number, default: 0 },
    validFrom: { type: Date, default: Date.now },
    validTo: { type: Date },
    maxUses: { type: Number, default: 0 }, // 0 = không giới hạn
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    hotels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' }], // rỗng = áp mọi khách sạn của owner
  },
  { timestamps: true }
);

couponSchema.methods.computeDiscount = function (amount) {
  let d = this.discountType === 'percent' ? (amount * this.discountValue) / 100 : this.discountValue;
  if (this.maxDiscount > 0) d = Math.min(d, this.maxDiscount);
  return Math.min(Math.round(d), amount);
};

module.exports = mongoose.model('Coupon', couponSchema);
