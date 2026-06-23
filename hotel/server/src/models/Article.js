const mongoose = require('mongoose');
const slugify = require('slugify');

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    summary: { type: String, default: '' },
    content: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    couponCode: { type: String, default: '' }, 
    tags: [{ type: String }],
    isPublished: { type: Boolean, default: true },
    views: { type: Number, default: 0 },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

articleSchema.pre('save', function (next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true }) + '-' + this._id.toString().slice(-5);
  }
  next();
});

module.exports = mongoose.model('Article', articleSchema);
