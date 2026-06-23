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
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
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


app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/v1', require('./routes'));

app.all('*', (req, res, next) => next(new AppError(`Route not found: ${req.originalUrl}`, 404)));
app.use(errorHandler);

module.exports = app;
