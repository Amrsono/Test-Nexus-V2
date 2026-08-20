/**
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
