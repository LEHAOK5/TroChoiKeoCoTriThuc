const config = require('./env');

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. mobile apps, curl, or same-origin)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    const isAllowed = config.CORS_ORIGINS.some(allowedOrigin => {
      if (allowedOrigin === '*') return true;
      return origin === allowedOrigin || origin.endsWith('.vercel.app');
    });

    if (isAllowed || config.NODE_ENV === 'development') {
      return callback(null, true);
    } else {
      return callback(new Error(`CORS origin not allowed: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key']
};

module.exports = {
  corsOptions,
  allowedOrigins: config.CORS_ORIGINS
};
