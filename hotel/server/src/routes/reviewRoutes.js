const express = require('express');
const ctrl = require('../controllers/reviewController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/hotel/:hotelId', ctrl.byHotel);

router.use(protect);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.put('/:id/respond', restrictTo('admin', 'manager', 'staff'), ctrl.respond);
router.put('/:id/approve', restrictTo('admin'), ctrl.approve);

module.exports = router;
