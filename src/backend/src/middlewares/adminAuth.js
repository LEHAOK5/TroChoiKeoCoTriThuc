const config = require('../config/env');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

function adminAuth(req, res, next) {
  // 1. Check Bearer JWT token
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    try {
      const decoded = jwt.verify(token, config.SESSION_SECRET);
      if (decoded && decoded.username) {
        req.admin = decoded;
        return next();
      }
    } catch (err) {
      return res.status(401).json({
        error: { code: 'INVALID_TOKEN', message: 'Phiên đăng nhập Admin đã hết hạn hoặc không hợp lệ' }
      });
    }
  }

  // 2. Check x-admin-key (Legacy / Script access)
  const clientKey = req.headers['x-admin-key'];
  if (clientKey) {
    const expectedKey = config.ADMIN_API_KEY;
    try {
      const a = Buffer.from(clientKey);
      const b = Buffer.from(expectedKey);
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
        req.admin = { username: 'admin', role: 'SUPER_ADMIN', full_name: 'Quản trị viên' };
        return next();
      }
    } catch (e) {
      // safe timing mismatch
    }
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Khóa quản trị x-admin-key không chính xác' }
    });
  }

  return res.status(401).json({
    error: { code: 'UNAUTHORIZED', message: 'Yêu cầu đăng nhập quản trị viên' }
  });
}

module.exports = adminAuth;
