const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    audience: { type: String, enum: ['user', 'staff', 'admin', 'all'], default: 'user' },
    type: {
      type: String,
      enum: [
        'booking_created',
        'booking_cancelled',
        'booking_paid',
        'booking_status',
        'review_created',
        'system',
      ],
      default: 'system',
    },
    title: String,
    message: String,
    link: String,
    data: mongoose.Schema.Types.Mixed,
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
