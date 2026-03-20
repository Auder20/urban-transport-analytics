const express = require('express');
const schedulesController = require('../controllers/schedules.controller');
const { authMiddleware, requireRole } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Public routes (read-only)
router.get('/', asyncHandler(schedulesController.getAllSchedules));
router.get('/:id', asyncHandler(schedulesController.getScheduleById));
router.get('/route/:routeId', asyncHandler(schedulesController.getRouteSchedules));

// Protected routes
router.post('/', 
  authMiddleware, 
  requireRole(['admin', 'operator']), 
  asyncHandler(schedulesController.createSchedule)
);

router.put('/:id', 
  authMiddleware, 
  requireRole(['admin', 'operator']), 
  asyncHandler(schedulesController.updateSchedule)
);

router.delete('/:id', 
  authMiddleware, 
  requireRole(['admin']), 
  asyncHandler(schedulesController.deleteSchedule)
);

router.post('/:id/activate', 
  authMiddleware, 
  requireRole(['admin', 'operator']), 
  asyncHandler(schedulesController.activateSchedule)
);

router.post('/:id/deactivate', 
  authMiddleware, 
  requireRole(['admin', 'operator']), 
  asyncHandler(schedulesController.deactivateSchedule)
);

module.exports = router;
