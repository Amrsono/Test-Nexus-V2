/**
 * Unit tests for errorHandler middleware and AppError hierarchy
 */
const {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError
} = require('../errorHandler');
const errorHandler = require('../errorHandler');

describe('AppError Hierarchy', () => {
  test('creates ValidationError with status 400', () => {
    const err = new ValidationError('Bad input', ['field is required']);
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Bad input');
    expect(err.details).toEqual(['field is required']);
  });

  test('creates UnauthorizedError with status 401', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
  });

  test('creates ForbiddenError with status 403', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
  });

  test('creates NotFoundError with status 404', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
  });

  test('creates ConflictError with status 409', () => {
    const err = new ConflictError();
    expect(err.statusCode).toBe(409);
  });
});

describe('errorHandler Express middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { method: 'GET', originalUrl: '/test', ip: '127.0.0.1', user: null };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  test('formats AppError with custom statusCode and details', () => {
    const err = new ValidationError('Invalid payload', ['email required']);
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid payload',
      statusCode: 400,
      details: ['email required']
    });
  });

  test('falls back to 500 for generic unhandled Error', () => {
    const err = new Error('Database disconnected');
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Database disconnected',
      statusCode: 500
    });
  });
});
