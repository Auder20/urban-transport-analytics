const express = require('express');
const routesController = require('../controllers/routes.controller');
const { authMiddleware, requireRole } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Public routes
router.get('/', asyncHandler(routesController.getAllRoutes));
router.get('/:id', asyncHandler(routesController.getRouteById));
router.get('/:id/stations', asyncHandler(routesController.getRouteStations));
router.get('/:id/buses', asyncHandler(routesController.getRouteBuses));

// Protected routes
router.post('/', 
  authMiddleware, 
  requireRole(['admin']), 
  asyncHandler(routesController.createRoute)
);

router.put('/:id', 
  authMiddleware, 
  requireRole(['admin']), 
  asyncHandler(routesController.updateRoute)
);

router.delete('/:id', 
  authMiddleware, 
  requireRole(['admin']), 
  asyncHandler(routesController.deleteRoute)
);

module.exports = router;
