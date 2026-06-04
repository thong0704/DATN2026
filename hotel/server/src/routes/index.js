const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/hotels', require('./hotelRoutes'));
router.use('/rooms', require('./roomRoutes'));
router.use('/bookings', require('./bookingRoutes'));
router.use('/payments', require('./paymentRoutes'));
router.use('/reviews', require('./reviewRoutes'));
router.use('/admin', require('./adminRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/coupons', require('./couponRoutes'));
router.use('/chatbot', require('./chatbotRoutes'));
router.use('/', require('./contentRoutes'));

module.exports = router;
