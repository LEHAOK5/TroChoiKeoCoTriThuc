const express = require('express');
const cors = require('cors');
const { corsOptions } = require('./config/cors');
const errorHandler = require('./middlewares/errorHandler');

const createHealthRouter = require('./routes/health.routes');
const registerRouter = require('./routes/register.routes');
const createRoomsRouter = require('./routes/rooms.routes');
const matchesRouter = require('./routes/matches.routes');
const createAdminRouter = require('./routes/admin.routes');

function createApp(roomManager) {
  const app = express();

  // Global Middlewares
  app.use(cors(corsOptions));
  app.use(express.json());

  // Mount REST APIs
  app.use('/api/health', createHealthRouter(roomManager));
  app.use('/api/register', registerRouter);
  app.use('/api/rooms', createRoomsRouter(roomManager));
  app.use('/api/matches', matchesRouter);
  app.use('/api/admin', createAdminRouter(roomManager));

  // 404 handler for unknown routes
  app.use((req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: `Route không tồn tại: ${req.method} ${req.originalUrl}` }
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
