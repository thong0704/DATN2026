const XLSX = require('xlsx');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const getPeriodStart = (period) => {
  const now = new Date();
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  if (period === 'week') {
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day; 
    d.setDate(d.getDate() + diff);
  } else if (period === 'month') {
    d.setDate(1);
  } else if (period === 'year') {
    d.setMonth(0, 1);
  }
  return d;
};

exports.dashboard = catchAsync(async (req, res) => {
  const period = req.query.period || 'day'; 
  const hotelId = req.query.hotelId && mongoose.Types.ObjectId.isValid(req.query.hotelId)
    ? new mongoose.Types.ObjectId(req.query.hotelId)
    : null;

  let start, end;
  if (req.query.start && req.query.end) {
    start = new Date(req.query.start);
    end = new Date(req.query.end);
  } else {
    start = getPeriodStart(period);
    end = new Date();
  }

  
  let bookingIdsFilter = null;
  if (hotelId) {
    const ids = await Booking.find({ hotel: hotelId }).distinct('_id');
    bookingIdsFilter = { $in: ids };
  }

  const paymentMatch = { status: 'succeeded', paidAt: { $gte: start, $lt: end } };
  if (bookingIdsFilter) paymentMatch.booking = bookingIdsFilter;

  const bookingMatch = { createdAt: { $gte: start, $lt: end } };
  if (hotelId) bookingMatch.hotel = hotelId;

  const hotelScope = hotelId ? { hotel: hotelId } : {};
  const roomScope = hotelId ? { hotel: hotelId, isActive: true } : { isActive: true };
  const occupiedScope = hotelId ? { hotel: hotelId, status: 'occupied' } : { status: 'occupied' };

  const [periodRevenueAgg, periodBookings, totalCustomers, totalHotels, totalRooms, occupiedRooms] =
    await Promise.all([
      Payment.aggregate([
        { $match: paymentMatch },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Booking.countDocuments(bookingMatch),
      User.countDocuments({ role: 'customer' }),
      Hotel.countDocuments(hotelId ? { _id: hotelId, isActive: true } : { isActive: true }),
      Room.countDocuments(roomScope),
      Room.countDocuments(occupiedScope),
    ]);

  const occupancy = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  res.json({
    status: 'success',
    data: {
      period,
      hotelId: hotelId ? hotelId.toString() : null,
      periodRevenue: periodRevenueAgg[0]?.total || 0,
      periodBookings,
      
      todayRevenue: periodRevenueAgg[0]?.total || 0,
      todayBookings: periodBookings,
      totalCustomers,
      totalHotels,
      totalRooms,
      occupiedRooms,
      occupancyPercent: occupancy,
    },
  });
});

// Phân tích doanh thu khách sạn theo các mốc thời gian: ngày, tuần, tháng, năm.
// Hàm sử dụng MongoDB Aggregation để gom nhóm các khoản thanh toán thành công (succeeded).
// Phân tích doanh thu khách sạn theo các mốc thời gian: ngày, tuần, tháng, năm.
// Hàm sử dụng MongoDB Aggregation để gom nhóm các khoản thanh toán thành công (succeeded).
exports.revenueAnalytics = catchAsync(async (req, res) => {
  const period = req.query.period || 'month'; 
  const hotelId = req.query.hotelId && mongoose.Types.ObjectId.isValid(req.query.hotelId)
    ? new mongoose.Types.ObjectId(req.query.hotelId)
    : null;

  const groupId =
    period === 'year'
      ? { y: { $year: '$paidAt' } }
      : period === 'week'
      ? { y: { $isoWeekYear: '$paidAt' }, w: { $isoWeek: '$paidAt' } }
      : period === 'day'
      ? { y: { $year: '$paidAt' }, m: { $month: '$paidAt' }, d: { $dayOfMonth: '$paidAt' } }
      : { y: { $year: '$paidAt' }, m: { $month: '$paidAt' } };

  const match = { status: 'succeeded', paidAt: { $ne: null } };
  if (req.query.start && req.query.end) {
    match.paidAt = { $gte: new Date(req.query.start), $lt: new Date(req.query.end) };
  }
  if (hotelId) {
    const ids = await Booking.find({ hotel: hotelId }).distinct('_id');
    match.booking = { $in: ids };
  }

  const data = await Payment.aggregate([
    { $match: match },
    { $group: { _id: groupId, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1, '_id.w': 1 } },
  ]);
  res.json({ status: 'success', data: { revenue: data, period } });
});

// Thống kê tỷ lệ lấp đầy phòng dựa trên số lượng đơn đặt phòng hoạt động 
// (confirmed, paid, checked_in, checked_out) trong khoảng thời gian chỉ định.
// Thống kê tỷ lệ lấp đầy phòng dựa trên số lượng đơn đặt phòng hoạt động 
// (confirmed, paid, checked_in, checked_out) trong khoảng thời gian chỉ định.
exports.occupancyAnalytics = catchAsync(async (req, res) => {
  const startStr = req.query.start;
  const endStr = req.query.end;
  const start = startStr ? new Date(startStr) : new Date(new Date().setDate(1));
  const end = endStr ? new Date(endStr) : new Date(new Date().setDate(start.getDate() + 30));

  const data = await Booking.aggregate([
    {
      $match: {
        status: { $in: ['confirmed', 'paid', 'checked_in', 'checked_out'] },
        checkIn: { $lt: end },
        checkOut: { $gt: start },
      },
    },
    {
      $group: {
        _id: { y: { $year: '$checkIn' }, m: { $month: '$checkIn' }, d: { $dayOfMonth: '$checkIn' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } },
  ]);
  res.json({ status: 'success', data: { occupancy: data } });
});

// Thống kê Top 10 khách sạn có doanh thu và số lượng đặt phòng cao nhất.
// Hàm thực hiện gom nhóm trên bảng Booking và liên kết ($lookup) với bảng Hotel để lấy thông tin khách sạn.
// Thống kê Top 10 khách sạn có doanh thu và số lượng đặt phòng cao nhất.
// Hàm thực hiện gom nhóm trên bảng Booking và liên kết ($lookup) với bảng Hotel để lấy thông tin khách sạn.
exports.topHotels = catchAsync(async (req, res) => {
  const top = await Booking.aggregate([
    { $match: { status: { $in: ['paid', 'checked_in', 'checked_out'] } } },
    {
      $group: {
        _id: '$hotel',
        bookings: { $sum: 1 },
        revenue: { $sum: '$pricing.total' },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
    { $lookup: { from: 'hotels', localField: '_id', foreignField: '_id', as: 'hotel' } },
    { $unwind: '$hotel' },
    { $project: { _id: 0, hotel: { _id: 1, name: 1, address: 1 }, bookings: 1, revenue: 1 } },
  ]);
  res.json({ status: 'success', data: { top } });
});

exports.dashboardRich = catchAsync(async (req, res) => {
  const period = req.query.period || 'month';
  const hotelId = req.query.hotelId && mongoose.Types.ObjectId.isValid(req.query.hotelId)
    ? new mongoose.Types.ObjectId(req.query.hotelId)
    : null;

  let start, end;
  if (req.query.start && req.query.end) {
    start = new Date(req.query.start);
    end = new Date(req.query.end);
  } else {
    start = getPeriodStart(period);
    end = new Date();
  }

  
  let bookingIdsForHotel = null;
  if (hotelId) {
    bookingIdsForHotel = await Booking.find({ hotel: hotelId }).distinct('_id');
  }

  const paymentMatch = { status: 'succeeded', paidAt: { $gte: start, $lt: end } };
  if (bookingIdsForHotel) paymentMatch.booking = { $in: bookingIdsForHotel };

  const bookingMatch = { createdAt: { $gte: start, $lt: end } };
  if (hotelId) bookingMatch.hotel = hotelId;

  const roomBase = hotelId ? { hotel: hotelId } : {};
  const roomActive = { ...roomBase, isActive: true };

  
  const groupId =
    period === 'year'
      ? { y: { $year: '$paidAt' }, m: { $month: '$paidAt' } }
      : period === 'month' || period === 'week'
      ? { y: { $year: '$paidAt' }, m: { $month: '$paidAt' }, d: { $dayOfMonth: '$paidAt' } }
      : period === 'day'
      ? { y: { $year: '$paidAt' }, m: { $month: '$paidAt' }, d: { $dayOfMonth: '$paidAt' }, h: { $hour: '$paidAt' } }
      : { y: { $year: '$paidAt' }, m: { $month: '$paidAt' } };

  const bookingGroupId =
    period === 'year'
      ? { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }
      : period === 'month' || period === 'week'
      ? { y: { $year: '$createdAt' }, m: { $month: '$createdAt' }, d: { $dayOfMonth: '$createdAt' } }
      : period === 'day'
      ? { y: { $year: '$createdAt' }, m: { $month: '$createdAt' }, d: { $dayOfMonth: '$createdAt' }, h: { $hour: '$createdAt' } }
      : { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } };

  const [
    periodRevenueAgg,
    periodBookingsAgg,
    newCustomersInRange,
    totalCustomers,
    totalHotels,
    roomsByStatus,
    roomTypeDist,
    revenueTrend,
    bookingTrend,
    reviewStats,
    reviewBreakdown,
  ] = await Promise.all([
    Payment.aggregate([
      { $match: paymentMatch },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Booking.aggregate([
      { $match: bookingMatch },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: {
                if: { $and: [ { $isArray: '$rooms' }, { $gt: [{ $size: '$rooms' }, 0] } ] },
                then: { $size: '$rooms' },
                else: 1
              }
            }
          }
        }
      }
    ]),
    User.countDocuments({ role: 'customer', createdAt: { $gte: start, $lt: end } }),
    User.countDocuments({ role: 'customer' }),
    Hotel.countDocuments(hotelId ? { _id: hotelId, isActive: true } : { isActive: true }),
    Room.aggregate([
      { $match: roomActive },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Room.aggregate([
      { $match: roomActive },
      { $addFields: {
        type: {
          $switch: {
            branches: [
              { case: { $eq: ['$type', 'deluxe'] }, then: 'vip' },
              { case: { $eq: ['$type', 'suite'] }, then: 'vip' },
              { case: { $eq: ['$type', 'presidential'] }, then: 'vip' },
              { case: { $eq: ['$type', 'double'] }, then: 'standard' },
              { case: { $eq: ['$type', 'triple'] }, then: 'vip' },
            ],
            default: '$type',
          },
        },
      } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: paymentMatch },
      { $group: { _id: groupId, total: { $sum: '$amount' } } },
      { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1, '_id.h': 1 } },
    ]),
    Booking.aggregate([
      { $match: bookingMatch },
      {
        $group: {
          _id: bookingGroupId,
          count: {
            $sum: {
              $cond: {
                if: { $and: [ { $isArray: '$rooms' }, { $gt: [{ $size: '$rooms' }, 0] } ] },
                then: { $size: '$rooms' },
                else: 1
              }
            }
          }
        }
      },
      { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1, '_id.h': 1 } },
    ]),
    Review.aggregate([
      { $match: hotelId ? { hotel: hotelId, isApproved: true } : { isApproved: true } },
      { $group: { _id: null, avg: { $avg: '$rating' }, total: { $sum: 1 } } },
    ]),
    Review.aggregate([
      { $match: hotelId ? { hotel: hotelId, isApproved: true } : { isApproved: true } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]),
  ]);

  const periodBookings = periodBookingsAgg[0]?.total || 0;

  
  const roomStatusMap = { available: 0, occupied: 0, maintenance: 0, cleaning: 0 };
  roomsByStatus.forEach((r) => { roomStatusMap[r._id] = r.count; });
  const totalRooms = Object.values(roomStatusMap).reduce((a, b) => a + b, 0);

  
  const keyOf = (id) => {
    const y = id.y;
    const m = String(id.m || '').padStart(2, '0');
    const d = String(id.d || '').padStart(2, '0');
    const h = String(id.h || '').padStart(2, '0');
    if (period === 'year') return `${y}-${m}`;
    if (period === 'month' || period === 'week') return `${y}-${m}-${d}`;
    if (period === 'day') return `${y}-${m}-${d}-${h}`;
    return `${y}-${m}`;
  };
  const labelOf = (id) => {
    if (period === 'year') return `${id.m}/${id.y}`;
    if (period === 'month' || period === 'week') return `${id.d}/${id.m}`;
    if (period === 'day') return `${id.h}h`;
    return `${id.m}/${id.y}`;
  };
  const trendMap = new Map();
  revenueTrend.forEach((r) => {
    trendMap.set(keyOf(r._id), { label: labelOf(r._id), revenue: r.total, bookings: 0 });
  });
  bookingTrend.forEach((b) => {
    const k = keyOf(b._id);
    if (trendMap.has(k)) trendMap.get(k).bookings = b.count;
    else trendMap.set(k, { label: labelOf(b._id), revenue: 0, bookings: b.count });
  });
  const trend = Array.from(trendMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map((entry) => entry[1]);

  
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviewBreakdown.forEach((r) => { breakdown[r._id] = r.count; });

  
  const occupancyPercent = totalRooms > 0
    ? Math.round((roomStatusMap.occupied / totalRooms) * 100)
    : 0;

  res.json({
    status: 'success',
    data: {
      period,
      hotelId: hotelId ? hotelId.toString() : null,
      summary: {
        periodRevenue: periodRevenueAgg[0]?.total || 0,
        periodBookings,
        newCustomersInRange,
        totalCustomers,
        totalHotels,
        occupancyPercent,
      },
      roomStats: {
        total: totalRooms,
        ...roomStatusMap,
      },
      roomTypeDist: roomTypeDist.map((r) => ({ type: r._id, count: r.count })),
      trend,
      reviewStats: {
        avg: Number((reviewStats[0]?.avg || 0).toFixed(1)),
        total: reviewStats[0]?.total || 0,
        breakdown,
      },
    },
  });
});

exports.listUsers = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.q) filter.$or = [{ name: new RegExp(req.query.q, 'i') }, { email: new RegExp(req.query.q, 'i') }];
  const users = await User.find(filter).sort('-createdAt').limit(200);
  res.json({ status: 'success', results: users.length, data: { users } });
});

exports.updateUserRole = catchAsync(async (req, res) => {
  const { role, isBlocked } = req.body;

  
  if (role && String(req.params.id) === String(req.user._id)) {
    throw new AppError('Bạn không thể thay đổi quyền của chính mình', 403);
  }

  const updates = {};
  if (role) updates.role = role;
  if (typeof isBlocked === 'boolean') updates.isBlocked = isBlocked;
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!user) throw new AppError('Không tìm thấy người dùng', 404);
  res.json({ status: 'success', data: { user } });
});

exports.updateUser = catchAsync(async (req, res) => {
  const { name, email, phone, password, role, isBlocked } = req.body;

  
  if (role && String(req.params.id) === String(req.user._id)) {
    throw new AppError('Bạn không thể thay đổi quyền của chính mình', 403);
  }

  const user = await User.findById(req.params.id).select('+password');
  if (!user) throw new AppError('Không tìm thấy người dùng', 404);

  
  if (email && email !== user.email) {
    const emailExists = await User.findOne({ email, _id: { $ne: user._id } });
    if (emailExists) throw new AppError('Email đã được sử dụng bởi tài khoản khác', 400);
    user.email = email;
  }
  
  if (phone !== undefined && phone !== user.phone) {
    if (phone) {
      const phoneExists = await User.findOne({ phone, _id: { $ne: user._id } });
      if (phoneExists) throw new AppError('Số điện thoại đã được sử dụng bởi tài khoản khác', 400);
    }
    user.phone = phone;
  }

  if (name) user.name = name;
  if (role) user.role = role;
  if (typeof isBlocked === 'boolean') user.isBlocked = isBlocked;
  if (password) user.password = password; 

  await user.save();
  res.json({ status: 'success', data: { user } });
});

exports.createUser = catchAsync(async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  if (!name || !email || !password) {
    throw new AppError('Tên, email và mật khẩu là bắt buộc', 400);
  }
  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email đã tồn tại', 400);

  if (phone) {
    const phoneExists = await User.findOne({ phone });
    if (phoneExists) throw new AppError('Số điện thoại đã được sử dụng', 400);
  }

  const user = await User.create({
    name,
    email,
    password,
    phone: phone || '',
    role: role || 'customer',
  });
  res.status(201).json({ status: 'success', data: { user } });
});

exports.exportReport = catchAsync(async (req, res) => {
  const type = req.query.type || 'excel';
  const bookings = await Booking.find({})
    .populate('hotel', 'name')
    .populate('room', 'roomNumber type')
    .populate('customer', 'name email')
    .sort('-createdAt')
    .limit(1000);

  if (type === 'excel') {
    const rows = bookings.map((b) => ({
      Code: b.bookingCode,
      Customer: b.customer?.name,
      Email: b.customer?.email,
      Hotel: b.hotel?.name,
      Room: b.room?.roomNumber,
      CheckIn: b.checkIn?.toISOString().split('T')[0],
      CheckOut: b.checkOut?.toISOString().split('T')[0],
      Nights: b.nights,
      Total: b.pricing?.total,
      Status: b.status,
      Payment: b.paymentStatus,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bookings');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="bookings.xlsx"');
    return res.send(buf);
  }
  res.json({ status: 'success', data: { bookings } });
});
