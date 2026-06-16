const ChatMessage = require('../models/ChatMessage');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Get history of messages for a chat session
exports.getMessages = catchAsync(async (req, res) => {
  const { userId, guestId } = req.query;

  let filter = {};
  
  // Staff/Admin can query any room
  if (req.user && ['admin', 'manager', 'staff'].includes(req.user.role)) {
    if (userId) filter.user = userId;
    else if (guestId) filter.guestId = guestId;
    else return res.json({ status: 'success', data: { messages: [] } });
  } else {
    // Customers can only query their own
    if (req.user) {
      filter.user = req.user.id;
    } else if (guestId) {
      filter.guestId = guestId;
    } else {
      return res.json({ status: 'success', data: { messages: [] } });
    }
  }

  const messages = await ChatMessage.find(filter).sort('createdAt');
  res.json({ status: 'success', data: { messages } });
});

// Get all active chat sessions (Admin/Staff only)
exports.getSessions = catchAsync(async (req, res) => {
  if (!req.user || !['admin', 'manager', 'staff'].includes(req.user.role)) {
    throw new AppError('Bạn không có quyền thực hiện hành động này', 403);
  }

  const sessions = await ChatMessage.aggregate([
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
        senderType: { $last: '$senderType' }
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
