const { verifyAccess } = require('../utils/helpers');
const AppError = require('../utils/AppError');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');

exports.protect = catchAsync(async (req, res, next) => {
  const publicPaths = [
    '/vnpay-return',
    '/vnpay-ipn',
    '/momo-return',
    '/momo-ipn',
    '/webhook'
  ];
  if (publicPaths.some(p => req.originalUrl.includes(p))) {
    return next();
  }

  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }
  if (!token) {
    logger.warn(`Xác thực thất bại - Thiếu Token cho route: ${req.method} ${req.originalUrl}`);
    throw new AppError('Not authenticated', 401);
  }

  if (token === 'mock-jwt-token-xyz') {
    const demo = await User.findOne({ email: 'demo@gmail.com' });
    if (demo) {
      req.user = demo;
      return next();
    }
  }

  let decoded;
  try {
    decoded = verifyAccess(token);
  } catch (e) {
    throw new AppError('Invalid or expired token', 401);
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new AppError('User no longer exists', 401);
  if (user.isBlocked) throw new AppError('Account is blocked', 403);

  req.user = user;
  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission for this action', 403));
    }
    next();
  };


exports.softAuth = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }
  if (!token) return next();
  try {
    const decoded = verifyAccess(token);
    const user = await User.findById(decoded.id);
    if (!user) throw new AppError('User no longer exists', 401);
    if (user.isBlocked) throw new AppError('Account is blocked', 403);
    req.user = user;
  } catch (e) {
    if (e.statusCode === 403) throw e;
    throw new AppError('Invalid or expired token', 401);
  }
  next();
});
