const express = require('express');
const ctrl = require('../controllers/roomController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const { makeUploader } = require('../middlewares/upload');

const router = express.Router();
const upload = makeUploader('hotel/rooms');

router.get('/available', ctrl.getAvailable);
router.get('/hotel/:hotelId', ctrl.getByHotel);
router.get('/:id', ctrl.getById);

router.use(protect);
router.post('/', restrictTo('admin', 'manager'), ctrl.create);
router.put('/:id', restrictTo('admin', 'manager'), ctrl.update);
router.delete('/:id', restrictTo('admin'), ctrl.remove);
router.put('/:id/status', restrictTo('admin', 'manager', 'staff'), ctrl.updateStatus);
router.post('/:id/images', restrictTo('admin', 'manager'), upload.array('images', 10), ctrl.uploadImages);

module.exports = router;
