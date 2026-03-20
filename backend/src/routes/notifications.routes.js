const express = require('express');
const notificationsController = require('../controllers/notifications.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Protected routes
router.get('/', authMiddleware, asyncHandler(notificationsController.getUserNotifications));
router.put('/:id/read', authMiddleware, asyncHandler(notificationsController.markAsRead));
router.put('/read-all', authMiddleware, asyncHandler(notificationsController.markAllAsRead));
router.delete('/:id', authMiddleware, asyncHandler(notificationsController.deleteNotification));

module.exports = router;
