const express = require('express');
const ctrl = require('../controllers/couponController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/validate', ctrl.validate); 

router.use(protect);
router.get('/mine', restrictTo('admin', 'manager'), ctrl.listMine);
router.post('/', restrictTo('admin', 'manager'), ctrl.create);
router.put('/:id', restrictTo('admin', 'manager'), ctrl.update);
router.delete('/:id', restrictTo('admin', 'manager'), ctrl.remove);

module.exports = router;
