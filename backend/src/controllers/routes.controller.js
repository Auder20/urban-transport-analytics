const pool = require('../config/database');
const cacheService = require('../services/cache.service');
const { z } = require('zod');

const createRouteSchema = z.object({
  routeCode: z.string().min(1, 'Route code is required'),
  name: z.string().min(1, 'Route name is required'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').default('#1A56A0'),
  distanceKm: z.number().min(0).optional()
});

const updateRouteSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').optional(),
  status: z.enum(['active', 'suspended', 'maintenance']).optional(),
  distanceKm: z.number().min(0).optional()
});

class RoutesController {
  async getAllRoutes(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      const status = req.query.status;

      let whereClause = '';
      let queryParams = [limit, offset];
      let paramIndex = 3;

      if (status) {
        whereClause = 'WHERE r.status = $1 ';
        queryParams = [status, limit, offset];
        paramIndex = 3;
      }

      const query = `
        SELECT 
          r.id, r.route_code, r.name, r.description, r.color, 
          r.status, r.total_stops, r.distance_km, r.created_at, r.updated_at,
          COUNT(b.id) as active_buses
        FROM routes r
        LEFT JOIN buses b ON r.id = b.current_route_id AND b.status = 'active'
        ${whereClause}
        GROUP BY r.id, r.route_code, r.name, r.description, r.color, 
                 r.status, r.total_stops, r.distance_km, r.created_at, r.updated_at
        ORDER BY r.route_code
        LIMIT $${paramIndex - 2} OFFSET $${paramIndex - 1}
      `;

      const countQuery = `
        SELECT COUNT(*) 
        FROM routes r 
        ${whereClause.replace('LIMIT $1 OFFSET $2', '')}
      `;

      const [routesResult, countResult] = await Promise.all([
        pool.query(query, queryParams),
        pool.query(countQuery, queryParams.slice(0, -2))
      ]);

      const routes = routesResult.rows.map(route => ({
        id: route.id,
        routeCode: route.route_code,
        name: route.name,
        description: route.description,
        color: route.color,
        status: route.status,
        totalStops: route.total_stops,
        distanceKm: route.distance_km ? parseFloat(route.distance_km) : null,
        activeBuses: parseInt(route.active_buses),
        createdAt: route.created_at,
        updatedAt: route.updated_at
      }));

      res.json({
        routes,
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / limit)
        }
      });
    } catch (error) {
      throw error;
    }
  }

  async getRouteById(req, res) {
    try {
      const { id } = req.params;

      const routeQuery = `
        SELECT 
          id, route_code, name, description, color, status, 
          total_stops, distance_km, created_at, updated_at
        FROM routes
        WHERE id = $1
      `;

      const routeResult = await pool.query(routeQuery, [id]);

      if (routeResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Route not found',
          code: 'ROUTE_NOT_FOUND'
        });
      }

      const route = routeResult.rows[0];

      // Get stations for this route
      const stationsQuery = `
        SELECT 
          s.id, s.station_code, s.name, s.address, s.lat, s.lng,
          s.type, s.amenities, s.is_active,
          rs.stop_order, rs.distance_from_start_km, rs.avg_travel_time_min
        FROM stations s
        JOIN route_stations rs ON s.id = rs.station_id
        WHERE rs.route_id = $1 AND s.is_active = true
        ORDER BY rs.stop_order
      `;

      const stationsResult = await pool.query(stationsQuery, [id]);

      // Get active buses for this route
      const busesQuery = `
        SELECT id, plate_number, capacity, last_lat, last_lng, last_seen_at
        FROM buses
        WHERE current_route_id = $1 AND status = 'active'
      `;

      const busesResult = await pool.query(busesQuery, [id]);

      const stations = stationsResult.rows.map(station => ({
        id: station.id,
        stationCode: station.station_code,
        name: station.name,
        address: station.address,
        location: {
          lat: parseFloat(station.lat),
          lng: parseFloat(station.lng)
        },
        type: station.type,
        amenities: station.amenities,
        isActive: station.is_active,
        stopOrder: station.stop_order,
        distanceFromStartKm: station.distance_from_start_km ? parseFloat(station.distance_from_start_km) : null,
        avgTravelTimeMin: station.avg_travel_time_min
      }));

      const buses = busesResult.rows.map(bus => ({
        id: bus.id,
        plateNumber: bus.plate_number,
        capacity: bus.capacity,
        lastLocation: bus.last_lat && bus.last_lng ? {
          lat: parseFloat(bus.last_lat),
          lng: parseFloat(bus.last_lng)
        } : null,
        lastSeenAt: bus.last_seen_at
      }));

      res.json({
        id: route.id,
        routeCode: route.route_code,
        name: route.name,
        description: route.description,
        color: route.color,
        status: route.status,
        totalStops: route.total_stops,
        distanceKm: route.distance_km ? parseFloat(route.distance_km) : null,
        createdAt: route.created_at,
        updatedAt: route.updated_at,
        stations,
        buses
      });
    } catch (error) {
      throw error;
    }
  }

  async createRoute(req, res) {
    try {
      const { routeCode, name, description, color, distanceKm } = createRouteSchema.parse(req.body);

      const query = `
        INSERT INTO routes (route_code, name, description, color, distance_km)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, route_code, name, description, color, status, 
                  total_stops, distance_km, created_at, updated_at
      `;

      const result = await pool.query(query, [routeCode, name, description, color, distanceKm]);
      const route = result.rows[0];

      res.status(201).json({
        id: route.id,
        routeCode: route.route_code,
        name: route.name,
        description: route.description,
        color: route.color,
        status: route.status,
        totalStops: route.total_stops,
        distanceKm: route.distance_km ? parseFloat(route.distance_km) : null,
        createdAt: route.created_at,
        updatedAt: route.updated_at
      });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          error: 'Route with this code already exists',
          code: 'DUPLICATE_ROUTE_CODE'
        });
      }
      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors
        });
      }
      throw error;
    }
  }

  async updateRoute(req, res) {
    try {
      const { id } = req.params;
      const updates = updateRouteSchema.parse(req.body);

      // Build dynamic update query
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          updateFields.push(`${dbField} = $${paramIndex}`);
          updateValues.push(value);
          paramIndex++;
        }
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          error: 'No valid fields to update',
          code: 'NO_UPDATE_FIELDS'
        });
      }

      updateFields.push(`updated_at = NOW()`);
      updateValues.push(id);

      const query = `
        UPDATE routes 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, route_code, name, description, color, status, 
                  total_stops, distance_km, updated_at
      `;

      const result = await pool.query(query, updateValues);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Route not found',
          code: 'ROUTE_NOT_FOUND'
        });
      }

      const route = result.rows[0];

      // Invalidate cache
      await cacheService.invalidatePattern(`route:*`);

      res.json({
        id: route.id,
        routeCode: route.route_code,
        name: route.name,
        description: route.description,
        color: route.color,
        status: route.status,
        totalStops: route.total_stops,
        distanceKm: route.distance_km ? parseFloat(route.distance_km) : null,
        updatedAt: route.updated_at
      });
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors
        });
      }
      throw error;
    }
  }

  async deleteRoute(req, res) {
    try {
      const { id } = req.params;

      // Check if route exists
      const checkQuery = 'SELECT id FROM routes WHERE id = $1';
      const checkResult = await pool.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Route not found',
          code: 'ROUTE_NOT_FOUND'
        });
      }

      // Soft delete by setting status to suspended
      const updateQuery = `
        UPDATE routes 
        SET status = 'suspended', updated_at = NOW()
        WHERE id = $1
      `;

      await pool.query(updateQuery, [id]);

      // Invalidate cache
      await cacheService.invalidatePattern(`route:*`);

      res.json({
        message: 'Route suspended successfully'
      });
    } catch (error) {
      throw error;
    }
  }

  async getRouteStations(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          s.id, s.station_code, s.name, s.address, s.lat, s.lng,
          s.type, s.amenities, s.is_active,
          rs.stop_order, rs.distance_from_start_km, rs.avg_travel_time_min
        FROM stations s
        JOIN route_stations rs ON s.id = rs.station_id
        WHERE rs.route_id = $1 AND s.is_active = true
        ORDER BY rs.stop_order
      `;

      const result = await pool.query(query, [id]);

      const stations = result.rows.map(station => ({
        id: station.id,
        stationCode: station.station_code,
        name: station.name,
        address: station.address,
        location: {
          lat: parseFloat(station.lat),
          lng: parseFloat(station.lng)
        },
        type: station.type,
        amenities: station.amenities,
        isActive: station.is_active,
        stopOrder: station.stop_order,
        distanceFromStartKm: station.distance_from_start_km ? parseFloat(station.distance_from_start_km) : null,
        avgTravelTimeMin: station.avg_travel_time_min
      }));

      res.json({
        routeId: id,
        stations
      });
    } catch (error) {
      throw error;
    }
  }

  async getRouteBuses(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          b.id, b.plate_number, b.model, b.capacity, b.status,
          b.last_lat, b.last_lng, b.last_seen_at
        FROM buses b
        WHERE b.current_route_id = $1 AND b.status = 'active'
        ORDER BY b.plate_number
      `;

      const result = await pool.query(query, [id]);

      const buses = result.rows.map(bus => ({
        id: bus.id,
        plateNumber: bus.plate_number,
        model: bus.model,
        capacity: bus.capacity,
        status: bus.status,
        lastLocation: bus.last_lat && bus.last_lng ? {
          lat: parseFloat(bus.last_lat),
          lng: parseFloat(bus.last_lng)
        } : null,
        lastSeenAt: bus.last_seen_at
      }));

      res.json({
        routeId: id,
        buses
      });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new RoutesController();
