const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const authRouter = require('../../../server/routes/auth');

// Mock the database models
const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  password: '$2b$10$hashedPassword',
  firstName: 'Test',
  lastName: 'User',
  role: 'technician',
  department: 'body_shop',
  shopId: 1,
  isActive: true,
  lastLoginAt: null,
  update: jest.fn(),
};

const mockUserModel = {
  findOne: jest.fn(),
  findByPk: jest.fn(),
  update: jest.fn(),
};

// Mock the entire models module
jest.mock('../../../server/database/models', () => ({
  User: mockUserModel,
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

// Mock middleware
jest.mock('../../../server/middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    // Mock successful authentication
    req.userId = 1;
    next();
  },
}));

describe('Auth API Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);

    // Clear all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockUser.update.mockResolvedValue(mockUser);
    mockUserModel.update.mockResolvedValue([1]);
  });

  describe('POST /api/auth/login', () => {
    test('successfully logs in with valid credentials', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toEqual({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'technician',
        department: 'body_shop',
        shopId: 1,
      });

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        where: {
          $or: [{ username: 'testuser' }, { email: 'testuser' }],
        },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        '$2b$10$hashedPassword'
      );
      expect(mockUser.update).toHaveBeenCalledWith({
        lastLoginAt: expect.any(Date),
      });
    });

    test('successfully logs in with email instead of username', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        where: {
          $or: [
            { username: 'test@example.com' },
            { email: 'test@example.com' },
          ],
        },
      });
    });

    test('returns 400 when username is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123',
        })
        .expect(400);

      expect(response.body.error).toBe('Username and password are required');
      expect(mockUserModel.findOne).not.toHaveBeenCalled();
    });

    test('returns 400 when password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
        })
        .expect(400);

      expect(response.body.error).toBe('Username and password are required');
      expect(mockUserModel.findOne).not.toHaveBeenCalled();
    });

    test('returns 400 when both username and password are missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Username and password are required');
      expect(mockUserModel.findOne).not.toHaveBeenCalled();
    });

    test('returns 401 when user is not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    test('returns 401 when user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockUserModel.findOne.mockResolvedValue(inactiveUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.error).toBe('Account is disabled');
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    test('returns 401 when password is invalid', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrongpassword',
        '$2b$10$hashedPassword'
      );
    });

    test('generates valid JWT token', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(200);

      const token = response.body.token;
      expect(token).toBeDefined();

      // Verify JWT token structure
      const decoded = jwt.decode(token);
      expect(decoded.userId).toBe(1);
      expect(decoded.role).toBe('technician');
      expect(decoded.shopId).toBe(1);
      expect(decoded.exp).toBeDefined();
    });

    test('handles database errors gracefully', async () => {
      mockUserModel.findOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    test('handles bcrypt errors gracefully', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockRejectedValue(new Error('Bcrypt error'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    test('handles user.update errors gracefully', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      mockUser.update.mockRejectedValue(new Error('Update error'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('GET /api/auth/me', () => {
    test('returns current user data when authenticated', async () => {
      const userWithoutPassword = { ...mockUser };
      delete userWithoutPassword.password;
      mockUserModel.findByPk.mockResolvedValue(userWithoutPassword);

      const response = await request(app).get('/api/auth/me').expect(200);

      expect(response.body.user).toEqual(userWithoutPassword);
      expect(mockUserModel.findByPk).toHaveBeenCalledWith(1, {
        attributes: { exclude: ['password'] },
      });
    });

    test('returns 404 when user is not found', async () => {
      mockUserModel.findByPk.mockResolvedValue(null);

      const response = await request(app).get('/api/auth/me').expect(404);

      expect(response.body.error).toBe('User not found');
    });

    test('handles database errors gracefully', async () => {
      mockUserModel.findByPk.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/auth/me').expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    test('excludes password from response', async () => {
      mockUserModel.findByPk.mockResolvedValue(mockUser);

      const response = await request(app).get('/api/auth/me').expect(200);

      expect(response.body.user.password).toBeUndefined();
      expect(mockUserModel.findByPk).toHaveBeenCalledWith(1, {
        attributes: { exclude: ['password'] },
      });
    });
  });

  describe('POST /api/auth/logout', () => {
    test('successfully logs out authenticated user', async () => {
      const response = await request(app).post('/api/auth/logout').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
      expect(mockUserModel.update).toHaveBeenCalledWith(
        { lastLogoutAt: expect.any(Date) },
        { where: { id: 1 } }
      );
    });

    test('handles database errors gracefully', async () => {
      mockUserModel.update.mockRejectedValue(new Error('Database error'));

      const response = await request(app).post('/api/auth/logout').expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    test('updates lastLogoutAt timestamp', async () => {
      const beforeLogout = new Date();

      await request(app).post('/api/auth/logout').expect(200);

      const updateCall = mockUserModel.update.mock.calls[0];
      const updateData = updateCall[0];
      const afterLogout = new Date();

      expect(updateData.lastLogoutAt).toBeInstanceOf(Date);
      expect(updateData.lastLogoutAt.getTime()).toBeGreaterThanOrEqual(
        beforeLogout.getTime()
      );
      expect(updateData.lastLogoutAt.getTime()).toBeLessThanOrEqual(
        afterLogout.getTime()
      );
    });
  });

  describe('Request Validation', () => {
    test('handles malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      // Express should handle malformed JSON and return 400
    });

    test('handles empty request body', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send()
        .expect(400);

      expect(response.body.error).toBe('Username and password are required');
    });

    test('handles very long username/password', async () => {
      const longString = 'a'.repeat(10000);

      const response = await request(app).post('/api/auth/login').send({
        username: longString,
        password: longString,
      });

      // Should handle gracefully (either find user or return not found)
      expect([401, 404, 500]).toContain(response.status);
    });

    test('handles special characters in credentials', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'test@domain.com',
          password: 'p@$$w0rd!@#$%',
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('Security', () => {
    test('does not expose sensitive user data', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.user.password).toBeUndefined();
      expect(response.body.user.createdAt).toBeUndefined();
      expect(response.body.user.updatedAt).toBeUndefined();
    });

    test('uses consistent error messages for security', async () => {
      // Test user not found
      mockUserModel.findOne.mockResolvedValue(null);
      let response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nonexistent', password: 'password' })
        .expect(401);
      expect(response.body.error).toBe('Invalid credentials');

      // Test wrong password
      mockUserModel.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);
      response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'wrong' })
        .expect(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    test('JWT token has reasonable expiration', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(200);

      const decoded = jwt.decode(response.body.token);
      const now = Math.floor(Date.now() / 1000);
      const expirationTime = decoded.exp - now;

      // Should expire in reasonable time (24 hours = 86400 seconds)
      expect(expirationTime).toBeLessThanOrEqual(86400);
      expect(expirationTime).toBeGreaterThan(0);
    });

    test('rate limiting considerations - multiple failed attempts', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      // Multiple failed attempts should still return consistent errors
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username: 'testuser',
            password: 'wrongpassword',
          })
          .expect(401);

        expect(response.body.error).toBe('Invalid credentials');
      }
    });
  });

  describe('Environment Variables', () => {
    test('uses default JWT secret when environment variable is not set', async () => {
      const originalEnv = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      mockUserModel.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.token).toBeDefined();

      // Restore environment variable
      process.env.JWT_SECRET = originalEnv;
    });

    test('uses default expiration when environment variable is not set', async () => {
      const originalEnv = process.env.JWT_EXPIRES_IN;
      delete process.env.JWT_EXPIRES_IN;

      mockUserModel.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(200);

      const decoded = jwt.decode(response.body.token);
      expect(decoded.exp).toBeDefined();

      // Restore environment variable
      process.env.JWT_EXPIRES_IN = originalEnv;
    });
  });
});
