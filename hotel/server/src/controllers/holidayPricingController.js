const HolidayPricing = require('../models/HolidayPricing');
const Hotel = require('../models/Hotel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.list = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.hotel) filter.hotel = req.query.hotel;
  if (req.user && ['manager', 'staff'].includes(req.user.role)) {
    filter.hotel = req.user.assignedHotel;
  }
  const holidays = await HolidayPricing.find(filter).populate('hotel', 'name').sort('-from');
  res.json({ status: 'success', results: holidays.length, data: { holidays } });
});

exports.create = catchAsync(async (req, res) => {
  const { hotel, name, from, to, multiplier } = req.body;
  if (!hotel || !name || !from || !to) throw new AppError('Vui lòng điền đầy đủ thông tin', 400);
  if (req.user.role !== 'admin' && String(hotel) !== String(req.user.assignedHotel)) {
    throw new AppError('Bạn không có quyền cấu hình giá cho khách sạn này', 403);
  }
  if (new Date(to) <= new Date(from)) throw new AppError('Ngày kết thúc phải sau ngày bắt đầu', 400);
  if (multiplier && multiplier < 1) throw new AppError('Hệ số giá phải >= 1', 400);

  const holiday = await HolidayPricing.create(req.body);
  res.status(201).json({ status: 'success', data: { holiday } });
});


exports.applyAll = catchAsync(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new AppError('Chỉ có quản trị viên hệ thống mới được phép áp dụng giá ngày lễ cho tất cả khách sạn', 403);
  }
  const { name, from, to, multiplier, isActive } = req.body;
  if (!name || !from || !to) throw new AppError('Vui lòng điền đầy đủ thông tin', 400);
  if (new Date(to) <= new Date(from)) throw new AppError('Ngày kết thúc phải sau ngày bắt đầu', 400);
  if (multiplier && multiplier < 1) throw new AppError('Hệ số giá phải >= 1', 400);

  const hotels = await Hotel.find({ isActive: true }).select('_id');
  if (!hotels.length) throw new AppError('Không tìm thấy khách sạn nào', 404);

  const docs = hotels.map((h) => ({
    hotel: h._id,
    name,
    from,
    to,
    multiplier: multiplier || 1.5,
    isActive: isActive !== false,
  }));

  const created = await HolidayPricing.insertMany(docs);
  res.status(201).json({
    status: 'success',
    message: `Đã áp dụng cho ${created.length} khách sạn`,
    data: { count: created.length, holidays: created },
  });
});

exports.update = catchAsync(async (req, res) => {
  const holiday = await HolidayPricing.findById(req.params.id);
  if (!holiday) throw new AppError('Không tìm thấy cấu hình ngày lễ', 404);
  if (req.user.role !== 'admin' && String(holiday.hotel) !== String(req.user.assignedHotel)) {
    throw new AppError('Bạn không có quyền quản lý cấu hình ngày lễ này', 403);
  }

  const updated = await HolidayPricing.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.json({ status: 'success', data: { holiday: updated } });
});

exports.remove = catchAsync(async (req, res) => {
  const holiday = await HolidayPricing.findById(req.params.id);
  if (!holiday) throw new AppError('Không tìm thấy cấu hình ngày lễ', 404);
  if (req.user.role !== 'admin' && String(holiday.hotel) !== String(req.user.assignedHotel)) {
    throw new AppError('Bạn không có quyền quản lý cấu hình ngày lễ này', 403);
  }

  await HolidayPricing.findByIdAndDelete(req.params.id);
  res.json({ status: 'success', message: 'Deleted' });
});
