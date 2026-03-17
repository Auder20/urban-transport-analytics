const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const cacheService = require('../services/cache.service');
const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(1, 'Full name is required'),
  role: z.enum(['admin', 'operator', 'analyst', 'viewer']).default('viewer')
});

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const query = `
        SELECT id, email, password_hash, full_name, role, is_active, last_login, created_at
        FROM users 
        WHERE email = $1 AND is_active = true
      `;
      const result = await pool.query(query, [email]);

      if (result.rows.length === 0) {
        return res.status(401).json({
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      const user = result.rows[0];
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Generate tokens
      const userId = user.id;
      const accessToken = jwt.sign(
        { 
          userId, 
          email: user.email, 
          role: user.role,
          fullName: user.full_name 
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Store session in Redis
      const sessionKey = `session:${userId}`;
      await cacheService.set(sessionKey, {
        userId,
        email: user.email,
        role: user.role,
        loginTime: new Date().toISOString()
      }, 24 * 60 * 60); // 24 hours

      // Update last login
      await pool.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [userId]
      );

      res.json({
        accessToken,
        refreshToken,
        user: {
          id: userId,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          lastLogin: user.last_login
        }
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors
        });
      }
      throw error;
    }
  }

  async logout(req, res) {
    try {
      const userId = req.user.userId;
      const sessionKey = `session:${userId}`;
      
      // Invalidate session in Redis
      await cacheService.delete(sessionKey);

      res.json({
        message: 'Logged out successfully'
      });
    } catch (error) {
      throw error;
    }
  }

  async getProfile(req, res) {
    try {
      const userId = req.user.userId;

      const query = `
        SELECT id, email, full_name, role, is_active, last_login, created_at
        FROM users 
        WHERE id = $1
      `;
      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const user = result.rows[0];

      res.json({
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        isActive: user.is_active,
        lastLogin: user.last_login,
        createdAt: user.created_at
      });
    } catch (error) {
      throw error;
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          error: 'Refresh token is required',
          code: 'MISSING_REFRESH_TOKEN'
        });
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      const userId = decoded.userId;

      // Check if session is still valid
      const sessionKey = `session:${userId}`;
      const session = await cacheService.get(sessionKey);

      if (!session) {
        return res.status(401).json({
          error: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }

      // Get user details
      const query = `
        SELECT id, email, full_name, role, is_active
        FROM users 
        WHERE id = $1 AND is_active = true
      `;
      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        return res.status(401).json({
          error: 'User not found or inactive',
          code: 'USER_INACTIVE'
        });
      }

      const user = result.rows[0];

      // Generate new access token
      const accessToken = jwt.sign(
        { 
          userId, 
          email: user.email, 
          role: user.role,
          fullName: user.full_name 
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      res.json({
        accessToken,
        user: {
          id: userId,
          email: user.email,
          fullName: user.full_name,
          role: user.role
        }
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }
      throw error;
    }
  }

  async register(req, res) {
    try {
      const { email, password, fullName, role } = registerSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          error: 'User already exists',
          code: 'USER_EXISTS'
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const query = `
        INSERT INTO users (email, password_hash, full_name, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, full_name, role, is_active, created_at
      `;
      const result = await pool.query(query, [email, passwordHash, fullName, role]);

      const user = result.rows[0];

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          isActive: user.is_active,
          createdAt: user.created_at
        }
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors
        });
      }
      throw error;
    }
  }
}

module.exports = new AuthController();
