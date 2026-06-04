const crypto = require('crypto');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefresh,
  signEmailToken,
  verifyEmailToken,
} = require('../utils/helpers');
const { sendVerifyEmail, sendResetPassword } = require('../services/emailService');

const REFRESH_COOKIE = 'refreshToken';
const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const issueTokens = async (user, res) => {
  const payload = { id: user._id.toString(), role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts);
  return { accessToken };
};

exports.register = catchAsync(async (req, res) => {
  const { name, email, password, phone } = req.body;
  const exists = await User.findOne({ email });
  if (exists) throw new AppError('Email đã được đăng ký', 400);

  if (phone) {
    const phoneExists = await User.findOne({ phone });
    if (phoneExists) throw new AppError('Số điện thoại đã được sử dụng', 400);
  }

  const user = await User.create({ name, email, password, phone });
  const token = signEmailToken({ id: user._id.toString() });
  const link = `${process.env.CLIENT_URL}/verify-email/${token}`;
  sendVerifyEmail(email, link).catch(() => {});

  const { accessToken } = await issueTokens(user, res);
  res.status(201).json({ status: 'success', data: { user, accessToken } });
});

exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Email hoặc mật khẩu không đúng', 401);
  }
  if (user.isBlocked) throw new AppError('Tài khoản đã bị khóa', 403);
  const { accessToken } = await issueTokens(user, res);
  res.json({ status: 'success', data: { user, accessToken } });
});

exports.logout = catchAsync(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    try {
      const decoded = verifyRefresh(token);
      await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
    } catch (e) {
      /* ignore */
    }
  }
  res.clearCookie(REFRESH_COOKIE, cookieOpts);
  res.json({ status: 'success', message: 'Logged out' });
});

exports.refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE] || req.body.refreshToken;
  if (!token) throw new AppError('Phiên đăng nhập hết hạn', 401);
  let decoded;
  try {
    decoded = verifyRefresh(token);
  } catch {
    throw new AppError('Phiên đăng nhập không hợp lệ', 401);
  }
  const user = await User.findById(decoded.id);
  if (!user) throw new AppError('Tài khoản không tồn tại', 401);
  if (user.isBlocked) throw new AppError('Tài khoản đã bị khóa', 403);

  // Issue new access token + rotate refresh token
  const { accessToken } = await issueTokens(user, res);
  res.json({ status: 'success', data: { accessToken } });
});

exports.verifyEmail = catchAsync(async (req, res) => {
  const { token } = req.params;
  let decoded;
  try {
    decoded = verifyEmailToken(token);
  } catch {
    throw new AppError('Link xác thực không hợp lệ hoặc đã hết hạn', 400);
  }
  await User.findByIdAndUpdate(decoded.id, { isEmailVerified: true });
  res.json({ status: 'success', message: 'Xác thực email thành công' });
});

exports.forgotPassword = catchAsync(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.json({ status: 'success', message: 'If exists, reset email sent' });

  const raw = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(raw).digest('hex');
  user.resetPasswordToken = hashed;
  user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  const link = `${process.env.CLIENT_URL}/reset-password/${raw}`;
  sendResetPassword(user.email, link).catch(() => {});
  res.json({ status: 'success', message: 'Reset email sent' });
});

exports.resetPassword = catchAsync(async (req, res) => {
  const { token } = req.params;
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpire');
  if (!user) throw new AppError('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn', 400);
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  res.json({ status: 'success', message: 'Đặt lại mật khẩu thành công' });
});

exports.getMe = catchAsync(async (req, res) => {
  res.json({ status: 'success', data: { user: req.user } });
});

exports.updateProfile = catchAsync(async (req, res) => {
  const allowed = ['name', 'phone'];
  const updates = {};
  allowed.forEach((k) => req.body[k] !== undefined && (updates[k] = req.body[k]));

  // Check phone uniqueness if being updated
  if (updates.phone) {
    const phoneExists = await User.findOne({ phone: updates.phone, _id: { $ne: req.user._id } });
    if (phoneExists) throw new AppError('Số điện thoại đã được sử dụng bởi tài khoản khác', 400);
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ status: 'success', data: { user } });
});

exports.changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) throw new AppError('Mật khẩu hiện tại không đúng', 400);
  user.password = newPassword;
  await user.save();
  res.json({ status: 'success', message: 'Đổi mật khẩu thành công' });
});

exports.uploadAvatar = catchAsync(async (req, res) => {
  if (!req.file) throw new AppError('Chưa chọn file ảnh', 400);
  let url = req.file.path || req.file.secure_url || '';
  // Local disk fallback: convert absolute disk path to /uploads/... URL
  if (url && !/^https?:\/\//i.test(url)) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const rel = url.replace(/\\/g, '/').split('/uploads/').pop();
    url = `${baseUrl}/uploads/${rel}`;
  }
  const public_id = req.file.filename || req.file.public_id || '';
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: { url, public_id } },
    { new: true }
  );
  res.json({ status: 'success', data: { user } });
});
