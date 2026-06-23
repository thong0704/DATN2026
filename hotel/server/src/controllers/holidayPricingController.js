const HolidayPricing = require('../models/HolidayPricing');
const Hotel = require('../models/Hotel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.list = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.hotel) filter.hotel = req.query.hotel;
  const holidays = await HolidayPricing.find(filter).populate('hotel', 'name').sort('-from');
  res.json({ status: 'success', results: holidays.length, data: { holidays } });
});

exports.create = catchAsync(async (req, res) => {
  const { hotel, name, from, to, multiplier } = req.body;
  if (!hotel || !name || !from || !to) throw new AppError('Vui lòng điền đầy đủ thông tin', 400);
  if (new Date(to) <= new Date(from)) throw new AppError('Ngày kết thúc phải sau ngày bắt đầu', 400);
  if (multiplier && multiplier < 1) throw new AppError('Hệ số giá phải >= 1', 400);

  const holiday = await HolidayPricing.create(req.body);
  res.status(201).json({ status: 'success', data: { holiday } });
});


exports.applyAll = catchAsync(async (req, res) => {
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
  const holiday = await HolidayPricing.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!holiday) throw new AppError('Không tìm thấy cấu hình ngày lễ', 404);
  res.json({ status: 'success', data: { holiday } });
});

exports.remove = catchAsync(async (req, res) => {
  const holiday = await HolidayPricing.findByIdAndDelete(req.params.id);
  if (!holiday) throw new AppError('Không tìm thấy cấu hình ngày lễ', 404);
  res.json({ status: 'success', message: 'Deleted' });
});
