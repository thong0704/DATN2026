const Booking = require('../models/Booking');
const Room = require('../models/Room');
const AppError = require('../utils/AppError');

const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed', 'paid', 'checked_in'];

/**
 * Returns true if the given room has NO conflicting active bookings within
 * [checkIn, checkOut). Two ranges conflict if booking.checkIn < checkOut AND booking.checkOut > checkIn.
 */
async function isRoomAvailable({ roomId, checkIn, checkOut, excludeBookingId = null, session }) {
  const query = {
    room: roomId,
    status: { $in: ACTIVE_BOOKING_STATUSES },
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
  const busy = await Booking.aggregate([
    {
      $match: {
        room: { $in: roomIds },
        status: { $in: ACTIVE_BOOKING_STATUSES },
        checkIn: { $lt: new Date(checkOut) },
        checkOut: { $gt: new Date(checkIn) },
      },
    },
    { $group: { _id: '$room' } },
  ]);
  const busySet = new Set(busy.map((b) => String(b._id)));
  return roomIds.filter((id) => !busySet.has(String(id)));
}

/**
 * Pricing engine — calculates room cost per night considering weekend
 * and seasonal pricing. Returns { nights, roomTotal, perNight: [...] }.
 */
function calculateRoomPrice({ room, checkIn, checkOut }) {
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const ms = outDate - inDate;
  if (ms <= 0) throw new AppError('check-out must be after check-in', 400);
  const nights = Math.ceil(ms / (24 * 60 * 60 * 1000));

  const perNight = [];
  let total = 0;
  for (let i = 0; i < nights; i++) {
    const day = new Date(inDate);
    day.setDate(day.getDate() + i);
    let price = room.pricePerNight;

    // Seasonal override (first matching window wins)
    if (room.seasonalPricing?.length) {
      const season = room.seasonalPricing.find(
        (s) => day >= new Date(s.from) && day <= new Date(s.to)
      );
      if (season) price = season.price;
    }

    // Weekend premium (Fri/Sat) if weekendPrice > 0
    const dow = day.getDay();
    if ((dow === 5 || dow === 6) && room.weekendPrice) {
      price = Math.max(price, room.weekendPrice);
    }

    perNight.push({ date: day, price });
    total += price;
  }
  return { nights, roomTotal: total, perNight };
}

async function computeBookingPricing({ room, checkIn, checkOut, services = [], taxRate = 0.08, discount = 0 }) {
  const { nights, roomTotal } = calculateRoomPrice({ room, checkIn, checkOut });
  const servicesTotal = services.reduce((s, x) => s + (x.price || 0) * (x.qty || 1), 0);
  const subtotal = roomTotal + servicesTotal - discount;
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + tax;
  return {
    nights,
    pricing: {
      roomTotal,
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
  ACTIVE_BOOKING_STATUSES,
};
