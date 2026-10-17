function errorHandler(err, req, res, next) {
  console.error('[API Error]', err.stack || err.message);
  
  const status = err.status || 500;
  res.status(status).json({
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Đã xảy ra lỗi máy chủ nội bộ'
    }
  });
}

module.exports = errorHandler;
