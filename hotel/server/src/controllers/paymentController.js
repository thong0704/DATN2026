const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const paymentService = require('../services/paymentService');
const vnpayService = require('../services/vnpayService');
const momoService = require('../services/momoService');
const { notify } = require('../services/notificationService');
const { sendBookingConfirmationWithInvoice } = require('../services/emailService');
const logger = require('../utils/logger');


function formatVnDate(date) {
  const d = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const h = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  const s = String(d.getUTCSeconds()).padStart(2, '0');
  return `${y}${m}${day}${h}${min}${s}`;
}

exports.createIntent = catchAsync(async (req, res) => {
  const { bookingId, method = 'credit_card' } = req.body;
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError('Không tìm thấy đơn đặt phòng', 404);
  if (String(booking.customer) !== String(req.user._id)) throw new AppError('Bạn không có quyền thanh toán đơn này', 403);
  if (booking.paymentStatus === 'paid') throw new AppError('Đơn này đã được thanh toán', 400);

  const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  
  if (method === 'vnpay' || method === 'bank_transfer') {
    const { paymentUrl, orderId } = vnpayService.createPaymentUrl({
      amount: booking.pricing.total,
      bookingCode: booking.bookingCode,
      bookingId: String(booking._id),
      ipAddr,
    });
    await Payment.findOneAndUpdate(
      { booking: booking._id, status: 'pending' },
      {
        booking: booking._id,
        user: req.user._id,
        amount: booking.pricing.total,
        currency: 'VND',
        method: method === 'bank_transfer' ? 'bank_transfer' : 'vnpay',
        stripePaymentIntentId: orderId,
        status: 'pending',
      },
      { upsert: true, new: true }
    );
    return res.json({
      status: 'success',
      data: { paymentUrl, intentId: orderId, amount: booking.pricing.total, method },
    });
  }

  
  if (method === 'momo') {
    const { paymentUrl, orderId } = await momoService.createPaymentUrl({
      amount: booking.pricing.total,
      bookingCode: booking.bookingCode,
      bookingId: String(booking._id),
    });
    await Payment.findOneAndUpdate(
      { booking: booking._id, status: 'pending' },
      {
        booking: booking._id,
        user: req.user._id,
        amount: booking.pricing.total,
        currency: 'VND',
        method: 'momo',
        stripePaymentIntentId: orderId,
        status: 'pending',
      },
      { upsert: true, new: true }
    );
    return res.json({
      status: 'success',
      data: { paymentUrl, intentId: orderId, amount: booking.pricing.total, method },
    });
  }

  
  if (method === 'cash') {
    const mockId = `pi_cash_${Date.now()}`;
    await Payment.findOneAndUpdate(
      { booking: booking._id, status: 'pending' },
      {
        booking: booking._id,
        user: req.user._id,
        amount: booking.pricing.total,
        currency: 'VND',
        method: 'cash',
        stripePaymentIntentId: mockId,
        status: 'pending',
      },
      { upsert: true, new: true }
    );
    return res.json({
      status: 'success',
      data: { clientSecret: null, intentId: mockId, amount: booking.pricing.total, method },
    });
  }

  
  const intent = await paymentService.createPaymentIntent({
    amount: booking.pricing.total,
    currency: 'vnd',
    metadata: { bookingId: String(booking._id), bookingCode: booking.bookingCode },
  });

  
  await Payment.findOneAndUpdate(
    { booking: booking._id, status: 'pending' },
    {
      booking: booking._id,
      user: req.user._id,
      amount: booking.pricing.total,
      currency: 'VND',
      method: 'credit_card',
      stripePaymentIntentId: intent.id,
      status: 'pending',
    },
    { upsert: true, new: true }
  );

  res.json({
    status: 'success',
    data: { clientSecret: intent.client_secret, intentId: intent.id, amount: booking.pricing.total, method: 'credit_card' },
  });
});

exports.confirm = catchAsync(async (req, res) => {
  const { intentId } = req.body;

  
  if (intentId.startsWith('pi_cash_') || intentId.startsWith('pi_momo_') || intentId.startsWith('pi_vnpay_') || intentId.startsWith('pi_bank_transfer_')) {
    const payment = await Payment.findOneAndUpdate(
      { stripePaymentIntentId: intentId },
      { status: intentId.startsWith('pi_cash_') ? 'pending' : 'succeeded', paidAt: intentId.startsWith('pi_cash_') ? undefined : new Date() },
      { new: true }
    );
    if (!payment) throw new AppError('Không tìm thấy bản ghi thanh toán', 404);

    const newStatus = intentId.startsWith('pi_cash_') ? 'pending' : 'paid';
    const paymentStatus = intentId.startsWith('pi_cash_') ? 'pending' : 'paid';

    const booking = await Booking.findByIdAndUpdate(
      payment.booking,
      { status: newStatus, paymentStatus, paymentId: payment._id },
      { new: true }
    );

    notify({
      user: payment.user,
      type: 'booking_paid',
      title: intentId.startsWith('pi_cash_') ? 'Booking pending' : 'Payment successful',
      message: `Booking ${booking.bookingCode} ${intentId.startsWith('pi_cash_') ? 'pending - pay at check-in' : 'has been paid'}`,
      data: { bookingId: booking._id },
    }).catch(() => {});

    
    if (!intentId.startsWith('pi_cash_')) {
      const User = require('../models/User');
      User.findById(payment.user).then(u => {
        if (u?.email) sendBookingConfirmationWithInvoice(u.email, booking).catch(() => {});
      }).catch(() => {});
    }

    return res.json({ status: 'success', data: { booking, payment } });
  }

  
  const intent = await paymentService.retrievePaymentIntent(intentId);
  if (intent.status !== 'succeeded') throw new AppError('Thanh toán chưa hoàn tất', 400);

  const payment = await Payment.findOneAndUpdate(
    { stripePaymentIntentId: intentId },
    { status: 'succeeded', paidAt: new Date(), stripeChargeId: intent.latest_charge || '' },
    { new: true }
  );
  if (!payment) throw new AppError('Không tìm thấy bản ghi thanh toán', 404);

  const booking = await Booking.findByIdAndUpdate(
    payment.booking,
    { status: 'paid', paymentStatus: 'paid', paymentId: payment._id },
    { new: true }
  );

  notify({
    user: payment.user,
    type: 'booking_paid',
    title: 'Payment successful',
    message: `Booking ${booking.bookingCode} has been paid`,
    data: { bookingId: booking._id },
  }).catch(() => {});

  
  const User = require('../models/User');
  User.findById(payment.user).then(u => {
    if (u?.email) sendBookingConfirmationWithInvoice(u.email, booking).catch(() => {});
  }).catch(() => {});

  res.json({ status: 'success', data: { booking, payment } });
});




exports.webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = paymentService.constructWebhookEvent(req.body, sig);
  } catch (err) {
    logger.error('Webhook signature failed: ' + err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      const payment = await Payment.findOneAndUpdate(
        { stripePaymentIntentId: pi.id },
        { status: 'succeeded', paidAt: new Date(), stripeChargeId: pi.latest_charge || '' },
        { new: true }
      );
      if (payment) {
        await Booking.findByIdAndUpdate(payment.booking, {
          status: 'paid',
          paymentStatus: 'paid',
          paymentId: payment._id,
        });
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object;
      await Payment.findOneAndUpdate({ stripePaymentIntentId: pi.id }, { status: 'failed' });
    }
  } catch (e) {
    logger.error('Webhook handler error: ' + e.message);
  }
  res.json({ received: true });
};

exports.refund = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) throw new AppError('Không tìm thấy đơn đặt phòng', 404);
  const payment = await Payment.findOne({ booking: booking._id, status: 'succeeded' });
  if (!payment) throw new AppError('Không tìm thấy giao dịch đã thanh toán để hoàn tiền', 400);

  const refundAmount = req.body.amount || payment.amount;
  const reason = req.body.reason || 'Hoàn tiền theo yêu cầu';
  let refundResult;

  const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  switch (payment.method) {
    case 'vnpay':
    case 'bank_transfer': {
      refundResult = await vnpayService.refund({
        txnRef: payment.stripePaymentIntentId,
        amount: refundAmount,
        transactionDate: payment.paidAt ? formatVnDate(payment.paidAt) : undefined,
        transactionId: payment.transactionId || '',
        reason,
        ipAddr,
      });
      break;
    }
    case 'momo': {
      if (!payment.transactionId) throw new AppError('Thiếu mã giao dịch MoMo (transId) để hoàn tiền', 400);
      refundResult = await momoService.refund({
        orderId: payment.stripePaymentIntentId,
        amount: refundAmount,
        transId: payment.transactionId,
        description: reason,
      });
      break;
    }
    case 'credit_card': {
      const stripeRefund = await paymentService.refund({
        paymentIntentId: payment.stripePaymentIntentId,
        amount: refundAmount,
        reason,
      });
      refundResult = { success: true, refundId: stripeRefund.id, data: stripeRefund };
      break;
    }
    case 'cash': {
      
      refundResult = { success: true, refundId: `cash_refund_${Date.now()}` };
      break;
    }
    default:
      throw new AppError(`Phương thức thanh toán "${payment.method}" không hỗ trợ hoàn tiền tự động`, 400);
  }

  payment.status = 'refunded';
  payment.refundAmount = refundAmount;
  payment.refundReason = reason;
  await payment.save();

  booking.status = 'refunded';
  booking.paymentStatus = 'refunded';
  await booking.save();

  logger.info(`Refund success: booking=${booking.bookingCode}, method=${payment.method}, amount=${refundAmount}`);

  res.json({ status: 'success', data: { refundId: refundResult.refundId, payment, booking } });
});

exports.getByBooking = catchAsync(async (req, res) => {
  const payment = await Payment.findOne({ booking: req.params.bookingId });
  res.json({ status: 'success', data: { payment } });
});


exports.vnpayReturn = catchAsync(async (req, res) => {
  const { isValid, responseCode, txnRef } = vnpayService.verifyReturnUrl(req.query);
  if (!isValid) throw new AppError('Chữ ký VNPay không hợp lệ', 400);

  const payment = await Payment.findOne({ stripePaymentIntentId: txnRef });
  if (!payment) throw new AppError('Không tìm thấy giao dịch thanh toán', 404);

  if (responseCode === '00') {
    payment.status = 'succeeded';
    payment.paidAt = new Date();
    payment.transactionId = req.query['vnp_TransactionNo'] || '';
    await payment.save();
    await Booking.findByIdAndUpdate(payment.booking, {
      status: 'paid',
      paymentStatus: 'paid',
      paymentId: payment._id,
    });
    notify({
      user: payment.user,
      type: 'booking_paid',
      title: 'Payment successful',
      message: `Booking has been paid via VNPay`,
      data: { bookingId: payment.booking },
    }).catch(() => {});

    const User = require('../models/User');
    const bk = await Booking.findById(payment.booking);
    User.findById(payment.user).then(u => {
      if (u?.email && bk) sendBookingConfirmationWithInvoice(u.email, bk).catch(() => {});
    }).catch(() => {});
  } else {
    payment.status = 'failed';
    await payment.save();
  }

  res.json({ status: 'success', data: { resultCode: responseCode, bookingId: payment.booking } });
});


exports.vnpayIpn = catchAsync(async (req, res) => {
  const { isValid, responseCode, txnRef } = vnpayService.verifyReturnUrl(req.query);
  if (!isValid) return res.json({ RspCode: '97', Message: 'Invalid signature' });

  const payment = await Payment.findOne({ stripePaymentIntentId: txnRef });
  if (!payment) return res.json({ RspCode: '01', Message: 'Order not found' });
  if (payment.status === 'succeeded') return res.json({ RspCode: '02', Message: 'Already processed' });

  if (responseCode === '00') {
    payment.status = 'succeeded';
    payment.paidAt = new Date();
    payment.transactionId = req.query['vnp_TransactionNo'] || '';
    await payment.save();
    await Booking.findByIdAndUpdate(payment.booking, {
      status: 'paid',
      paymentStatus: 'paid',
      paymentId: payment._id,
    });
  } else {
    payment.status = 'failed';
    await payment.save();
  }
  res.json({ RspCode: '00', Message: 'Confirmed' });
});


exports.momoIpn = catchAsync(async (req, res) => {
  const { isValid, resultCode, orderId, extraData, transId } = momoService.verifyIpn(req.body);
  if (!isValid) return res.status(400).json({ message: 'Invalid signature' });

  const payment = await Payment.findOne({ stripePaymentIntentId: orderId });
  if (!payment) return res.status(404).json({ message: 'Không tìm thấy giao dịch' });

  if (resultCode === 0 || resultCode === '0') {
    payment.transactionId = transId || '';
    payment.status = 'succeeded';
    payment.paidAt = new Date();
    await payment.save();
    await Booking.findByIdAndUpdate(payment.booking, {
      status: 'paid',
      paymentStatus: 'paid',
      paymentId: payment._id,
    });
    notify({
      user: payment.user,
      type: 'booking_paid',
      title: 'Payment successful',
      message: `Booking has been paid via MoMo`,
      data: { bookingId: payment.booking },
    }).catch(() => {});

    const User = require('../models/User');
    const bk = await Booking.findById(payment.booking);
    User.findById(payment.user).then(u => {
      if (u?.email && bk) sendBookingConfirmationWithInvoice(u.email, bk).catch(() => {});
    }).catch(() => {});
  } else {
    payment.status = 'failed';
    await payment.save();
  }
  res.json({ status: 'success' });
});


exports.momoReturn = catchAsync(async (req, res) => {
  const { orderId, resultCode, transId } = req.query;
  const payment = await Payment.findOne({ stripePaymentIntentId: orderId });
  if (!payment) throw new AppError('Không tìm thấy giao dịch thanh toán', 404);

  
  if (payment.status !== 'succeeded' && (resultCode === '0' || resultCode === 0)) {
    payment.status = 'succeeded';
    payment.paidAt = new Date();
    if (transId) payment.transactionId = transId;
    await payment.save();
    await Booking.findByIdAndUpdate(payment.booking, {
      status: 'paid',
      paymentStatus: 'paid',
      paymentId: payment._id,
    });
  }

  res.json({ status: 'success', data: { resultCode: String(resultCode), bookingId: payment.booking } });
});





exports.adminList = catchAsync(async (req, res) => {
  const { q, status, method, dateFrom, dateTo } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

  const filter = {};
  if (status) filter.status = status;
  if (method) filter.method = method;
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) {
      const dt = new Date(dateTo);
      dt.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = dt;
    }
  }

  
  
  if (q && q.trim()) {
    const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const User = require('../models/User');
    const [users, bookings] = await Promise.all([
      User.find({ $or: [{ name: rx }, { email: rx }] }).select('_id'),
      Booking.find({ bookingCode: rx }).select('_id'),
    ]);
    filter.$or = [
      { user: { $in: users.map((u) => u._id) } },
      { booking: { $in: bookings.map((b) => b._id) } },
      { stripePaymentIntentId: rx },
    ];
  }

  const total = await Payment.countDocuments(filter);
  const items = await Payment.find(filter)
    .populate({ path: 'booking', select: 'bookingCode checkIn checkOut nights pricing status hotel room', populate: [{ path: 'hotel', select: 'name' }, { path: 'room', select: 'roomNumber type' }] })
    .populate({ path: 'user', select: 'name email phone' })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  
  const [stats] = await Payment.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        succeededAmount: { $sum: { $cond: [{ $eq: ['$status', 'succeeded'] }, '$amount', 0] } },
        refundedAmount: { $sum: '$refundAmount' },
        count: { $sum: 1 },
      },
    },
  ]);

  res.json({
    status: 'success',
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
    data: { invoices: items, stats: stats || { totalAmount: 0, succeededAmount: 0, refundedAmount: 0, count: 0 } },
  });
});




exports.getInvoice = catchAsync(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate({
      path: 'booking',
      populate: [{ path: 'hotel', select: 'name address phone email' }, { path: 'room', select: 'roomNumber type' }],
    })
    .populate({ path: 'user', select: 'name email phone' });

  if (!payment) throw new AppError('Invoice not found', 404);

  
  if (req.user.role === 'customer' && String(payment.user._id || payment.user) !== String(req.user._id)) {
    throw new AppError('Forbidden', 403);
  }

  res.json({ status: 'success', data: { invoice: payment } });
});




exports.markPaid = catchAsync(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new AppError('Invoice not found', 404);
  if (payment.status === 'succeeded') throw new AppError('Already paid', 400);

  payment.status = 'succeeded';
  payment.paidAt = new Date();
  await payment.save();

  await Booking.findByIdAndUpdate(payment.booking, {
    status: 'paid',
    paymentStatus: 'paid',
    paymentId: payment._id,
  });

  notify({
    user: payment.user,
    type: 'booking_paid',
    title: 'Payment confirmed',
    message: `Invoice ${payment._id} has been marked as paid`,
    data: { paymentId: payment._id },
  }).catch(() => {});

  
  const User = require('../models/User');
  const bk = await Booking.findById(payment.booking);
  User.findById(payment.user).then(u => {
    if (u?.email && bk) sendBookingConfirmationWithInvoice(u.email, bk).catch(() => {});
  }).catch(() => {});

  res.json({ status: 'success', data: { payment } });
});




exports.myInvoices = catchAsync(async (req, res) => {
  const items = await Payment.find({ user: req.user._id })
    .populate({ path: 'booking', select: 'bookingCode checkIn checkOut nights pricing hotel room', populate: [{ path: 'hotel', select: 'name' }, { path: 'room', select: 'roomNumber type' }] })
    .sort({ createdAt: -1 });
  res.json({ status: 'success', data: { invoices: items } });
});

