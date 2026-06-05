const express = require('express');
const { body } = require('express-validator');
const ctrl = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { authLimiter } = require('../middlewares/rateLimiter');
const { makeUploader } = require('../middlewares/upload');

const router = express.Router();
const upload = makeUploader('hotel/avatars');

router.post(
  '/register',
  authLimiter,
  [
    body('name').notEmpty().withMessage('Name required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password >= 6 chars'),
  ],
  validate,
  ctrl.register
);

router.post(
  '/login',
  authLimiter,
  [body('email').isEmail(), body('password').notEmpty()],
  validate,
  ctrl.login
);

router.post('/logout', ctrl.logout);
router.post('/refresh-token', ctrl.refreshToken);
router.get('/verify-email/:token', ctrl.verifyEmail);
router.post(
  '/verify-registration',
  authLimiter,
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits'),
  ],
  validate,
  ctrl.verifyRegistration
);
router.post(
  '/resend-verification-code',
  authLimiter,
  [body('email').isEmail().withMessage('Valid email required')],
  validate,
  ctrl.resendVerificationCode
);
router.post('/forgot-password', authLimiter, [body('email').isEmail()], validate, ctrl.forgotPassword);
router.put(
  '/reset-password/:token',
  [body('password').isLength({ min: 6 })],
  validate,
  ctrl.resetPassword
);

router.use(protect);
router.get('/me', ctrl.getMe);
router.put('/update-profile', ctrl.updateProfile);
router.put(
  '/change-password',
  [body('currentPassword').notEmpty(), body('newPassword').isLength({ min: 6 })],
  validate,
  ctrl.changePassword
);
router.post('/upload-avatar', upload.single('avatar'), ctrl.uploadAvatar);

module.exports = router;
