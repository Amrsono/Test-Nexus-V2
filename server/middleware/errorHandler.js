const logger = require('../lib/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`Express Error: ${err.message}`, err, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    user: req.user ? { id: req.user.id, role: req.user.role } : null
  });

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    statusCode
  });
};

module.exports = errorHandler;
