const express = require('express');
const ctrl = require('../controllers/chatController');
const { protect, softAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/messages', softAuth, ctrl.getMessages);
router.get('/sessions', protect, ctrl.getSessions);

module.exports = router;
