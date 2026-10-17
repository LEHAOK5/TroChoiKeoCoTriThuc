const rateLimit = require('express-rate-limit');

const registerLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 registrations per minute per IP
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Bạn thao tác quá nhanh, vui lòng chờ 1 phút.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  registerLimiter
};
