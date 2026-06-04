const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Optional auth handshake using access token
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        socket.user = decoded;
      }
      next();
    } catch (e) {
      next(); // allow anonymous
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join role-based rooms
    if (socket.user) {
      socket.join(`user:${socket.user.id}`);
      if (['admin', 'manager', 'staff'].includes(socket.user.role)) {
        socket.join('staff_room');
      }
      if (socket.user.role === 'admin') socket.join('admin_room');
    }

    socket.on('join_hotel', (hotelId) => {
      if (hotelId) socket.join(`hotel:${hotelId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io has not been initialized');
  return io;
}

module.exports = { initSocket, getIO };
