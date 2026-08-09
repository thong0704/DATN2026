require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();
  const server = http.createServer(app);
  initSocket(server);
  server.listen(PORT, '0.0.0.0', () => logger.info(`🚀 Server running on port ${PORT} (0.0.0.0)`));
})();

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection: ' + (err?.message || err));
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception: ' + err.message);
  process.exit(1);
});
