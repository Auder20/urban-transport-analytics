const express = require('express');
const authController = require('../controllers/auth.controller');
const { authLimiter } = require('../middleware/rateLimit.middleware');
const { authMiddleware } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Public routes
router.post('/login', authLimiter, asyncHandler(authController.login));
router.post('/refresh', authLimiter, asyncHandler(authController.refreshToken));

// Protected routes
router.post('/logout', authMiddleware, asyncHandler(authController.logout));
router.get('/me', authMiddleware, asyncHandler(authController.getProfile));
router.put('/profile', authMiddleware, asyncHandler(authController.updateProfile));
router.put('/password', authMiddleware, asyncHandler(authController.updatePassword));
router.get('/export-data', authMiddleware, asyncHandler(authController.exportData));

// Admin route for user registration
router.post('/register', authLimiter, asyncHandler(authController.register));

module.exports = router;
