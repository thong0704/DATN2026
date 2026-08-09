const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const Review = require('../models/Review');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');
const cloudinary = require('../config/cloudinary');
const { filterAvailableRooms } = require('../services/availabilityService');

exports.list = catchAsync(async (req, res) => {
  const baseQuery = {};
  
  if (req.user?.role === 'admin') {
    
  } else if (req.query.isAdminView === 'true' && req.user && ['manager', 'staff'].includes(req.user.role)) {
    baseQuery._id = req.user.assignedHotel;
  } else if (req.query.mine === 'true' && req.user) {
    baseQuery.ownerId = req.user._id;
  } else {
    baseQuery.isActive = true;
  }
  if (req.query.city) baseQuery['address.city'] = new RegExp(req.query.city, 'i');
  if (req.query.stars) baseQuery.stars = { $gte: Number(req.query.stars) };
  if (req.query.amenities) {
    baseQuery.amenities = { $all: req.query.amenities.split(',') };
  }
  if (req.query.minPrice || req.query.maxPrice) {
    baseQuery.basePrice = {};
    if (req.query.minPrice) baseQuery.basePrice.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) baseQuery.basePrice.$lte = Number(req.query.maxPrice);
  }

  
  const { checkIn, checkOut, adults, children } = req.query;
  if (checkIn && checkOut) {
    const roomFilter = { isActive: true };
    if (adults) roomFilter['capacity.adults'] = { $gte: Number(adults) };
    if (children) roomFilter['capacity.children'] = { $gte: Number(children) };
    const candidateRooms = await Room.find(roomFilter).select('_id hotel');
    if (candidateRooms.length > 0) {
      const availableIds = await filterAvailableRooms({
        roomIds: candidateRooms.map((r) => r._id),
        checkIn,
        checkOut,
      });
      const availableSet = new Set(availableIds.map(String));
      const hotelIdsWithAvailability = [
        ...new Set(candidateRooms.filter((r) => availableSet.has(String(r._id))).map((r) => String(r.hotel))),
      ];
      baseQuery._id = { $in: hotelIdsWithAvailability };
    }
  }

  const features = new APIFeatures(Hotel.find(baseQuery), req.query).sort().limitFields().paginate();
  const [hotels, total] = await Promise.all([features.query, Hotel.countDocuments(baseQuery)]);
  const { page, limit } = features.pagination;
  res.json({
    status: 'success',
    results: hotels.length,
    meta: { total, page, limit, hasNext: page * limit < total },
    data: { hotels },
  });
});

exports.search = catchAsync(async (req, res) => {
  const { q, lng, lat, radius = 20 } = req.query;
  const filter = { isActive: true };
  if (q) filter.$text = { $search: q };
  if (lng && lat) {
    filter.location = {
      $near: {
        $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
        $maxDistance: Number(radius) * 1000,
      },
    };
  }
  const hotels = await Hotel.find(filter).limit(50);
  res.json({ status: 'success', results: hotels.length, data: { hotels } });
});

exports.getBySlug = catchAsync(async (req, res) => {
  let hotel = await Hotel.findOne({ slug: req.params.slug })
    .populate('rooms')
    .populate('managerId', 'name email');
  if (!hotel && req.params.slug?.match(/^[0-9a-fA-F]{24}$/)) {
    hotel = await Hotel.findById(req.params.slug)
      .populate('rooms')
      .populate('managerId', 'name email');
  }
  if (!hotel) throw new AppError('Không tìm thấy khách sạn', 404);
  const reviews = await Review.find({ hotel: hotel._id, isApproved: true })
    .populate('user', 'name avatar')
    .sort('-createdAt')
    .limit(10);
  res.json({ status: 'success', data: { hotel, reviews } });
});

exports.getById = catchAsync(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) throw new AppError('Không tìm thấy khách sạn', 404);
  res.json({ status: 'success', data: { hotel } });
});

exports.getAvailableRooms = catchAsync(async (req, res) => {
  const { checkIn, checkOut, adults = 1, children = 0 } = req.query;
  if (!checkIn || !checkOut) throw new AppError('Vui lòng chọn ngày nhận và trả phòng', 400);
  const rooms = await Room.find({
    hotel: req.params.id,
    isActive: true,
    'capacity.adults': { $gte: Number(adults) },
    'capacity.children': { $gte: Number(children) },
  });
  const availableIds = await filterAvailableRooms({
    roomIds: rooms.map((r) => r._id),
    checkIn,
    checkOut,
  });
  const idSet = new Set(availableIds.map(String));
  const available = rooms.filter((r) => idSet.has(String(r._id)));

  
  const { getHolidaysForRange, calculateRoomPrice } = require('../services/availabilityService');
  const holidays = await getHolidaysForRange(req.params.id, checkIn, checkOut);

  const roomsWithPricing = available.map((room) => {
    try {
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
  });

  res.json({ status: 'success', results: roomsWithPricing.length, data: { rooms: roomsWithPricing } });
});

exports.getReviews = catchAsync(async (req, res) => {
  const reviews = await Review.find({ hotel: req.params.id, isApproved: true })
    .populate('user', 'name avatar')
    .sort('-createdAt');
  res.json({ status: 'success', results: reviews.length, data: { reviews } });
});


async function loadOwnedHotel(req) {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) throw new AppError('Không tìm thấy khách sạn', 404);
  const isAdmin = req.user?.role === 'admin';
  const isAssigned = ['manager', 'staff'].includes(req.user?.role) && String(hotel._id) === String(req.user.assignedHotel);
  if (String(hotel.ownerId) !== String(req.user._id) && !isAdmin && !isAssigned) {
    throw new AppError('Bạn không có quyền quản lý khách sạn này', 403);
  }
  return hotel;
}

exports.create = catchAsync(async (req, res) => {
  
  const payload = { ...req.body, ownerId: req.user._id };
  
  const existing = await Hotel.findOne({ ownerId: req.user._id }).select('chain');
  if (existing?.chain && existing.chain !== 'Independent') {
    payload.chain = existing.chain;
  }
  const hotel = await Hotel.create(payload);
  res.status(201).json({ status: 'success', data: { hotel } });
});

exports.update = catchAsync(async (req, res) => {
  const existing = await loadOwnedHotel(req);
  
  const { ownerId, ...rest } = req.body;
  
  if (rest.chain && rest.chain !== existing.chain) {
    await Hotel.updateMany({ ownerId: req.user._id }, { chain: rest.chain });
  }
  const hotel = await Hotel.findByIdAndUpdate(req.params.id, rest, {
    new: true,
    runValidators: true,
  });
  res.json({ status: 'success', data: { hotel } });
});

exports.remove = catchAsync(async (req, res) => {
  await loadOwnedHotel(req);
  const hotel = await Hotel.findByIdAndDelete(req.params.id);
  
  for (const img of hotel.images || []) {
    if (img.public_id) cloudinary.uploader.destroy(img.public_id).catch(() => {});
  }
  res.json({ status: 'success', message: 'Deleted' });
});

exports.uploadImages = catchAsync(async (req, res) => {
  const hotel = await loadOwnedHotel(req);
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
  hotel.images.push(...newImages);
  await hotel.save();
  res.json({ status: 'success', data: { images: hotel.images } });
});

exports.getSimilarHotels = catchAsync(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) throw new AppError('Không tìm thấy khách sạn', 404);

  let query = {
    _id: { $ne: hotel._id },
    isActive: true,
    'address.city': hotel.address.city,
    basePrice: { $gte: hotel.basePrice * 0.7, $lte: hotel.basePrice * 1.3 },
    stars: { $gte: Math.max(1, hotel.stars - 1), $lte: Math.min(5, hotel.stars + 1) },
  };

  let similar = await Hotel.find(query).limit(4);

  if (similar.length < 4) {
    const idsToExclude = [hotel._id, ...similar.map((h) => h._id)];
    const extra = await Hotel.find({
      _id: { $nin: idsToExclude },
      isActive: true,
      'address.city': hotel.address.city,
    }).limit(4 - similar.length);
    similar = [...similar, ...extra];
  }

  if (similar.length < 4) {
    const idsToExclude = [hotel._id, ...similar.map((h) => h._id)];
    const extra = await Hotel.find({
      _id: { $nin: idsToExclude },
      isActive: true,
    }).limit(4 - similar.length);
    similar = [...similar, ...extra];
  }

  res.json({ status: 'success', data: { hotels: similar } });
});

exports.getPersonalizedRecommendations = catchAsync(async (req, res) => {
  let targetHotelIds = [];

  if (req.user) {
    const Booking = require('../models/Booking');
    const User = require('../models/User');

    const [bookings, userWithWishlist] = await Promise.all([
      Booking.find({ customer: req.user._id, status: { $ne: 'cancelled' } })
        .select('hotel'),
      User.findById(req.user._id)
        .select('wishlist')
    ]);

    const bookedHotelIds = bookings.map((b) => b.hotel && b.hotel._id ? b.hotel._id.toString() : null).filter(Boolean);
    const wishlistHotelIds = userWithWishlist?.wishlist?.map((h) => h.toString()) || [];

    targetHotelIds = [...new Set([...bookedHotelIds, ...wishlistHotelIds])];
  }

  if (targetHotelIds.length === 0) {
    return res.json({ status: 'success', data: { hotels: [] } });
  }

  let recommended = await Hotel.find({
    isActive: true,
    _id: { $in: targetHotelIds }
  })
    .sort('-avgRating')
    .limit(4);

  res.json({ status: 'success', data: { hotels: recommended } });
});
