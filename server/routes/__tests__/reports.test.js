jest.mock('../../lib/prisma', () => ({
  project: {
    findUnique: jest.fn(),
  },
}));

jest.mock('pptxgenjs', () => {
  return jest.fn().mockImplementation(() => ({
    layout: '',
    ShapeType: { rect: 1, roundRect: 2 },
    ChartType: { pie: 'pie', bar: 'bar', doughnut: 'doughnut', line: 'line' },
    addSlide: jest.fn().mockReturnValue({
      addText: jest.fn(),
      addShape: jest.fn(),
      addChart: jest.fn(),
      addTable: jest.fn(),
      background: {}
    }),
    write: jest.fn().mockResolvedValue(Buffer.from('fake-pptx-data'))
  }));
});


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
