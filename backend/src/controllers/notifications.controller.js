const pool = require('../config/database');

class NotificationsController {
  async getUserNotifications(req, res) {
    try {
      const userId = req.user.userId;
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;

      // Get total count of notifications for this user
      const countQuery = `SELECT COUNT(*) as total FROM notifications WHERE user_id = $1`;
      const countResult = await pool.query(countQuery, [userId]);

      const query = `
        SELECT 
          id,
          title,
          message,
          type,
          is_read,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM notifications 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `;
      
      const result = await pool.query(query, [userId, limit, offset]);
      
      // Get unread count
      const unreadQuery = `
        SELECT COUNT(*) as unread_count
        FROM notifications 
        WHERE user_id = $1 AND is_read = false
      `;
      const unreadResult = await pool.query(unreadQuery, [userId]);

      const totalNotifications = parseInt(countResult.rows[0].total);

      res.json({
        notifications: result.rows,
        unreadCount: parseInt(unreadResult.rows[0].unread_count),
        pagination: {
          limit,
          offset,
          total: totalNotifications,
          hasMore: offset + result.rows.length < totalNotifications
        }
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        error: 'Failed to fetch notifications',
        code: 'FETCH_NOTIFICATIONS_ERROR'
      });
    }
  }

  async markAsRead(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      const query = `
        UPDATE notifications 
        SET is_read = true, updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING id, is_read, updated_at as "updatedAt"
      `;
      
      const result = await pool.query(query, [id, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Notification not found',
          code: 'NOTIFICATION_NOT_FOUND'
        });
      }

      res.json({
        message: 'Notification marked as read',
        notification: result.rows[0]
      });
    } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({
        error: 'Failed to mark notification as read',
        code: 'MARK_READ_ERROR'
      });
    }
  }

  async markAllAsRead(req, res) {
    try {
      const userId = req.user.userId;

      const query = `
        UPDATE notifications 
        SET is_read = true, updated_at = NOW()
        WHERE user_id = $1 AND is_read = false
        RETURNING id
      `;
      
      const result = await pool.query(query, [userId]);

      res.json({
        message: 'All notifications marked as read',
        markedCount: result.rows.length
      });
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      res.status(500).json({
        error: 'Failed to mark all notifications as read',
        code: 'MARK_ALL_READ_ERROR'
      });
    }
  }

  async deleteNotification(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      const query = `
        DELETE FROM notifications 
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `;
      
      const result = await pool.query(query, [id, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Notification not found',
          code: 'NOTIFICATION_NOT_FOUND'
        });
      }

      res.json({
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({
        error: 'Failed to delete notification',
        code: 'DELETE_NOTIFICATION_ERROR'
      });
    }
  }

  async createNotification(req, res) {
    try {
      const userId = req.user.userId;
      const { title, message, type } = req.body;

      if (!title || !message || !type) {
        return res.status(400).json({
          error: 'Title, message, and type are required',
          code: 'MISSING_FIELDS'
        });
      }

      const query = `
        INSERT INTO notifications (user_id, title, message, type, is_read, created_at, updated_at)
        VALUES ($1, $2, $3, $4, false, NOW(), NOW())
        RETURNING id, title, message, type, is_read, created_at as "createdAt", updated_at as "updatedAt"
      `;

      const result = await pool.query(query, [userId, title, message, type]);
      const notification = result.rows[0];

      // Emit real-time notification to user's socket room
      req.app.get('io')?.to(`user:${userId}`).emit('notification:new', {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        is_read: notification.is_read,
        created_at: notification.createdAt,
        updated_at: notification.updatedAt
      });

      res.status(201).json({
        message: 'Notification created successfully',
        notification: {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          is_read: notification.is_read,
          createdAt: notification.createdAt,
          updatedAt: notification.updatedAt
        }
      });
    } catch (error) {
      console.error('Create notification error:', error);
      res.status(500).json({
        error: 'Failed to create notification',
        code: 'CREATE_NOTIFICATION_ERROR'
      });
    }
  }
}

module.exports = new NotificationsController();
