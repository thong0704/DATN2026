const Coupon = require('../models/Coupon');
const Room = require('../models/Room');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.listMine = catchAsync(async (req, res) => {
  const coupons = await Coupon.find({ ownerId: req.user._id }).populate('hotels', 'name').sort('-createdAt');
  res.json({ status: 'success', data: { coupons } });
});

exports.create = catchAsync(async (req, res) => {
  const payload = { ...req.body, ownerId: req.user._id, code: String(req.body.code || '').toUpperCase() };
  if (['manager', 'staff'].includes(req.user.role)) {
    payload.hotels = [req.user.assignedHotel];
  }
  const coupon = await Coupon.create(payload);
  res.status(201).json({ status: 'success', data: { coupon } });
});

exports.update = catchAsync(async (req, res) => {
  if (req.body.code) req.body.code = String(req.body.code).toUpperCase();
  if (['manager', 'staff'].includes(req.user.role)) {
    req.body.hotels = [req.user.assignedHotel];
  }
  const coupon = await Coupon.findOneAndUpdate(
    { _id: req.params.id, ownerId: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!coupon) throw new AppError('Không tìm thấy mã hoặc bạn không có quyền', 404);
  res.json({ status: 'success', data: { coupon } });
});

exports.remove = catchAsync(async (req, res) => {
  const coupon = await Coupon.findOneAndDelete({ _id: req.params.id, ownerId: req.user._id });
  if (!coupon) throw new AppError('Không tìm thấy mã', 404);
  res.json({ status: 'success', message: 'Đã xoá' });
});


exports.validate = catchAsync(async (req, res) => {
  const { code, amount, roomId } = req.body;
  if (!code || !amount) throw new AppError('Thiếu mã hoặc số tiền', 400);
  const coupon = await Coupon.findOne({ code: String(code).toUpperCase(), isActive: true });
  if (!coupon) throw new AppError('Mã giảm giá không hợp lệ', 404);
  const now = new Date();
  if (coupon.validFrom && now < coupon.validFrom) throw new AppError('Mã chưa có hiệu lực', 400);
  if (coupon.validTo && now > coupon.validTo) throw new AppError('Mã đã hết hạn', 400);
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    throw new AppError('Mã đã hết lượt sử dụng', 400);
  }
  if (coupon.minOrderAmount && amount < coupon.minOrderAmount) {
    throw new AppError(`Đơn tối thiểu ${coupon.minOrderAmount.toLocaleString('vi-VN')}đ`, 400);
  }
  
  if (coupon.hotels?.length && roomId) {
    const room = await Room.findById(roomId).select('hotel');
    if (!room || !coupon.hotels.map(String).includes(String(room.hotel))) {
      throw new AppError('Mã không áp dụng cho khách sạn này', 400);
    }
  }
  const discount = coupon.computeDiscount(Number(amount));
  res.json({
    status: 'success',
    data: { code: coupon.code, discount, description: coupon.description, discountType: coupon.discountType, discountValue: coupon.discountValue },
  });
});
