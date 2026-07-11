const express = require('express');
const ctrl = require('../controllers/holidayPricingController');
const { protect, restrictTo, softAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', softAuth, ctrl.list); 

router.use(protect, restrictTo('admin', 'manager'));
router.post('/', ctrl.create);
router.post('/apply-all', ctrl.applyAll);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
