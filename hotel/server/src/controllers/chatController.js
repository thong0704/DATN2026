const ChatMessage = require('../models/ChatMessage');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');


exports.getMessages = catchAsync(async (req, res) => {
  const { userId, guestId } = req.query;

  let filter = {};
  
  if (req.user && ['admin', 'manager', 'staff'].includes(req.user.role)) {
    if (userId) filter.user = userId;
    else if (guestId) filter.guestId = guestId;
    else return res.json({ status: 'success', data: { messages: [] } });

    if (['manager', 'staff'].includes(req.user.role)) {
      filter.hotel = req.user.assignedHotel;
    }
  } else {
    if (req.user) {
      filter.user = req.user.id;
    } else if (guestId) {
      filter.guestId = guestId;
    } else {
      return res.json({ status: 'success', data: { messages: [] } });
    }
    if (req.query.hotel) {
      filter.hotel = req.query.hotel;
    }
  }

  const messages = await ChatMessage.find(filter).sort('createdAt');
  res.json({ status: 'success', data: { messages } });
});


exports.getSessions = catchAsync(async (req, res) => {
  if (!req.user || !['admin', 'manager', 'staff'].includes(req.user.role)) {
    throw new AppError('Bạn không có quyền thực hiện hành động này', 403);
  }

  const matchFilter = {};
  if (['manager', 'staff'].includes(req.user.role)) {
    matchFilter.hotel = req.user.assignedHotel;
  }

  const sessions = await ChatMessage.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: {
          $cond: [
            { $ifNull: ['$user', false] },
            { type: 'user', id: '$user' },
            { type: 'guest', id: '$guestId' }
          ]
        },
        lastMessage: { $last: '$content' },
        lastMessageAt: { $last: '$createdAt' },
        senderName: { $last: '$senderName' },
        senderType: { $last: '$senderType' },
        hotel: { $last: '$hotel' }
      }
    },
    { $sort: { lastMessageAt: -1 } }
  ]);

  const populatedSessions = await Promise.all(
    sessions.map(async (sess) => {
      const s = {
        type: sess._id.type,
        id: sess._id.id,
        lastMessage: sess.lastMessage,
        lastMessageAt: sess.lastMessageAt,
        senderName: sess.senderName,
        senderType: sess.senderType,
        room: sess._id.type === 'user' ? `chat:user:${sess._id.id}` : `chat:guest:${sess._id.id}`,
      };

      if (sess.hotel) {
        const Hotel = require('../models/Hotel');
        const h = await Hotel.findById(sess.hotel).select('name');
        if (h) {
          s.hotel = { _id: h._id, name: h.name };
        }
      }

      if (s.type === 'user') {
        const User = require('../models/User');
        const u = await User.findById(s.id).select('name email avatar');
        if (u) {
          s.name = u.name;
          s.email = u.email;
          s.avatar = u.avatar;
        } else {
          s.name = s.senderName || 'Thành viên';
        }
      } else {
        s.name = `Khách #${s.id.slice(-6).toUpperCase()}`;
      }
      return s;
    })
  );

  res.json({ status: 'success', data: { sessions: populatedSessions } });
});
