const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { generateBookingCode } = require('../utils/helpers');
const {
  isRoomAvailable,
  computeBookingPricing,
} = require('../services/availabilityService');
const { sendBookingConfirmation, sendBookingCancelled } = require('../services/emailService');
const { notify, emitToHotel } = require('../services/notificationService');
const { streamInvoicePdf } = require('../services/invoiceService');

/**
 * Create a booking using a transaction to prevent race conditions
 * where two requests try to book the same room/dates simultaneously.
 */
exports.create = catchAsync(async (req, res) => {
  const { roomId, checkIn, checkOut, guests, guestInfo, specialRequests, services, couponCode } = req.body;
  if (!roomId || !checkIn || !checkOut) throw new AppError('Vui lòng điền đầy đủ thông tin bắt buộc', 400);

  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  if (outDate <= inDate) throw new AppError('Ngày trả phòng phải sau ngày nhận phòng', 400);
  if (inDate < new Date(new Date().toDateString())) {
    throw new AppError('Ngày nhận phòng không được ở quá khứ', 400);
  }

  // Transactions require a replica set; gracefully degrade if standalone.
  const useTxn = mongoose.connection.client?.topology?.s?.description?.type !== 'Single';
  const session = useTxn ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  try {
    const room = await Room.findById(roomId).session(session || null);
    if (!room) throw new AppError('Không tìm thấy phòng', 404);
    if (!room.isActive) throw new AppError('Phòng hiện không khả dụng', 400);

    const available = await isRoomAvailable({ roomId, checkIn: inDate, checkOut: outDate, session });
    if (!available) throw new AppError('Phòng đã được đặt trong khoảng thời gian này', 409);

    const { nights, pricing } = await computeBookingPricing({
      room,
      checkIn: inDate,
      checkOut: outDate,
      services: services || [],
    });

    // Apply coupon if provided
    let appliedCoupon = null;
    if (couponCode) {
      const Coupon = require('../models/Coupon');
      const coupon = await Coupon.findOne({ code: String(couponCode).toUpperCase(), isActive: true }).session(session || null);
      const now = new Date();
      if (
        coupon &&
        (!coupon.validFrom || now >= coupon.validFrom) &&
        (!coupon.validTo || now <= coupon.validTo) &&
        (coupon.maxUses === 0 || coupon.usedCount < coupon.maxUses) &&
        (!coupon.minOrderAmount || pricing.total >= coupon.minOrderAmount) &&
        (!coupon.hotels?.length || coupon.hotels.map(String).includes(String(room.hotel)))
      ) {
        const discount = coupon.computeDiscount(pricing.total);
        pricing.discount = (pricing.discount || 0) + discount;
        pricing.total = Math.max(0, pricing.total - discount);
        appliedCoupon = coupon;
      }
    }

    const bookingDoc = {
      bookingCode: generateBookingCode(),
      customer: req.user._id,
      hotel: room.hotel,
      room: room._id,
      checkIn: inDate,
      checkOut: outDate,
      nights,
      guests: guests || { adults: 1, children: 0 },
      guestInfo: guestInfo || {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
      },
      specialRequests,
      services: services || [],
      pricing,
      status: 'pending',
      paymentStatus: 'unpaid',
    };

    const [booking] = await Booking.create([bookingDoc], { session: session || undefined });

    await User.findByIdAndUpdate(req.user._id, { $push: { bookingHistory: booking._id } }, { session: session || undefined });

    // Increment coupon usage count
    if (appliedCoupon) {
      await require('../models/Coupon').findByIdAndUpdate(
        appliedCoupon._id,
        { $inc: { usedCount: 1 } },
        { session: session || undefined }
      );
    }

    if (session) await session.commitTransaction();

    // Side-effects (don't block response)
    sendBookingConfirmation(req.user.email, booking).catch(() => {});
    notify({
      audience: 'staff',
      type: 'booking_created',
      title: 'New booking',
      message: `Booking ${booking.bookingCode} created`,
      link: `/admin/bookings/${booking._id}`,
      data: { bookingId: booking._id, hotelId: booking.hotel },
    }).catch(() => {});
    emitToHotel(booking.hotel, 'booking_created', { bookingId: booking._id });

    res.status(201).json({ status: 'success', data: { booking } });
  } catch (err) {
    if (session) await session.abortTransaction();
    throw err;
  } finally {
    if (session) session.endSession();
  }
});

exports.myBookings = catchAsync(async (req, res) => {
  const filter = { customer: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  const bookings = await Booking.find(filter)
    .populate('hotel', 'name address images slug')
    .populate('room', 'roomNumber type images')
    .sort('-createdAt');
  res.json({ status: 'success', results: bookings.length, data: { bookings } });
});

exports.getById = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('hotel')
    .populate('room')
    .populate('customer', 'name email phone')
    .populate('paymentId');
  if (!booking) throw new AppError('Không tìm thấy đơn đặt phòng', 404);
  // Only owner or staff/admin can view
  if (
    String(booking.customer._id) !== String(req.user._id) &&
    !['admin', 'manager', 'staff'].includes(req.user.role)
  ) {
    throw new AppError('Bạn không có quyền xem đơn này', 403);
  }
  res.json({ status: 'success', data: { booking } });
});

exports.getByCode = catchAsync(async (req, res) => {
  const booking = await Booking.findOne({ bookingCode: req.params.code })
    .populate('hotel', 'name address')
    .populate('room', 'roomNumber type');
  if (!booking) throw new AppError('Không tìm thấy đơn đặt phòng với mã này', 404);
  res.json({ status: 'success', data: { booking } });
});

exports.cancel = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('hotel', 'name');
  if (!booking) throw new AppError('Không tìm thấy đơn đặt phòng', 404);
  if (
    String(booking.customer) !== String(req.user._id) &&
    !['admin', 'manager', 'staff'].includes(req.user.role)
  ) {
    throw new AppError('Bạn không có quyền hủy đơn này', 403);
  }

  // Only pending/confirmed/paid can be cancelled
  const cancellable = ['pending', 'confirmed', 'paid'];
  if (!cancellable.includes(booking.status)) {
    throw new AppError(`Không thể hủy đơn ở trạng thái "${booking.status}"`, 400);
  }

  // Policy: if paid and less than 24h before check-in, mark as late cancellation
  const hoursUntil = (new Date(booking.checkIn) - new Date()) / (1000 * 60 * 60);
  const isLateCancellation = hoursUntil < 24 && booking.paymentStatus === 'paid';

  booking.status = 'cancelled';
  booking.cancelReason = req.body.reason || 'Khách hàng yêu cầu hủy';
  booking.cancelledAt = new Date();

  // If already paid, set paymentStatus to trigger refund flow
  if (booking.paymentStatus === 'paid') {
    booking.paymentStatus = isLateCancellation ? 'paid' : 'refunded';
    // Note: actual refund via payment gateway is handled by admin (UC-15)
    // For late cancellation, admin decides refund amount manually
  }

  await booking.save();

  // Send cancellation email
  const recipientEmail = booking.guestInfo?.email || req.user.email;
  sendBookingCancelled(recipientEmail, booking).catch(() => {});

  // Notify the customer via socket
  notify({
    user: booking.customer,
    audience: 'user',
    type: 'booking_cancelled',
    title: 'Đặt phòng đã hủy',
    message: `Đơn ${booking.bookingCode} đã được hủy thành công.`,
    data: { bookingId: booking._id },
  }).catch(() => {});

  // Notify staff room
  notify({
    audience: 'staff',
    type: 'booking_cancelled',
    title: 'Đặt phòng bị hủy',
    message: `Đơn ${booking.bookingCode} tại ${booking.hotel?.name || ''} đã bị hủy bởi ${req.user.role === 'customer' ? 'khách hàng' : req.user.role}.`,
    data: { bookingId: booking._id },
  }).catch(() => {});

  // Emit to hotel room for realtime update
  if (booking.hotel?._id) {
    emitToHotel(booking.hotel._id, 'booking_cancelled', {
      bookingId: booking._id,
      bookingCode: booking.bookingCode,
    });
  }

  res.json({ status: 'success', data: { booking } });
});

exports.listAll = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.hotel) filter.hotel = req.query.hotel;
  if (req.query.q) {
    filter.$or = [
      { bookingCode: new RegExp(req.query.q, 'i') },
      { 'guestInfo.name': new RegExp(req.query.q, 'i') },
    ];
  }
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('hotel', 'name')
      .populate('room', 'roomNumber type')
      .populate('customer', 'name email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    Booking.countDocuments(filter),
  ]);
  res.json({
    status: 'success',
    meta: { total, page, limit, hasNext: page * limit < total },
    data: { bookings },
  });
});

exports.updateStatus = catchAsync(async (req, res) => {
  const valid = ['pending', 'confirmed', 'paid', 'checked_in', 'checked_out', 'cancelled', 'refunded'];
  if (!valid.includes(req.body.status)) throw new AppError('Trạng thái không hợp lệ', 400);
  const booking = await Booking.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!booking) throw new AppError('Không tìm thấy đơn đặt phòng', 404);

  // Sync room status
  if (req.body.status === 'checked_in') {
    await Room.findByIdAndUpdate(booking.room, { status: 'occupied' });
  } else if (req.body.status === 'checked_out') {
    await Room.findByIdAndUpdate(booking.room, { status: 'cleaning' });
    // Auto-finish cleaning after 30 minutes
    const CLEANING_MS = Number(process.env.ROOM_CLEANING_MINUTES || 30) * 60 * 1000;
    setTimeout(async () => {
      try {
        const room = await Room.findById(booking.room);
        if (room && room.status === 'cleaning') {
          room.status = 'available';
          await room.save();
          emitToHotel(booking.hotel, 'room_status', { roomId: room._id, status: 'available' });
        }
      } catch (e) { /* ignore */ }
    }, CLEANING_MS);
  } else if (['cancelled', 'refunded'].includes(req.body.status)) {
    // Release room if it was occupied by this booking
    const room = await Room.findById(booking.room);
    if (room && room.status === 'occupied') {
      room.status = 'available';
      await room.save();
      emitToHotel(booking.hotel, 'room_status', { roomId: room._id, status: 'available' });
    }
    // Set cancelledAt if transitioning to cancelled
    if (req.body.status === 'cancelled' && !booking.cancelledAt) {
      booking.cancelledAt = new Date();
      booking.cancelReason = req.body.reason || 'Nhân viên hủy';
      await booking.save();
    }
  }

  // Notify customer
  notify({
    user: booking.customer,
    audience: 'user',
    type: 'booking_status',
    title: 'Cập nhật trạng thái đặt phòng',
    message: `Đơn ${booking.bookingCode} đã chuyển sang "${req.body.status}".`,
    data: { bookingId: booking._id, status: req.body.status },
  }).catch(() => {});

  emitToHotel(booking.hotel, 'booking_status', { bookingId: booking._id, status: booking.status });
  res.json({ status: 'success', data: { booking } });
});

exports.byHotel = catchAsync(async (req, res) => {
  const bookings = await Booking.find({ hotel: req.params.hotelId })
    .populate('room', 'roomNumber')
    .populate('customer', 'name email')
    .sort('-createdAt');
  res.json({ status: 'success', results: bookings.length, data: { bookings } });
});

exports.downloadInvoice = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('hotel')
    .populate('room')
    .populate('customer', 'name email');
  if (!booking) throw new AppError('Không tìm thấy đơn đặt phòng', 404);
  if (
    String(booking.customer._id) !== String(req.user._id) &&
    !['admin', 'manager', 'staff'].includes(req.user.role)
  ) {
    throw new AppError('Bạn không có quyền xem hóa đơn này', 403);
  }
  streamInvoicePdf(res, {
    booking,
    hotel: booking.hotel,
    room: booking.room,
    user: booking.customer,
  });
});
