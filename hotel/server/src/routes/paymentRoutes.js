const express = require('express');
const ctrl = require('../controllers/paymentController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

// Webhook is mounted with raw body in app.js BEFORE this router on the same path.
router.post('/webhook', express.raw({ type: 'application/json' }), ctrl.webhook);

// Payment gateway callbacks (no auth required - called by gateway)
router.get('/vnpay-return', ctrl.vnpayReturn);
router.get('/vnpay-ipn', ctrl.vnpayIpn);
router.post('/momo-ipn', ctrl.momoIpn);
router.get('/momo-return', ctrl.momoReturn);

router.use(protect);
router.post('/create-intent', ctrl.createIntent);
router.post('/confirm', ctrl.confirm);
router.get('/booking/:bookingId', ctrl.getByBooking);

// Invoice management
router.get('/my', ctrl.myInvoices);
router.get('/admin/list', restrictTo('admin', 'manager', 'staff'), ctrl.adminList);
router.patch('/admin/:id/mark-paid', restrictTo('admin', 'manager', 'staff'), ctrl.markPaid);
router.get('/invoice/:id', ctrl.getInvoice);

router.post('/refund/:bookingId', restrictTo('admin'), ctrl.refund);

module.exports = router;
