const User = require('../models/User');
const Hotel = require('../models/Hotel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.toggle = catchAsync(async (req, res) => {
  const { hotelId } = req.body;
  if (!hotelId) throw new AppError('Vui lòng cung cấp mã khách sạn', 400);

  const hotel = await Hotel.findById(hotelId);
  if (!hotel) throw new AppError('Không tìm thấy khách sạn', 404);

  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('Người dùng không tồn tại', 404);

  const index = user.wishlist.indexOf(hotelId);
  let isFavorite = false;

  if (index >= 0) {
    
    user.wishlist.splice(index, 1);
  } else {
    
    user.wishlist.push(hotelId);
    isFavorite = true;
  }

  await user.save({ validateBeforeSave: false });

  res.json({
    status: 'success',
    message: isFavorite ? 'Đã thêm vào danh sách yêu thích' : 'Đã xóa khỏi danh sách yêu thích',
    data: { wishlist: user.wishlist, isFavorite },
  });
});

exports.list = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'wishlist',
    match: { isActive: true }, 
  });

  if (!user) throw new AppError('Người dùng không tồn tại', 404);

  res.json({
    status: 'success',
    results: user.wishlist.length,
    data: { hotels: user.wishlist },
  });
});
