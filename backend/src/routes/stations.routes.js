const express = require('express');
const stationsController = require('../controllers/stations.controller');
const { authMiddleware, requireRole } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Public routes
router.get('/', asyncHandler(stationsController.getAllStations));
router.get('/nearby', asyncHandler(stationsController.getNearbyStations));
router.get('/:id', asyncHandler(stationsController.getStationById));
router.get('/:id/arrivals', asyncHandler(stationsController.getStationArrivals));

// Protected routes
router.post('/', 
  authMiddleware, 
  requireRole(['admin', 'operator']), 
  asyncHandler(stationsController.createStation)
);

router.put('/:id', 
  authMiddleware, 
  requireRole(['admin', 'operator']), 
  asyncHandler(stationsController.updateStation)
);

router.delete('/:id', 
  authMiddleware, 
  requireRole(['admin']), 
  asyncHandler(stationsController.deleteStation)
);

module.exports = router;
