const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { filterAvailableRooms, calculateRoomPrice, computeMultiRoomPricing, getHolidaysForRange } = require('../services/availabilityService');
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

  
  const resultWithPricing = await Promise.all(
    result.map(async (room) => {
      try {
        const holidays = await getHolidaysForRange(room.hotel?._id || room.hotel, checkIn, checkOut);
        const pricing = calculateRoomPrice({ room, checkIn, checkOut, holidays });
        const rObj = room.toObject();
        rObj.dynamicPricing = {
          roomTotal: pricing.roomTotal,
          nights: pricing.nights,
          averagePrice: Math.round(pricing.roomTotal / pricing.nights),
          perNight: pricing.perNight,
        };
        return rObj;
      } catch (e) {
        return room;
      }
    })
  );

  res.json({ status: 'success', results: resultWithPricing.length, data: { rooms: resultWithPricing } });
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

  
  if (!hotel.basePrice || room.basePrice < hotel.basePrice) {
    hotel.basePrice = room.basePrice;
    await hotel.save();
  }
  res.status(201).json({ status: 'success', data: { room } });
});


exports.getQuote = catchAsync(async (req, res) => {
  const { roomId, checkIn, checkOut } = req.query;
  
  const room = await Room.findById(roomId);
  if (!room) throw new AppError('Phòng không tồn tại', 404);

  const holidays = await getHolidaysForRange(room.hotel, checkIn, checkOut);
  const pricing = calculateRoomPrice({ room, checkIn, checkOut, holidays });

  res.status(200).json({
    status: 'success',
    data: {
      ...pricing,
      roomNumber: room.roomNumber,
    },
  });
});


exports.getMultiQuote = catchAsync(async (req, res) => {
  const { roomIds, checkIn, checkOut } = req.body;
  if (!roomIds?.length || !checkIn || !checkOut) {
    throw new AppError('Vui lòng cung cấp roomIds, checkIn và checkOut', 400);
  }

  const roomDocs = await Room.find({ _id: { $in: roomIds } });
  if (!roomDocs.length) throw new AppError('Không tìm thấy phòng', 404);

  const hotelId = roomDocs[0].hotel;
  const holidays = await getHolidaysForRange(hotelId, checkIn, checkOut);

  const result = await computeMultiRoomPricing({
    roomDocs,
    checkIn,
    checkOut,
    holidays,
  });

  res.json({ status: 'success', data: result });
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
