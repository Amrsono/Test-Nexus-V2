/**
 * Integration tests for /api/defects
 * Uses Supertest to fire real HTTP requests against the Express app,
 * with Prisma mocked so no live database is required.
 */
jest.mock('../lib/prisma', () => ({
  project: {
    findUnique: jest.fn(),
  },
  defect: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock auth middleware to inject a test user
jest.mock('../middleware/auth', () => ({
  auth: (req, _res, next) => {
    req.user = { id: 'user-1', role: 'USER' };
    next();
  },
}));

const request = require('supertest');
const app = require('../../index');
const prisma = require('../lib/prisma');

const mockProject = {
  id: 'project-1',
  name: 'Test Project',
  ownerId: 'user-1',
};

const mockDefect = {
  id: 'defect-1',
  projectId: 'project-1',
  title: 'Login button broken',
  severity: 'P2',
  status: 'OPEN',
  description: 'The login button does nothing when clicked.',
  owner: 'tester@example.com',
  actionPlan: 'Investigate click handler.',
  futImpact: 'Blocks all login flows.',
  blockedCases: '',
  externalId: 'BUG-001',
  raisedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('GET /api/defects', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 when projectId is missing', async () => {
    const res = await request(app).get('/api/defects');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/projectId/i);
  });

  test('returns 200 with defects array for valid project', async () => {
    prisma.project.findUnique.mockResolvedValue(mockProject);
    prisma.defect.findMany.mockResolvedValue([mockDefect]);

    const res = await request(app).get('/api/defects?projectId=project-1');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({ title: 'Login button broken', severity: 'P2' });
  });
});

describe('POST /api/defects', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/defects')
      .send({ severity: 'P2' }); // missing projectId + title
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('details');
  });

  test('returns 404 when project is not found', async () => {
    prisma.project.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/defects')
      .send({ projectId: 'no-project', title: 'Bug', severity: 'P1' });
    expect(res.status).toBe(404);
  });

  test('returns 403 when user does not own the project', async () => {
    prisma.project.findUnique.mockResolvedValue({ ...mockProject, ownerId: 'other-user' });
    const res = await request(app)
      .post('/api/defects')
      .send({ projectId: 'project-1', title: 'Bug', severity: 'P2' });
    expect(res.status).toBe(403);
  });

  test('creates a defect successfully', async () => {
    prisma.project.findUnique.mockResolvedValue(mockProject);
    prisma.defect.create.mockResolvedValue(mockDefect);

    const res = await request(app)
      .post('/api/defects')
      .send({
        projectId: 'project-1',
        title: 'Login button broken',
        severity: 'P2',
        status: 'OPEN',
        description: 'The login button does nothing.',
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ title: 'Login button broken', severity: 'P2' });
    expect(prisma.defect.create).toHaveBeenCalledTimes(1);
  });
});
