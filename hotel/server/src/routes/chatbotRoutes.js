const express = require('express');
const router = express.Router();
const chatbotCtrl = require('../controllers/chatbotController');
const { chatLimiter } = require('../middlewares/rateLimiter');
const { softAuth } = require('../middlewares/authMiddleware');

// Rate limit chatbot: 20 requests per minute per IP
router.post('/', chatLimiter, softAuth, chatbotCtrl.chat);

module.exports = router;
