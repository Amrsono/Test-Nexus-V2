import os

tests_dir = "server/routes/__tests__"
os.makedirs(tests_dir, exist_ok=True)
mw_tests_dir = "server/middleware/__tests__"
os.makedirs(mw_tests_dir, exist_ok=True)

# 1. testCases.test.js
test_cases_test = """/**
 * Unit/Integration tests for /api/test-cases
 * Supertest against Express app with mocked Prisma
 */
jest.mock('../../lib/prisma', () => ({
  project: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  testCase: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  testSuite: {
    create: jest.fn(),
    findFirst: jest.fn(),
  },
  $transaction: jest.fn(),
}));

jest.mock('../../middleware/auth', () => ({
  auth: (req, _res, next) => {
    req.user = { id: 'user-1', role: 'ADMIN' };
    next();
  },
  isAdmin: (_req, _res, next) => next(),
  canImport: (_req, _res, next) => next(),
}));

const request = require('supertest');
const app = require('../../index');
const prisma = require('../../lib/prisma');

const mockTestCase = {
  id: 'tc-1',
  summary: 'Verify login flow',
  priority: 'HIGH',
  module: 'Authentication',
  status: 'PENDING',
  steps: '1. Enter email\\n2. Enter password\\n3. Click login',
  expectedResult: 'User should see dashboard',
  suiteId: 'suite-1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('GET /api/test-cases', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with test cases array', async () => {
    prisma.project.findMany.mockResolvedValue([{ id: 'proj-1' }]);
    prisma.testCase.findMany.mockResolvedValue([mockTestCase]);

    const res = await request(app).get('/api/test-cases?projectId=proj-1');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].summary).toBe('Verify login flow');
  });
});

describe('POST /api/test-cases', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 when summary is missing', async () => {
    const res = await request(app)
      .post('/api/test-cases')
      .send({ priority: 'HIGH' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('details');
  });

  test('creates a test case successfully', async () => {
    prisma.testCase.create.mockResolvedValue(mockTestCase);

    const res = await request(app)
      .post('/api/test-cases')
      .send({
        summary: 'Verify login flow',
        priority: 'HIGH',
        module: 'Authentication',
      });
    expect(res.status).toBe(201);
    expect(res.body.summary).toBe('Verify login flow');
  });
});

describe('POST /api/test-cases/reset', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 when projectId is missing', async () => {
    const res = await request(app)
      .post('/api/test-cases/reset')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('details');
  });

  test('resets test cases successfully for valid project', async () => {
    prisma.project.findUnique.mockResolvedValue({ id: 'proj-1', ownerId: 'user-1' });
    prisma.testCase.updateMany.mockResolvedValue({ count: 5 });
    prisma.testCase.findMany.mockResolvedValue([]);

    const res = await request(app)
      .post('/api/test-cases/reset')
      .send({ projectId: 'proj-1' });
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(5);
  });
});

describe('GET /api/test-cases/stats', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns test case counts by status', async () => {
    prisma.testCase.count
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(6)  // passed
      .mockResolvedValueOnce(2)  // failed
      .mockResolvedValueOnce(1)  // blocked
      .mockResolvedValueOnce(1); // pending

    const res = await request(app).get('/api/test-cases/stats?projectId=proj-1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      total: 10,
      passed: 6,
      failed: 2,
      blocked: 1,
      pending: 1
    });
  });
});
"""
with open(os.path.join(tests_dir, "testCases.test.js"), "w", encoding="utf-8") as f:
    f.write(test_cases_test)

# 2. reports.test.js
reports_test = """/**
 * Unit tests for /api/reports
 */
jest.mock('../../lib/prisma', () => ({
  project: {
    findUnique: jest.fn(),
  },
}));

jest.mock('../../middleware/auth', () => ({
  auth: (req, _res, next) => {
    req.user = { id: 'user-1', role: 'ADMIN', subscriptionStatus: 'ACTIVE' };
    next();
  },
  isAdmin: (_req, _res, next) => next(),
  canImport: (_req, _res, next) => next(),
}));

const request = require('supertest');
const app = require('../../index');
const prisma = require('../../lib/prisma');

describe('GET /api/reports/project/:id/ppt', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 404 when project does not exist', async () => {
    prisma.project.findUnique.mockResolvedValue(null);

    const res = await request(app).get('/api/reports/project/nonexistent/ppt');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  test('generates PPT report and returns 200 with presentation header', async () => {
    prisma.project.findUnique.mockResolvedValue({
      id: 'proj-1',
      name: 'Release 2026',
      insights: [],
      testSuites: [
        {
          testCases: [
            { status: 'PASS', module: 'Auth' },
            { status: 'FAIL', module: 'Billing' },
            { status: 'BLOCKED', module: 'Billing' }
          ]
        }
      ],
      defects: [
        { id: 'd-1', severity: 'P1', status: 'OPEN' }
      ]
    });

    const res = await request(app).get('/api/reports/project/proj-1/ppt');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/presentation/i);
  });
});
"""
with open(os.path.join(tests_dir, "reports.test.js"), "w", encoding="utf-8") as f:
    f.write(reports_test)

# 3. auth.test.js
auth_test = """/**
 * Unit tests for /api/auth
 */
jest.mock('../../lib/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
}));

const request = require('supertest');
const app = require('../../index');
const prisma = require('../../lib/prisma');
const bcrypt = require('bcryptjs');

describe('POST /api/auth/register', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 when email or password is missing or invalid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'invalid-email', password: '' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('details');
  });

  test('returns 400 when user already exists', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u-1', email: 'test@example.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123', name: 'Tester' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already exists/i);
  });

  test('registers a new user successfully and issues token', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'u-new',
      email: 'newuser@example.com',
      name: 'New User',
      subscriptionStatus: 'TRIAL'
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'newuser@example.com', password: 'password123', name: 'New User' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('newuser@example.com');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 on invalid email credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'unknown@example.com', password: 'password123' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  test('returns token upon successful login', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    prisma.user.findUnique.mockResolvedValue({
      id: 'u-1',
      email: 'valid@example.com',
      password: hashedPassword
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'valid@example.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.id).toBe('u-1');
  });
});
"""
with open(os.path.join(tests_dir, "auth.test.js"), "w", encoding="utf-8") as f:
    f.write(auth_test)

# 4. projects.test.js
projects_test = """/**
 * Unit tests for /api/projects
 */
jest.mock('../../lib/prisma', () => ({
  project: {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../../middleware/auth', () => ({
  auth: (req, _res, next) => {
    req.user = { id: 'user-1', role: 'ADMIN' };
    next();
  },
  isAdmin: (_req, _res, next) => next(),
  canImport: (_req, _res, next) => next(),
}));

const request = require('supertest');
const app = require('../../index');
const prisma = require('../../lib/prisma');

describe('GET /api/projects', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns list of projects', async () => {
    prisma.project.findMany.mockResolvedValue([
      { id: 'p-1', name: 'Nexus Core', themeColor: '#6366f1' }
    ]);

    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].name).toBe('Nexus Core');
  });
});

describe('POST /api/projects', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ description: 'No name' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('details');
  });

  test('creates a project successfully', async () => {
    prisma.project.create.mockResolvedValue({
      id: 'p-new',
      name: 'Alpha Sprint',
      themeColor: '#10b981',
      ownerId: 'user-1'
    });

    const res = await request(app)
      .post('/api/projects')
      .send({ name: 'Alpha Sprint', themeColor: '#10b981' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Alpha Sprint');
  });
});
"""
with open(os.path.join(tests_dir, "projects.test.js"), "w", encoding="utf-8") as f:
    f.write(projects_test)

# 5. errorHandler.test.js
err_test = """/**
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
"""
with open(os.path.join(mw_tests_dir, "errorHandler.test.js"), "w", encoding="utf-8") as f:
    f.write(err_test)

print('Server tests created successfully!')
