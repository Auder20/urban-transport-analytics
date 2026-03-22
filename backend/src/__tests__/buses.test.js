const request = require('supertest');
const app = require('../app');

// Mock the database connections
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

describe('Buses API', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /api/buses', () => {
    it('should list all buses successfully', async () => {
      const mockBuses = [
        {
          id: 1,
          plate_number: 'ABC123',
          route_id: 1,
          capacity: 50,
          status: 'active',
          created_at: new Date()
        },
        {
          id: 2,
          plate_number: 'DEF456',
          route_id: 2,
          capacity: 40,
          status: 'active',
          created_at: new Date()
        }
      ];

      const { query } = require('../config/postgresql');
      query.mockResolvedValueOnce({
        rows: mockBuses
      });

      const response = await request(app)
        .get('/api/buses')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
    });
  });

  describe('POST /api/buses', () => {
    const validBusData = {
      plate_number: 'XYZ789',
      route_id: 1,
      capacity: 45,
      status: 'active'
    };

    it('should create a bus with valid data and authentication', async () => {
      // Mock authentication middleware
      jest.mock('../middleware/auth.middleware', () => ({
        authMiddleware: (req, res, next) => {
          req.user = { id: 1, role: 'admin' };
          next();
        },
        requireRole: (roles) => (req, res, next) => next()
      }));

      const mockCreatedBus = {
        id: 3,
        ...validBusData,
        created_at: new Date()
      };

      const { query } = require('../config/postgresql');
      query.mockResolvedValueOnce({
        rows: [mockCreatedBus]
      });

      // Create a valid token for testing
      const token = 'valid.jwt.token';

      const response = await request(app)
        .post('/api/buses')
        .set('Authorization', `Bearer ${token}`)
        .send(validBusData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.plate_number).toBe(validBusData.plate_number);
    });

    it('should return 400 with invalid data', async () => {
      const invalidBusData = {
        plate_number: '', // Invalid: empty plate number
        route_id: 'invalid', // Invalid: not a number
        capacity: -10 // Invalid: negative capacity
      };

      const response = await request(app)
        .post('/api/buses')
        .send(invalidBusData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/buses')
        .send(validBusData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/buses/:id', () => {
    it('should get a specific bus by ID', async () => {
      const mockBus = {
        id: 1,
        plate_number: 'ABC123',
        route_id: 1,
        capacity: 50,
        status: 'active',
        created_at: new Date()
      };

      const { query } = require('../config/postgresql');
      query.mockResolvedValueOnce({
        rows: [mockBus]
      });

      const response = await request(app)
        .get('/api/buses/1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.id).toBe(1);
      expect(response.body.data.plate_number).toBe('ABC123');
    });

    it('should return 404 for non-existent bus', async () => {
      const { query } = require('../config/postgresql');
      query.mockResolvedValueOnce({
        rows: []
      });

      const response = await request(app)
        .get('/api/buses/999')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});
