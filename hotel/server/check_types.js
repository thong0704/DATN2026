require('dotenv').config();
const mongoose = require('mongoose');
const Room = require('./src/models/Room');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const counts = await Room.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]);
  console.log(counts);
  process.exit(0);
})();
