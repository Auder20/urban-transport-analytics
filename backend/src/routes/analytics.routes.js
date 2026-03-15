const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const { authMiddleware, requireRole } = require('../middleware/auth.middleware');
const { analyticsLimiter } = require('../middleware/rateLimit.middleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Public routes (with rate limiting)
router.get('/kpis', analyticsLimiter, asyncHandler(analyticsController.getKPIS));
router.get('/delays', analyticsLimiter, asyncHandler(analyticsController.getDelays));
router.get('/heatmap', analyticsLimiter, asyncHandler(analyticsController.getHeatmap));
router.get('/routes/problematic', analyticsLimiter, asyncHandler(analyticsController.getProblematicRoutes));
router.get('/peak-hours', analyticsLimiter, asyncHandler(analyticsController.getPeakHours));
router.get('/route/:routeId/predictions', analyticsLimiter, asyncHandler(analyticsController.getRoutePredictions));
router.get('/anomalies', analyticsLimiter, asyncHandler(analyticsController.getAnomalies));

// Protected routes
router.get('/system/stats', 
  authMiddleware, 
  requireRole(['admin', 'analyst']), 
  asyncHandler(analyticsController.getSystemStats)
);

router.post('/retrain-model', 
  authMiddleware, 
  requireRole(['admin']), 
  asyncHandler(analyticsController.retrainModel)
);

module.exports = router;
