const express = require('express');
const ctrl = require('../controllers/bookingController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/code/:code', ctrl.getByCode); 

router.use(protect);
router.post('/', ctrl.create);
router.get('/my-bookings', ctrl.myBookings);
router.get('/', restrictTo('admin', 'manager', 'staff'), ctrl.listAll);
router.get('/hotel/:hotelId', restrictTo('admin', 'manager', 'staff'), ctrl.byHotel);
router.get('/:id', ctrl.getById);
router.get('/:id/invoice', ctrl.downloadInvoice);
router.put('/:id/cancel', ctrl.cancel);
router.put('/:id/status', restrictTo('admin', 'manager', 'staff'), ctrl.updateStatus);

module.exports = router;
