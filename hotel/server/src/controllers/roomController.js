const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { filterAvailableRooms } = require('../services/availabilityService');
const { emitToHotel } = require('../services/notificationService');
const cloudinary = require('../config/cloudinary');

exports.getAvailable = catchAsync(async (req, res) => {
  const { hotelId, checkIn, checkOut, adults = 1, children = 0 } = req.query;
  if (!checkIn || !checkOut) throw new AppError('Vui lòng chọn ngày nhận và trả phòng', 400);
  const filter = {
    isActive: true,
    'capacity.adults': { $gte: Number(adults) },
    'capacity.children': { $gte: Number(children) },
  };
  if (hotelId) filter.hotel = hotelId;
  const rooms = await Room.find(filter).populate('hotel', 'name address slug');
  const availableIds = await filterAvailableRooms({
    roomIds: rooms.map((r) => r._id),
    checkIn,
    checkOut,
  });
  const set = new Set(availableIds.map(String));
  const result = rooms.filter((r) => set.has(String(r._id)));
  res.json({ status: 'success', results: result.length, data: { rooms: result } });
});

exports.getById = catchAsync(async (req, res) => {
  const room = await Room.findById(req.params.id).populate('hotel');
  if (!room) throw new AppError('Không tìm thấy phòng', 404);
  res.json({ status: 'success', data: { room } });
});

exports.getByHotel = catchAsync(async (req, res) => {
  const rooms = await Room.find({ hotel: req.params.hotelId });
  res.json({ status: 'success', results: rooms.length, data: { rooms } });
});

exports.create = catchAsync(async (req, res) => {
  const hotel = await Hotel.findById(req.body.hotel);
  if (!hotel) throw new AppError('Không tìm thấy khách sạn', 404);
  const room = await Room.create(req.body);

  // Update hotel.basePrice if needed
  if (!hotel.basePrice || room.pricePerNight < hotel.basePrice) {
    hotel.basePrice = room.pricePerNight;
    await hotel.save();
  }
  res.status(201).json({ status: 'success', data: { room } });
});

exports.update = catchAsync(async (req, res) => {
  const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!room) throw new AppError('Không tìm thấy phòng', 404);
  res.json({ status: 'success', data: { room } });
});

exports.remove = catchAsync(async (req, res) => {
  const room = await Room.findByIdAndDelete(req.params.id);
  if (!room) throw new AppError('Không tìm thấy phòng', 404);
  for (const img of room.images || []) {
    if (img.public_id) cloudinary.uploader.destroy(img.public_id).catch(() => {});
  }
  res.json({ status: 'success', message: 'Deleted' });
});

exports.updateStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const room = await Room.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!room) throw new AppError('Không tìm thấy phòng', 404);
  emitToHotel(room.hotel, 'room_status', { roomId: room._id, status: room.status });
  res.json({ status: 'success', data: { room } });
});

exports.uploadImages = catchAsync(async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) throw new AppError('Không tìm thấy phòng', 404);
  const files = req.files || [];
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const newImages = files.map((f) => {
    let url = f.path || f.secure_url || '';
    if (url && !/^https?:\/\//i.test(url)) {
      const rel = url.replace(/\\/g, '/').split('/uploads/').pop();
      url = `${baseUrl}/uploads/${rel}`;
    }
    return { url, public_id: f.filename || f.public_id || '' };
  });
  room.images.push(...newImages);
  await room.save();
  res.json({ status: 'success', data: { images: room.images } });
});
