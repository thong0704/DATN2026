const express = require('express');
const ctrl = require('../controllers/holidayPricingController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', ctrl.list); // public — needed for frontend pricing display

router.use(protect, restrictTo('admin', 'manager'));
router.post('/', ctrl.create);
router.post('/apply-all', ctrl.applyAll);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
