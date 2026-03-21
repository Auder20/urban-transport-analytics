const express = require('express');
const pool = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Global search across buses, routes, and stations
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 buses:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       status:
 *                         type: string
 *                 routes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 *                 stations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       code:
 *                         type: string
 *                       name:
 *                         type: string
 */
router.get('/', asyncHandler(async (req, res) => {
  const { q } = req.query;
  
  if (!q || q.length < 2) {
    return res.json({ buses: [], routes: [], stations: [] });
  }

  const search = `%${q}%`;
  
  const [buses, routes, stations] = await Promise.all([
    pool.query(
      'SELECT id, plate_number as name, status FROM buses WHERE plate_number ILIKE $1 LIMIT 5', 
      [search]
    ),
    pool.query(
      'SELECT id, route_code as code, name FROM routes WHERE name ILIKE $1 OR route_code ILIKE $1 LIMIT 5', 
      [search]
    ),
    pool.query(
      'SELECT id, station_code as code, name FROM stations WHERE name ILIKE $1 LIMIT 5', 
      [search]
    )
  ]);

  res.json({
    buses: buses.rows,
    routes: routes.rows,
    stations: stations.rows
  });
}));

module.exports = router;
