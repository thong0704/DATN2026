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
const { sendVerifyEmail, sendResetPassword, sendVerificationCode, sendResetPasswordCode } = require('../services/emailService');

const logger = require('../utils/logger');

const REFRESH_COOKIE = 'refreshToken';
const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.register = catchAsync(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name) throw new AppError('Họ và tên là bắt buộc', 400);
  if (!email) throw new AppError('Email là bắt buộc', 400);
  if (!phone) throw new AppError('Số điện thoại là bắt buộc', 400);

  const existingEmail = await User.findOne({ email });
  if (existingEmail && existingEmail.isEmailVerified) {
    throw new AppError('Email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập.', 400);
  }

  const existingPhone = await User.findOne({ phone });
  if (existingPhone) {
    if (existingPhone.isEmailVerified || existingPhone.email !== email) {
      throw new AppError('Số điện thoại này đã được sử dụng. Vui lòng sử dụng số điện thoại khác.', 400);
    }
  }

  if (existingEmail && !existingEmail.isEmailVerified) {
    await User.findByIdAndDelete(existingEmail._id);
  }
  if (existingPhone && !existingPhone.isEmailVerified && existingPhone.email === email) {
    await User.findByIdAndDelete(existingPhone._id);
  }

  const code = generateVerificationCode();
  const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

  const user = await User.create({
    name, email, password, phone,
    emailVerificationCode: hashedCode,
    emailVerificationExpire: Date.now() + 10 * 60 * 1000, 
  });

  let mailSent = false;
  try {
    const info = await sendVerificationCode(email, code);
    if (info && !info.stub) mailSent = true;
  } catch (err) {
    logger.error(`Failed to send verification code to ${email}: ${err.stack || err.message}`);
  }

  res.status(201).json({
    status: 'success',
    message: mailSent
      ? 'Mã xác thực đã được gửi đến email của bạn'
      : `Hệ thống đã tạo mã xác thực thành công. Mã xác thực đăng ký của bạn là: ${code}`,
    data: { email, code: mailSent ? undefined : code },
  });
});

exports.verifyRegistration = catchAsync(async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) throw new AppError('Vui lòng cung cấp email và mã xác thực', 400);

  const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
  const user = await User.findOne({
    email,
    emailVerificationCode: hashedCode,
    emailVerificationExpire: { $gt: Date.now() },
  }).select('+emailVerificationCode +emailVerificationExpire');

  if (!user) throw new AppError('Mã xác thực không hợp lệ hoặc đã hết hạn', 400);

  user.isEmailVerified = true;
  user.emailVerificationCode = undefined;
  user.emailVerificationExpire = undefined;
  await user.save({ validateBeforeSave: false });

  const { accessToken } = await issueTokens(user, res);
  res.json({ status: 'success', data: { user, accessToken } });
});

exports.resendVerificationCode = catchAsync(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new AppError('Vui lòng cung cấp email', 400);

  const user = await User.findOne({ email, isEmailVerified: false });
  if (!user) throw new AppError('Email không tồn tại hoặc đã được xác thực', 400);

  const code = generateVerificationCode();
  const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

  user.emailVerificationCode = hashedCode;
  user.emailVerificationExpire = Date.now() + 10 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  let mailSent = false;
  try {
    const info = await sendVerificationCode(email, code);
    if (info && !info.stub) mailSent = true;
  } catch (err) {
    logger.error(`Failed to resend verification code to ${email}: ${err.stack || err.message}`);
  }

  res.json({
    status: 'success',
    message: mailSent
      ? 'Mã xác thực mới đã được gửi'
      : `Mã xác thực mới của bạn là: ${code}`,
    data: { email, code: mailSent ? undefined : code },
  });
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
  if (!user) {
    return res.json({
      status: 'success',
      message: 'Mã xác nhận đã được gửi nếu email tồn tại trong hệ thống'
    });
  }

  const code = generateVerificationCode();
  const hashed = crypto.createHash('sha256').update(code).digest('hex');
  user.resetPasswordToken = hashed;
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; 
  await user.save({ validateBeforeSave: false });

  sendResetPasswordCode(user.email, code).catch(() => {});
  res.json({
    status: 'success',
    message: 'Mã xác nhận đã được gửi đến email của bạn'
  });
});

exports.resetPassword = catchAsync(async (req, res) => {
  const { email, code, password } = req.body;
  if (!email || !code || !password) {
    throw new AppError('Vui lòng cung cấp đầy đủ thông tin', 400);
  }

  const hashed = crypto.createHash('sha256').update(code).digest('hex');
  const user = await User.findOne({
    email,
    resetPasswordToken: hashed,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpire');

  if (!user) {
    throw new AppError('Mã xác nhận không đúng, không hợp lệ hoặc đã hết hạn', 400);
  }

  user.password = password;
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
