require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const xss = require('xss-clean');

const errorHandler = require('./middlewares/errorHandler');
const { globalLimiter } = require('./middlewares/rateLimiter');
const AppError = require('./utils/AppError');
const paymentCtrl = require('./controllers/paymentController');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
  })
);
app.use(cookieParser());
app.use(compression());


app.post('/api/v1/payments/webhook', express.raw({ type: 'application/json' }), paymentCtrl.webhook);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(xss());
app.use(hpp({ whitelist: ['amenities', 'stars', 'fields', 'sort'] }));

if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
app.use('/api', globalLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.get('/seed-database', async (req, res) => {
  try {
    const seedDatabase = require('./utils/seedFunction');
    const result = await seedDatabase();
    res.json({ status: 'success', message: 'Nạp dữ liệu khách sạn thành công!', data: result });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});
app.get('/users-list', async (req, res) => {
  try {
    const User = require('./models/User');
    const users = await User.find().select('name email role isEmailVerified phone createdAt');
    res.json({ status: 'success', count: users.length, users });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});
app.get('/env-check', (req, res) => {
  res.json({
    SMTP_USER: process.env.SMTP_USER || 'MISSING',
    SMTP_PASS_SET: Boolean(process.env.SMTP_PASS),
    SMTP_HOST: process.env.SMTP_HOST || 'default: smtp.gmail.com',
    SMTP_PORT: process.env.SMTP_PORT || 'default: 587/465',
  });
});
app.get('/test-email', async (req, res) => {
  const emailService = require('./services/emailService');
  const targetEmail = req.query.email || process.env.SMTP_USER || 'ttt11072004st@gmail.com';
  try {
    const result = await emailService.sendVerificationCode(targetEmail, '999888');
    res.json({ status: 'success', targetEmail, result });
  } catch (err) {
    res.status(500).json({ status: 'error', targetEmail, error: err.stack || err.message });
  }
});


app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/v1', require('./routes'));

app.all('*', (req, res, next) => next(new AppError(`Route not found: ${req.originalUrl}`, 404)));
app.use(errorHandler);

module.exports = app;
