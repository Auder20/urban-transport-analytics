const express = require('express');
const busesController = require('../controllers/buses.controller');
const { authMiddleware, requireRole } = require('../middleware/auth.middleware');
const { gpsLimiter } = require('../middleware/rateLimit.middleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Public routes (with optional auth for better data)
router.get('/', asyncHandler(busesController.getAllBuses));
router.get('/live', asyncHandler(busesController.getLiveBuses));
router.get('/:id', asyncHandler(busesController.getBusById));
router.get('/:id/track', asyncHandler(busesController.getBusTrack));
router.get('/:id/trips', asyncHandler(busesController.getBusTrips));

// Protected routes
router.post('/', 
  authMiddleware, 
  requireRole(['admin', 'operator']), 
  asyncHandler(busesController.createBus)
);

router.put('/:id', 
  authMiddleware, 
  requireRole(['admin', 'operator']), 
  asyncHandler(busesController.updateBus)
);

// GPS location update (internal/system endpoint)
router.post('/:id/location', 
  gpsLimiter, 
  asyncHandler(busesController.updateBusLocation)
);

module.exports = router;
