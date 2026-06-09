const Booking = require('../models/Booking');
const Room = require('../models/Room');
const HolidayPricing = require('../models/HolidayPricing');
const AppError = require('../utils/AppError');

const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed', 'paid', 'checked_in'];

/**
 * Returns true if the given room has NO conflicting active bookings within
 * [checkIn, checkOut). Two ranges conflict if booking.checkIn < checkOut AND booking.checkOut > checkIn.
 */
async function isRoomAvailable({ roomId, checkIn, checkOut, excludeBookingId = null, session }) {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const query = {
    $or: [
      { room: roomId },
      { 'rooms.room': roomId }
    ],
    $and: [
      {
        $or: [
          { status: { $in: ['confirmed', 'paid', 'checked_in'] } },
          { status: 'pending', createdAt: { $gte: tenMinutesAgo } }
        ]
      }
    ],
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  };
  if (excludeBookingId) query._id = { $ne: excludeBookingId };
  const conflict = await Booking.findOne(query).session(session || null).lean();
  return !conflict;
}

/**
 * Returns an array of room IDs (from candidates) that are free between dates.
 * Uses one aggregation query for efficiency.
 */
async function filterAvailableRooms({ roomIds, checkIn, checkOut }) {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const busy = await Booking.aggregate([
    {
      $match: {
        $or: [
          { room: { $in: roomIds } },
          { 'rooms.room': { $in: roomIds } }
        ],
        $and: [
          {
            $or: [
              { status: { $in: ['confirmed', 'paid', 'checked_in'] } },
              { status: 'pending', createdAt: { $gte: tenMinutesAgo } }
            ]
          }
        ],
        checkIn: { $lt: new Date(checkOut) },
        checkOut: { $gt: new Date(checkIn) },
      },
    },
    {
      $project: {
        allRooms: {
          $concatArrays: [
            { $cond: [{ $ifNull: ['$room', false] }, ['$room'], []] },
            { $ifNull: ['$rooms.room', []] }
          ]
        }
      }
    },
    { $unwind: '$allRooms' },
    { $match: { allRooms: { $in: roomIds } } },
    { $group: { _id: '$allRooms' } },
  ]);
  const busySet = new Set(busy.map((b) => String(b._id)));
  return roomIds.filter((id) => !busySet.has(String(id)));
}

/**
 * Pricing engine — calculates room cost per night considering weekend,
 * seasonal and holiday pricing. Returns { nights, roomTotal, perNight: [...] }.
 */
function calculateRoomPrice({ room, checkIn, checkOut, holidays = [] }) {
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const ms = outDate - inDate;
  if (ms <= 0) throw new AppError('check-out must be after check-in', 400);
  const nights = Math.ceil(ms / (24 * 60 * 60 * 1000));

  // Helper to normalize a date to midnight UTC for consistent comparison
  const toDateOnly = (d) => {
    const dt = new Date(d);
    return new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()));
  };

  const perNight = [];
  let total = 0;
  for (let i = 0; i < nights; i++) {
    const day = new Date(inDate);
    day.setDate(day.getDate() + i);
    const dayNorm = toDateOnly(day);
    let price = room.pricePerNight;
    let label = '';

    // Seasonal override (first matching window wins)
    if (room.seasonalPricing?.length) {
      const season = room.seasonalPricing.find(
        (s) => dayNorm >= toDateOnly(s.from) && dayNorm <= toDateOnly(s.to)
      );
      if (season) {
        price = season.price;
        label = season.label || 'Mùa cao điểm';
      }
    }

    // Weekend premium (Fri/Sat) if weekendPrice > 0
    const dow = day.getDay();
    if ((dow === 5 || dow === 6) && room.weekendPrice) {
      price = Math.max(price, room.weekendPrice);
      label = label || 'Cuối tuần';
    }

    // Holiday multiplier (stack on top of seasonal/weekend price)
    // Note: getHolidaysForRange already filters isActive:true
    if (holidays.length) {
      const holiday = holidays.find(
        (h) => dayNorm >= toDateOnly(h.from) && dayNorm <= toDateOnly(h.to)
      );
      if (holiday) {
        price = Math.round(price * holiday.multiplier);
        label = holiday.name || 'Ngày lễ';
      }
    }

    perNight.push({ date: day, price, label });
    total += price;
  }
  return { nights, roomTotal: total, perNight };
}

/**
 * Fetches active holidays for a hotel within the given date range.
 */
async function getHolidaysForRange(hotelId, checkIn, checkOut) {
  return HolidayPricing.find({
    hotel: hotelId,
    isActive: true,
    from: { $lte: new Date(checkOut) },
    to: { $gte: new Date(checkIn) },
  }).lean();
}

async function computeBookingPricing({ room, checkIn, checkOut, services = [], taxRate = 0.08, discount = 0, holidays = [] }) {
  const { nights, roomTotal, perNight } = calculateRoomPrice({ room, checkIn, checkOut, holidays });
  const servicesTotal = services.reduce((s, x) => s + (x.price || 0) * (x.qty || 1), 0);
  const subtotal = roomTotal + servicesTotal - discount;
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + tax;
  return {
    nights,
    perNight,
    pricing: {
      roomTotal,
      servicesTotal,
      tax,
      discount,
      total: Math.max(total, 0),
    },
  };
}

/**
 * Compute pricing for multiple rooms (same dates).
 */
async function computeMultiRoomPricing({ roomDocs, checkIn, checkOut, services = [], taxRate = 0.08, discount = 0, holidays = [] }) {
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const ms = outDate - inDate;
  if (ms <= 0) throw new AppError('check-out must be after check-in', 400);
  const nights = Math.ceil(ms / (24 * 60 * 60 * 1000));

  let grandRoomTotal = 0;
  const roomBreakdowns = [];

  for (const room of roomDocs) {
    const { roomTotal, perNight } = calculateRoomPrice({ room, checkIn: inDate, checkOut: outDate, holidays });
    grandRoomTotal += roomTotal;
    roomBreakdowns.push({ room: room._id, roomNumber: room.roomNumber, type: room.type, roomTotal, perNight });
  }

  const servicesTotal = services.reduce((s, x) => s + (x.price || 0) * (x.qty || 1), 0);
  const subtotal = grandRoomTotal + servicesTotal - discount;
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + tax;

  return {
    nights,
    roomBreakdowns,
    pricing: {
      roomTotal: grandRoomTotal,
      servicesTotal,
      tax,
      discount,
      total: Math.max(total, 0),
    },
  };
}

module.exports = {
  isRoomAvailable,
  filterAvailableRooms,
  calculateRoomPrice,
  computeBookingPricing,
  computeMultiRoomPricing,
  getHolidaysForRange,
  ACTIVE_BOOKING_STATUSES,
};
