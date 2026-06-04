const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not defined');
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(uri, {
      autoIndex: true,
      maxPoolSize: 20,
    });
    logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    logger.error('MongoDB connection error: ' + err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
