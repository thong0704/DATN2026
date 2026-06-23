const jwt = require('jsonwebtoken');

const signAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });

const signRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });

const verifyAccess = (token) => jwt.verify(token, process.env.JWT_ACCESS_SECRET);
const verifyRefresh = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

const signEmailToken = (payload, exp = '1d') =>
  jwt.sign(payload, process.env.JWT_EMAIL_SECRET || process.env.JWT_ACCESS_SECRET, {
    expiresIn: exp,
  });
const verifyEmailToken = (token) =>
  jwt.verify(token, process.env.JWT_EMAIL_SECRET || process.env.JWT_ACCESS_SECRET);


const generateBookingCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `BK-${code}`;
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccess,
  verifyRefresh,
  signEmailToken,
  verifyEmailToken,
  generateBookingCode,
};
