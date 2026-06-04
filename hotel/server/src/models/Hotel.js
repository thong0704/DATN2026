const mongoose = require('mongoose');
const slugify = require('slugify');

const hotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    description: { type: String, default: '' },
    chain: { type: String, default: 'Independent', trim: true },
    stars: { type: Number, min: 1, max: 5, default: 3 },
    address: {
      street: String,
      city: { type: String, required: true, index: true },
      province: String,
      country: { type: String, default: 'Vietnam' },
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
    images: [{ url: String, public_id: String }],
    amenities: [{ type: String }],
    checkInTime: { type: String, default: '14:00' },
    checkOutTime: { type: String, default: '12:00' },
    policies: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    staff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    basePrice: { type: Number, default: 0 }, // denormalized lowest price for filtering
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

hotelSchema.index({ name: 'text', description: 'text', 'address.city': 'text' });
hotelSchema.index({ location: '2dsphere' });
hotelSchema.index({ stars: -1, avgRating: -1 });

hotelSchema.virtual('rooms', {
  ref: 'Room',
  localField: '_id',
  foreignField: 'hotel',
});

hotelSchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true }) + '-' + this._id.toString().slice(-5);
  }
  next();
});

module.exports = mongoose.model('Hotel', hotelSchema);
