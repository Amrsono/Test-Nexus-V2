/**
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
  steps: '1. Enter email\n2. Enter password\n3. Click login',
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
