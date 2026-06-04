const express = require('express');
const ctrl = require('../controllers/hotelController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const { makeUploader } = require('../middlewares/upload');

const router = express.Router();
const upload = makeUploader('hotel/hotels');

router.get('/search', ctrl.search);
router.get('/', ctrl.list);
router.get('/:slug', ctrl.getBySlug);
router.get('/id/:id', ctrl.getById);
router.get('/:id/rooms', ctrl.getAvailableRooms);
router.get('/:id/reviews', ctrl.getReviews);

router.use(protect);
router.post('/', restrictTo('admin'), ctrl.create);
router.put('/:id', restrictTo('admin', 'manager'), ctrl.update);
router.delete('/:id', restrictTo('admin'), ctrl.remove);
router.post('/:id/images', restrictTo('admin', 'manager'), upload.array('images', 10), ctrl.uploadImages);

module.exports = router;
