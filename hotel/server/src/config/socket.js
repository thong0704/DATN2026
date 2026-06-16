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

    // --- SUPPORT CHAT SOCKET EVENTS ---
    socket.on('join_chat', ({ guestId }) => {
      const targetRoom = socket.user ? `chat:user:${socket.user.id}` : `chat:guest:${guestId}`;
      if (targetRoom) {
        socket.join(targetRoom);
        logger.info(`Socket ${socket.id} joined chat room: ${targetRoom}`);
      }
    });

    socket.on('send_chat_message', async ({ content, guestId, senderName }) => {
      try {
        const ChatMessage = require('../models/ChatMessage');
        const msg = await ChatMessage.create({
          user: socket.user ? socket.user.id : undefined,
          guestId: socket.user ? undefined : guestId,
          sender: socket.user ? socket.user.id : undefined,
          senderType: 'customer',
          senderName: socket.user ? socket.user.name || 'Thành viên' : senderName || 'Khách vãng lai',
          content,
        });

        const targetRoom = socket.user ? `chat:user:${socket.user.id}` : `chat:guest:${guestId}`;
        io.to(targetRoom).emit('new_chat_message', msg);
        io.to('staff_room').emit('staff_receive_message', { room: targetRoom, message: msg });
      } catch (err) {
        logger.error('Error in send_chat_message socket:', err);
      }
    });

    socket.on('staff_join_chat', ({ room }) => {
      if (socket.user && ['admin', 'manager', 'staff'].includes(socket.user.role)) {
        socket.join(room);
        logger.info(`Staff ${socket.user.id} joined chat room: ${room}`);
      }
    });

    socket.on('staff_send_chat_message', async ({ room, content }) => {
      try {
        if (!socket.user || !['admin', 'manager', 'staff'].includes(socket.user.role)) {
          return socket.emit('chat_error', 'Không có quyền truy cập');
        }

        const ChatMessage = require('../models/ChatMessage');
        let targetUser = undefined;
        let targetGuestId = undefined;

        if (room.startsWith('chat:user:')) {
          targetUser = room.replace('chat:user:', '');
        } else if (room.startsWith('chat:guest:')) {
          targetGuestId = room.replace('chat:guest:', '');
        }

        const msg = await ChatMessage.create({
          user: targetUser,
          guestId: targetGuestId,
          sender: socket.user.id,
          senderType: 'staff',
          senderName: socket.user.name || 'Lễ tân 2T Hotel',
          content,
        });

        io.to(room).emit('new_chat_message', msg);
        io.to('staff_room').emit('staff_receive_message', { room, message: msg });
      } catch (err) {
        logger.error('Error in staff_send_chat_message socket:', err);
      }
    });

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
