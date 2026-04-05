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

const updateProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  bio: z.string().optional()
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters')
});

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const query = `
        SELECT id, email, password_hash, full_name, role, is_active, last_login, created_at, 
               password_changed_at, is_default_password
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
          fullName: user.full_name,
          requiresPasswordChange: user.is_default_password || false
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
      }, 7 * 24 * 60 * 60); // 7 days — matches refresh token lifetime

      // Update last login
      await pool.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [userId]
      );

      // Log user activity
      await pool.query(
        'INSERT INTO user_activity_logs (user_id, ip_address, user_agent) VALUES ($1, $2, $3)',
        [userId, req.ip, req.get('User-Agent')]
      );

      // Set refresh token as HttpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        accessToken,
        user: {
          id: userId,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          lastLogin: user.last_login,
          requiresPasswordChange: user.is_default_password || false
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

      // Clear HttpOnly refresh token cookie
      res.clearCookie('refreshToken');

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
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

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

      // Generate new refresh token
      const newRefreshToken = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Update session in Redis with sliding window (extend session on refresh)
      await cacheService.set(sessionKey, {
        userId,
        email: user.email,
        role: user.role,
        loginTime: session.loginTime, // Preserve original login time
        refreshedAt: new Date().toISOString() // Track when session was last refreshed
      }, 7 * 24 * 60 * 60); // 7 days

      // TODO: Future enhancement - Implement individual refresh token revocation
      // Add JTI (JWT ID) to refresh token payload for granular revocation:
      // const jti = uuidv4();
      // const refreshToken = jwt.sign({ userId, jti }, process.env.JWT_SECRET, { expiresIn: '7d' });
      // Store JTI in Redis with TTL: await cacheService.set(`jti:${jti}`, userId, 7 * 24 * 60 * 60);
      // This would allow revoking specific refresh tokens while keeping others valid

      // Set new refresh token as HttpOnly cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

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
      const { email, password, fullName } = registerSchema.parse(req.body);

      // Force role to 'viewer' for self-registration (ignore any role from request body)
      const role = 'viewer';

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

  async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      const updates = updateProfileSchema.parse(req.body);

      // Build dynamic update query
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (updates.fullName !== undefined) {
        updateFields.push(`full_name = $${paramIndex++}`);
        updateValues.push(updates.fullName);
      }
      if (updates.email !== undefined) {
        updateFields.push(`email = $${paramIndex++}`);
        updateValues.push(updates.email);
      }
      if (updates.phone !== undefined) {
        updateFields.push(`phone = $${paramIndex++}`);
        updateValues.push(updates.phone);
      }
      if (updates.bio !== undefined) {
        updateFields.push(`bio = $${paramIndex++}`);
        updateValues.push(updates.bio);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          error: 'No valid fields to update',
          code: 'NO_FIELDS_TO_UPDATE'
        });
      }

      updateFields.push(`updated_at = NOW()`);
      updateValues.push(userId);

      const query = `
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, email, full_name, role, phone, bio, updated_at
      `;

      const result = await pool.query(query, updateValues);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const user = result.rows[0];

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          phone: user.phone,
          bio: user.bio,
          updatedAt: user.updated_at
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

  async updatePassword(req, res) {
    try {
      const userId = req.user.userId;
      const { currentPassword, newPassword } = updatePasswordSchema.parse(req.body);

      // Get current password hash
      const query = 'SELECT password_hash FROM users WHERE id = $1';
      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const user = result.rows[0];
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Current password is incorrect',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update password and clear default password flag
      await pool.query(
        'UPDATE users SET password_hash = $1, password_changed_at = NOW(), is_default_password = FALSE WHERE id = $2',
        [newPasswordHash, userId]
      );

      res.json({
        message: 'Password updated successfully'
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

  async exportData(req, res) {
    try {
      const userId = req.user.userId;

      // Get user data
      const userQuery = `
        SELECT id, email, full_name, role, phone, bio, last_login, created_at, updated_at
        FROM users 
        WHERE id = $1
      `;
      const userResult = await pool.query(userQuery, [userId]);

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const user = userResult.rows[0];

      // Get user sessions/activity logs (placeholder for now)
      const sessionsQuery = `
        SELECT login_time, ip_address, user_agent
        FROM user_activity_logs 
        WHERE user_id = $1 
        ORDER BY login_time DESC 
        LIMIT 100
      `;
      const sessionsResult = await pool.query(sessionsQuery, [userId]);

      const exportData = {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          phone: user.phone,
          bio: user.bio,
          lastLogin: user.last_login,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        },
        activity: sessionsResult.rows.map(session => ({
          loginTime: session.login_time,
          ipAddress: session.ip_address,
          userAgent: session.user_agent
        })),
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      res.json(exportData);
    } catch (error) {
      throw error;
    }
  }

  async deleteAccount(req, res) {
    try {
      const userId = req.user.userId;

      // Start transaction
      await pool.query('BEGIN');

      try {
        // Delete user from database (soft delete by setting is_active = false)
        const updateUserQuery = `
          UPDATE users 
          SET is_active = false, updated_at = NOW()
          WHERE id = $1
        `;
        await pool.query(updateUserQuery, [userId]);

        // Commit transaction
        await pool.query('COMMIT');

        // Delete user sessions from cache (outside transaction)
        const sessionKey = `session:${userId}`;
        await cacheService.delete(sessionKey);

        res.json({
          message: 'Account deleted successfully',
          code: 'ACCOUNT_DELETED'
        });
      } catch (error) {
        // Rollback on error
        await pool.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({
        error: 'Failed to delete account',
        code: 'DELETE_ACCOUNT_ERROR'
      });
    }
  }
}

module.exports = new AuthController();
