const Review = require('../models/Review');
const Booking = require('../models/Booking');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { notify } = require('../services/notificationService');

exports.create = catchAsync(async (req, res) => {
  const { hotel, room, booking, rating, title, comment, cleanliness, service, location, value, images } = req.body;
  const bk = await Booking.findById(booking);
  if (!bk) throw new AppError('Không tìm thấy đơn đặt phòng', 404);
  if (String(bk.customer) !== String(req.user._id)) throw new AppError('Bạn không có quyền đánh giá đơn này', 403);
  if (bk.status !== 'checked_out') throw new AppError('Chỉ có thể đánh giá sau khi trả phòng', 400);

  const review = await Review.create({
    hotel,
    room,
    booking,
    user: req.user._id,
    rating,
    title,
    comment,
    cleanliness,
    service,
    location,
    value,
    images: images || [],
    isVerified: true,
    isApproved: true,
  });
  notify({
    audience: 'staff',
    type: 'review_created',
    title: 'New review',
    message: `New ${rating}-star review`,
    data: { reviewId: review._id, hotelId: hotel },
  }).catch(() => {});
  res.status(201).json({ status: 'success', data: { review } });
});

exports.byHotel = catchAsync(async (req, res) => {
  const reviews = await Review.find({ hotel: req.params.hotelId, isApproved: true })
    .populate('user', 'name avatar')
    .sort('-createdAt');
  res.json({ status: 'success', results: reviews.length, data: { reviews } });
});

exports.update = catchAsync(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Không tìm thấy đánh giá', 404);
  if (String(review.user) !== String(req.user._id)) throw new AppError('Bạn không có quyền chỉnh sửa đánh giá này', 403);
  ['rating', 'title', 'comment', 'cleanliness', 'service', 'location', 'value'].forEach((k) => {
    if (req.body[k] !== undefined) review[k] = req.body[k];
  });
  await review.save();
  res.json({ status: 'success', data: { review } });
});

exports.remove = catchAsync(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Không tìm thấy đánh giá', 404);
  if (String(review.user) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new AppError('Bạn không có quyền xóa đánh giá này', 403);
  }
  await review.deleteOne();
  res.json({ status: 'success', message: 'Deleted' });
});

exports.respond = catchAsync(async (req, res) => {
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    {
      response: {
        text: req.body.text,
        respondedAt: new Date(),
        respondedBy: req.user._id,
      },
    },
    { new: true }
  );
  if (!review) throw new AppError('Không tìm thấy đánh giá', 404);
  res.json({ status: 'success', data: { review } });
});

exports.approve = catchAsync(async (req, res) => {
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { isApproved: req.body.isApproved !== false },
    { new: true }
  );
  if (!review) throw new AppError('Không tìm thấy đánh giá', 404);
  await Review.recalcHotelRating(review.hotel);
  res.json({ status: 'success', data: { review } });
});
