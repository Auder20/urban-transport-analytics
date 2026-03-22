const request = require('supertest');
const app = require('../app');

// Mock the database connections to avoid actual DB connections during tests
jest.mock('../config/postgresql', () => ({
  query: jest.fn(),
  pool: {
    end: jest.fn()
  }
}));

jest.mock('../config/mongodb', () => ({
  connectMongo: jest.fn(),
  disconnectMongo: jest.fn()
}));

jest.mock('../config/redis', () => ({
  connectRedis: jest.fn(),
  disconnectRedis: jest.fn()
}));

describe('Authentication API', () => {
  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      // Mock successful login response
      const mockUser = {
        id: 1,
        email: 'admin@uta.com',
        name: 'Admin User',
        role: 'admin'
      };

      // Mock the database query to return a user
      const { query } = require('../config/postgresql');
      query.mockResolvedValueOnce({
        rows: [{
          id: mockUser.id,
          email: mockUser.email,
          password_hash: '$2b$10$mock.hashed.password',
          name: mockUser.name,
          role: mockUser.role,
          is_active: true
        }]
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@uta.com',
          password: 'admin123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('admin@uta.com');
    });

    it('should return 401 with invalid credentials', async () => {
      // Mock the database query to return no user
      const { query } = require('../config/postgresql');
      query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@uta.com'
          // missing password
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Protected Routes', () => {
    it('should return 401 when accessing protected route without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 401 when accessing protected route with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});
