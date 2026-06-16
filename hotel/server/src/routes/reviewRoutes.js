const express = require('express');
const ctrl = require('../controllers/reviewController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const { makeUploader } = require('../middlewares/upload');

const router = express.Router();
const upload = makeUploader('hotel/reviews');

router.get('/hotel/:hotelId', ctrl.byHotel);

router.use(protect);
router.post('/upload', upload.array('images', 5), (req, res) => {
  const files = req.files || [];
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const urls = files.map((f) => {
    let url = f.path || f.secure_url || '';
    if (url && !/^https?:\/\//i.test(url)) {
      const rel = url.replace(/\\/g, '/').split('/uploads/').pop();
      url = `${baseUrl}/uploads/${rel}`;
    }
    return url;
  });
  res.json({ status: 'success', urls });
});

router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.put('/:id/respond', restrictTo('admin', 'manager', 'staff'), ctrl.respond);
router.put('/:id/approve', restrictTo('admin'), ctrl.approve);

module.exports = router;
