/**
 * Seed sample data: users, hotels, rooms, bookings.
 * Usage: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const { generateBookingCode } = require('./helpers');
const logger = require('./logger');

const CITIES = ['Hà Nội', 'Đà Nẵng', 'Nha Trang', 'Đà Lạt', 'TP.HCM'];
const AMENITIES = ['wifi', 'pool', 'gym', 'spa', 'parking', 'restaurant', 'bar', 'airport_shuttle'];
const ROOM_TYPES = ['basic', 'standard', 'vip'];

const rand = (a) => a[Math.floor(Math.random() * a.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

(async () => {
  try {
    await connectDB();
    logger.info('🌱 Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Hotel.deleteMany({}),
      Room.deleteMany({}),
      Booking.deleteMany({}),
      Review.deleteMany({}),
    ]);

    // ----- Users -----
    const users = [];
    users.push(
      await User.create({
        name: 'Admin User',
        email: 'admin@hotel.dev',
        password: 'admin123',
        role: 'admin',
        isEmailVerified: true,
        phone: '0900000001',
      })
    );
    users.push(
      await User.create({
        name: 'Manager One',
        email: 'manager@hotel.dev',
        password: 'manager123',
        role: 'manager',
        isEmailVerified: true,
        phone: '0900000002',
      })
    );
    users.push(
      await User.create({
        name: 'Staff One',
        email: 'staff@hotel.dev',
        password: 'staff123',
        role: 'staff',
        isEmailVerified: true,
        phone: '0900000003',
      })
    );
    for (let i = 1; i <= 7; i++) {
      users.push(
        await User.create({
          name: `Customer ${i}`,
          email: `customer${i}@hotel.dev`,
          password: 'customer123',
          role: 'customer',
          isEmailVerified: true,
          phone: '09000001' + (10 + i),
          loyaltyPoints: randInt(0, 500),
        })
      );
    }
    logger.info(`✅ Created ${users.length} users`);

    // ----- Hotels -----
    const hotelData = [
      { name: 'Sunrise Grand Hanoi', city: 'Hà Nội', stars: 5 },
      { name: 'Ocean Pearl Đà Nẵng', city: 'Đà Nẵng', stars: 5 },
      { name: 'Nha Trang Bay Resort', city: 'Nha Trang', stars: 4 },
      { name: 'Pine Valley Đà Lạt', city: 'Đà Lạt', stars: 4 },
      { name: 'Saigon Riverside', city: 'TP.HCM', stars: 5 },
    ];
    const hotels = [];
    for (const h of hotelData) {
      const hotel = await Hotel.create({
        name: h.name,
        description: `${h.name} là một khách sạn ${h.stars} sao đẳng cấp với dịch vụ tận tâm và view tuyệt đẹp.`,
        chain: 'Sunshine Group',
        stars: h.stars,
        address: { street: '123 Main St', city: h.city, province: h.city, country: 'Vietnam' },
        location: { type: 'Point', coordinates: [105 + Math.random() * 5, 10 + Math.random() * 11] },
        images: [
          { url: `https://picsum.photos/seed/${encodeURIComponent(h.name)}/1200/800`, public_id: '' },
          { url: `https://picsum.photos/seed/${encodeURIComponent(h.name)}b/1200/800`, public_id: '' },
        ],
        amenities: AMENITIES.slice(0, 4 + randInt(0, 4)),
        ownerId: users[0]._id,
        managerId: users[1]._id,
        staff: [users[2]._id],
        basePrice: 800000,
      });
      hotels.push(hotel);
    }
    logger.info(`✅ Created ${hotels.length} hotels`);

    // ----- Rooms -----
    const rooms = [];
    for (const hotel of hotels) {
      const numRooms = 4;
      let min = Infinity;
      for (let i = 1; i <= numRooms; i++) {
        const type = rand(ROOM_TYPES);
        const price =
          type === 'basic' ? randInt(500000, 800000) :
          type === 'standard' ? randInt(800000, 1500000) :
          randInt(2500000, 4500000);
        const room = await Room.create({
          hotel: hotel._id,
          roomNumber: `${randInt(1, 9)}${String(i).padStart(2, '0')}`,
          type,
          floor: randInt(1, 9),
          capacity: { adults: type === 'vip' ? 3 : 2, children: 1 },
          bedType: type === 'vip' ? 'King' : type === 'standard' ? 'Queen' : 'Single',
          size: type === 'basic' ? 20 : type === 'standard' ? 30 : 50,
          pricePerNight: price,
          weekendPrice: Math.round(price * 1.2),
          amenities: ['wifi', 'tv', 'air_conditioning', 'minibar'],
          images: [
            { url: `https://picsum.photos/seed/${hotel._id}r${i}/1000/700`, public_id: '' },
          ],
          status: 'available',
        });
        rooms.push(room);
        if (price < min) min = price;
      }
      hotel.basePrice = min;
      await hotel.save();
    }
    logger.info(`✅ Created ${rooms.length} rooms`);

    // ----- Bookings (30) -----
    const customers = users.filter((u) => u.role === 'customer');
    for (let i = 0; i < 30; i++) {
      const customer = rand(customers);
      const room = rand(rooms);
      const offset = randInt(-30, 60);
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + offset);
      checkIn.setHours(14, 0, 0, 0);
      const nights = randInt(1, 5);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + nights);
      const roomTotal = room.pricePerNight * nights;
      const tax = Math.round(roomTotal * 0.08);
      const status = rand(['confirmed', 'paid', 'checked_in', 'checked_out', 'cancelled']);
      await Booking.create({
        bookingCode: generateBookingCode(),
        customer: customer._id,
        hotel: room.hotel,
        room: room._id,
        checkIn,
        checkOut,
        nights,
        guests: { adults: 2, children: 0 },
        guestInfo: { name: customer.name, email: customer.email, phone: customer.phone },
        pricing: { roomTotal, servicesTotal: 0, tax, discount: 0, total: roomTotal + tax },
        status,
        paymentStatus: ['paid', 'checked_in', 'checked_out'].includes(status) ? 'paid' : 'unpaid',
      });
    }
    logger.info('✅ Created 30 bookings');

    logger.info('🎉 Seed complete!');
    logger.info('Admin login   -> admin@hotel.dev / admin123');
    logger.info('Manager login -> manager@hotel.dev / manager123');
    logger.info('Customer1     -> customer1@hotel.dev / customer123');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    logger.error(err.stack || err.message);
    process.exit(1);
  }
})();
