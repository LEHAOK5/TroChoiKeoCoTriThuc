const http = require('http');
const config = require('./config/env');
const createApp = require('./app');
const initSocketIO = require('./sockets');
const logger = require('./utils/logger');

const server = http.createServer();
const { io, roomManager } = initSocketIO(server);
const app = createApp(roomManager);

// Route HTTP requests to Express app
server.on('request', app);

server.listen(config.PORT, () => {
  logger.info('Server', '=======================================================');
  logger.info('Server', ` KÉO CO TRI THỨC - BACKEND v2.0 RUNNING ON PORT ${config.PORT}`);
  logger.info('Server', ` Environment: ${config.NODE_ENV}`);
  logger.info('Server', ` Allowed CORS: ${config.CORS_ORIGINS.join(', ')}`);
  logger.info('Server', '=======================================================');
});

module.exports = { server, io, roomManager };
