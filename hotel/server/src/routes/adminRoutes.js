const express = require('express');
const ctrl = require('../controllers/adminController');
const bookingCtrl = require('../controllers/bookingController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect, restrictTo('admin', 'manager'));

router.get('/dashboard', ctrl.dashboard);
router.get('/dashboard-rich', ctrl.dashboardRich);
router.get('/analytics/revenue', ctrl.revenueAnalytics);
router.get('/analytics/occupancy', ctrl.occupancyAnalytics);
router.get('/analytics/top-hotels', ctrl.topHotels);
router.get('/users', restrictTo('admin'), ctrl.listUsers);
router.put('/users/:id/role', restrictTo('admin'), ctrl.updateUserRole);
router.put('/users/:id', restrictTo('admin'), ctrl.updateUser);
router.post('/users', restrictTo('admin'), ctrl.createUser);
router.get('/bookings', bookingCtrl.listAll);
router.get('/reports/export', restrictTo('admin'), ctrl.exportReport);

module.exports = router;
