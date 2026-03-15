const express = require('express');
const tripsController = require('../controllers/trips.controller');
const { authMiddleware, requireRole } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Public routes
router.get('/', asyncHandler(tripsController.getAllTrips));
router.get('/:id', asyncHandler(tripsController.getTripById));
router.get('/:id/delays', asyncHandler(tripsController.getTripDelays));
router.get('/route/:routeId', asyncHandler(tripsController.getTripsByRoute));

// Protected routes
router.post('/', 
  authMiddleware, 
  requireRole(['admin', 'operator']), 
  asyncHandler(tripsController.createTrip)
);

router.post('/:id/start', 
  authMiddleware, 
  requireRole(['operator', 'driver']), 
  asyncHandler(tripsController.startTrip)
);

router.post('/:id/end', 
  authMiddleware, 
  requireRole(['operator', 'driver']), 
  asyncHandler(tripsController.endTrip)
);

module.exports = router;
