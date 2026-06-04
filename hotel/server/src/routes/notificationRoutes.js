const express = require('express');
const Notification = require('../models/Notification');
const { protect } = require('../middlewares/authMiddleware');
const catchAsync = require('../utils/catchAsync');

const router = express.Router();
router.use(protect);

router.get(
  '/',
  catchAsync(async (req, res) => {
    const items = await Notification.find({
      $or: [{ user: req.user._id }, { audience: req.user.role }, { audience: 'all' }],
    })
      .sort('-createdAt')
      .limit(50);
    res.json({ status: 'success', results: items.length, data: { notifications: items } });
  })
);

router.put(
  '/:id/read',
  catchAsync(async (req, res) => {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ status: 'success' });
  })
);

router.put(
  '/read-all',
  catchAsync(async (req, res) => {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ status: 'success' });
  })
);

module.exports = router;
