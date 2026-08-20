const logger = require('../lib/logger');

class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 400, details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict detected') {
    super(message, 409);
  }
}

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (statusCode >= 500) {
    logger.error(`Express Error: ${message}`, err, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      user: req.user ? { id: req.user.id, role: req.user.role } : null
    });
  } else {
    logger.warn(`Client Error [${statusCode}]: ${message}`, {
      method: req.method,
      url: req.originalUrl,
      details: err.details
    });
  }

  res.status(statusCode).json({
    error: message,
    statusCode,
    ...(err.details ? { details: err.details } : {})
  });
};

module.exports = errorHandler;
module.exports.AppError = AppError;
module.exports.ValidationError = ValidationError;
module.exports.UnauthorizedError = UnauthorizedError;
module.exports.ForbiddenError = ForbiddenError;
module.exports.NotFoundError = NotFoundError;
module.exports.ConflictError = ConflictError;

