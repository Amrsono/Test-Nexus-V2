/**
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
