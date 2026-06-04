const mongoose = require('mongoose');

const siteBannerSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['hero', 'destination'],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: '' },
    image: { type: String, required: true },
    link: { type: String, default: '' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteBanner', siteBannerSchema);
