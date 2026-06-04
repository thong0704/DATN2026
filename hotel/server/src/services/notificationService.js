const Notification = require('../models/Notification');
const { getIO } = require('../config/socket');
const logger = require('../utils/logger');

/**
 * Create a Notification document and emit it via Socket.io.
 * Targets: a specific user, or a role-based room.
 */
async function notify({ user, audience = 'user', type, title, message, link, data }) {
  const doc = await Notification.create({ user, audience, type, title, message, link, data });
  try {
    const io = getIO();
    const payload = doc.toObject();
    if (user) io.to(`user:${user}`).emit('notification', payload);
    if (audience === 'staff' || audience === 'admin' || audience === 'all') {
      io.to(audience === 'admin' ? 'admin_room' : 'staff_room').emit('notification', payload);
    }
  } catch (e) {
    logger.warn('Socket emit skipped: ' + e.message);
  }
  return doc;
}

function emitToHotel(hotelId, event, payload) {
  try {
    getIO().to(`hotel:${hotelId}`).emit(event, payload);
  } catch (e) {
    /* socket not ready */
  }
}

module.exports = { notify, emitToHotel };
