const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true },
    comment: { type: String, trim: true },
    images: [String],
    cleanliness: { type: Number, min: 1, max: 5 },
    service: { type: Number, min: 1, max: 5 },
    location: { type: Number, min: 1, max: 5 },
    value: { type: Number, min: 1, max: 5 },
    response: {
      text: String,
      respondedAt: Date,
      respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    isVerified: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true }
);

reviewSchema.index({ hotel: 1, user: 1, booking: 1 }, { unique: true });


reviewSchema.statics.recalcHotelRating = async function (hotelId) {
  const stats = await this.aggregate([
    { $match: { hotel: new mongoose.Types.ObjectId(hotelId), isApproved: true } },
    { $group: { _id: '$hotel', avg: { $avg: '$rating' }, total: { $sum: 1 } } },
  ]);
  const Hotel = mongoose.model('Hotel');
  if (stats.length) {
    await Hotel.findByIdAndUpdate(hotelId, {
      avgRating: Math.round(stats[0].avg * 10) / 10,
      totalReviews: stats[0].total,
    });
  } else {
    await Hotel.findByIdAndUpdate(hotelId, { avgRating: 0, totalReviews: 0 });
  }
};

reviewSchema.post('save', function () {
  this.constructor.recalcHotelRating(this.hotel);
});
reviewSchema.post('findOneAndDelete', function (doc) {
  if (doc) doc.constructor.recalcHotelRating(doc.hotel);
});

module.exports = mongoose.model('Review', reviewSchema);
