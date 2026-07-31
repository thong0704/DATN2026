const mongoose = require('mongoose');

async function test() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/hotel_booking');
    console.log('Connected to MongoDB');

    const User = require('../models/User');
    const users = await User.find({}).limit(5);
    for (const u of users) {
      console.log(`User: _id=${u._id}, name=${u.name}, email=${u.email}, phone=${u.phone}`);
    }

  } catch (err) {
    console.error('Test error:', err.stack);
  } finally {
    await mongoose.disconnect();
  }
}

test();
