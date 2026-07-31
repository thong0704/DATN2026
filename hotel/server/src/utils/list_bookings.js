const mongoose = require('mongoose');

async function test() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/hotel_booking');
    console.log('Connected to MongoDB');

    const Booking = require('../models/Booking');
    const bookings = await Booking.find({}).sort({ createdAt: -1 }).limit(10);
    console.log('Last 10 Bookings:');
    for (const b of bookings) {
      console.log(`ID: ${b._id}, Code: ${b.bookingCode}, Method: ${b.paymentMethod}, Status: ${b.status}, PaymentStatus: ${b.paymentStatus}`);
    }

  } catch (err) {
    console.error('Test error:', err.stack);
  } finally {
    await mongoose.disconnect();
  }
}

test();
