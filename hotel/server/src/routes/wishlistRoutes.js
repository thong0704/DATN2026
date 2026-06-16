const express = require('express');
const ctrl = require('../controllers/wishlistController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/toggle', ctrl.toggle);
router.get('/', ctrl.list);

module.exports = router;
