const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const FIELD_LABELS = {
  email: 'Email',
  phone: 'Số điện thoại',
  name: 'Tên',
  slug: 'Slug',
  bookingCode: 'Mã đặt phòng',
  roomNumber: 'Số phòng',
};

const handleCastError = (err) => new AppError(`Giá trị không hợp lệ cho trường "${err.path}"`, 400);

const handleDuplicate = (err) => {
  const field = Object.keys(err.keyValue || {})[0];
  const value = err.keyValue?.[field];
  const label = FIELD_LABELS[field] || field;
  return new AppError(`${label} "${value}" đã tồn tại trong hệ thống`, 409);
};

const VALIDATION_MESSAGES = {
  required: (field) => `${FIELD_LABELS[field] || field} là bắt buộc`,
  'invalid email': () => 'Email không đúng định dạng',
  minlength: (field, err) => `${FIELD_LABELS[field] || field} phải có ít nhất ${err.properties?.minlength} ký tự`,
  maxlength: (field, err) => `${FIELD_LABELS[field] || field} không được vượt quá ${err.properties?.maxlength} ký tự`,
  min: (field, err) => `${FIELD_LABELS[field] || field} phải lớn hơn hoặc bằng ${err.properties?.min}`,
  max: (field, err) => `${FIELD_LABELS[field] || field} phải nhỏ hơn hoặc bằng ${err.properties?.max}`,
  enum: (field) => `Giá trị không hợp lệ cho trường ${FIELD_LABELS[field] || field}`,
};

const handleValidation = (err) => {
  const messages = Object.entries(err.errors).map(([field, e]) => {
    const kind = e.kind || '';
    const msgLower = (e.message || '').toLowerCase();
    if (VALIDATION_MESSAGES[kind]) return VALIDATION_MESSAGES[kind](field, e);
    if (msgLower.includes('invalid email')) return VALIDATION_MESSAGES['invalid email']();
    return e.message;
  });
  return new AppError(messages.join('. '), 400);
};

module.exports = (err, req, res, next) => {
  let error = err;
  if (err.name === 'CastError') error = handleCastError(err);
  if (err.code === 11000) error = handleDuplicate(err);
  if (err.name === 'ValidationError') error = handleValidation(err);
  if (err.name === 'JsonWebTokenError') error = new AppError('Token không hợp lệ, vui lòng đăng nhập lại', 401);
  if (err.name === 'TokenExpiredError') error = new AppError('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại', 401);

  const statusCode = error.statusCode || 500;
  const status = error.status || 'error';

  if (statusCode >= 500) {
    logger.error(err.stack || err.message);
  } else {
    logger.warn(`${statusCode} ${error.message}`);
  }

  res.status(statusCode).json({
    status,
    message: error.message || 'Internal server error',
    ...(error.details && { details: error.details }),
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
