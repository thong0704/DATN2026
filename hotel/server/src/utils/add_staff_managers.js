require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Hotel = require('../models/Hotel');

(async () => {
  try {
    await connectDB();
    console.log('MongoDB connected.');

    const hotels = await Hotel.find({});
    console.log(`Found ${hotels.length} hotels.`);

    let count = 1;
    for (const hotel of hotels) {
      console.log(`\nProcessing hotel: ${hotel.name} (${hotel._id})`);
      
      // Skip 2T Hotel Hạ Long since it already has ql1 and nv1
      if (hotel.name.includes('Hạ Long')) {
        console.log('Skipping Hạ Long (already has ql1/nv1)');
        continue;
      }

      count++;
      const indexStr = count;

      // Check if manager for this hotel already exists by assignedHotel
      let qlUser = await User.findOne({ assignedHotel: hotel._id, role: 'manager' });
      const qlEmail = `ql${indexStr}@hotel.dev`;
      
      if (!qlUser) {
        // Double check email uniqueness
        const emailExists = await User.findOne({ email: qlEmail });
        if (emailExists) {
          console.log(`Email ${qlEmail} already in use, skipping creation.`);
          continue;
        }

        qlUser = await User.create({
          name: `ql${indexStr}`,
          email: qlEmail,
          password: '123456',
          phone: `0999000${String(indexStr).padStart(3, '0')}`,
          role: 'manager',
          assignedHotel: hotel._id,
          isEmailVerified: true
        });
        console.log(`Created Manager: ${qlEmail} / 123456 assigned to ${hotel.name}`);
      } else {
        console.log(`Manager already exists for ${hotel.name}: ${qlUser.email}`);
      }

      // Check if staff for this hotel already exists by assignedHotel
      let nvUser = await User.findOne({ assignedHotel: hotel._id, role: 'staff' });
      const nvEmail = `nv${indexStr}@hotel.dev`;

      if (!nvUser) {
        // Double check email uniqueness
        const emailExists = await User.findOne({ email: nvEmail });
        if (emailExists) {
          console.log(`Email ${nvEmail} already in use, skipping creation.`);
          continue;
        }

        nvUser = await User.create({
          name: `nv${indexStr}`,
          email: nvEmail,
          password: '123456',
          phone: `0999100${String(indexStr).padStart(3, '0')}`,
          role: 'staff',
          assignedHotel: hotel._id,
          isEmailVerified: true
        });
        console.log(`Created Staff: ${nvEmail} / 123456 assigned to ${hotel.name}`);
      } else {
        console.log(`Staff already exists for ${hotel.name}: ${nvUser.email}`);
      }
    }

    console.log('\n🎉 Finished adding managers and staff.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
