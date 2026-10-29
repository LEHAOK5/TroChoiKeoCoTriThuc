const rateLimit = require('express-rate-limit');

const registerLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // Tối ưu phục vụ ngày hội đông sinh viên dùng chung Wi-Fi trường
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
