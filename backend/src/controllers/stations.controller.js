const pool = require('../config/database');
const cacheService = require('../services/cache.service');
const { z } = require('zod');

const createStationSchema = z.object({
  stationCode: z.string().min(1, 'Station code is required'),
  name: z.string().min(1, 'Station name is required'),
  address: z.string().optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  type: z.enum(['stop', 'terminal', 'hub']).default('stop'),
  amenities: z.object({}).optional()
});

class StationsController {
  async getAllStations(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      const type = req.query.type;
      const active = req.query.active;

      let whereClause = 'WHERE s.is_active = true';
      let queryParams = [limit, offset];
      let paramIndex = 3;

      if (type) {
        whereClause += ` AND s.type = $1`;
        queryParams = [type, limit, offset];
        paramIndex = 3;
      }

      if (active !== undefined) {
        const activeIndex = type ? 2 : 1;
        whereClause += ` AND s.is_active = $${activeIndex}`;
        queryParams.splice(activeIndex - 1, 0, active === 'true');
        paramIndex++;
      }

      const query = `
        SELECT 
          s.id, s.station_code, s.name, s.address, s.lat, s.lng,
          s.type, s.amenities, s.is_active, s.created_at
        FROM stations s
        ${whereClause}
        ORDER BY s.station_code
        LIMIT $${paramIndex - 2} OFFSET $${paramIndex - 1}
      `;

      const countQuery = `
        SELECT COUNT(*) 
        FROM stations s 
        ${whereClause.replace('LIMIT $1 OFFSET $2', '')}
      `;

      const [stationsResult, countResult] = await Promise.all([
        pool.query(query, queryParams),
        pool.query(countQuery, queryParams.slice(0, -2))
      ]);

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
        createdAt: station.created_at
      }));

      res.json({
        stations,
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

  async getStationById(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          s.id, s.station_code, s.name, s.address, s.lat, s.lng,
          s.type, s.amenities, s.is_active, s.created_at
        FROM stations s
        WHERE s.id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Station not found',
          code: 'STATION_NOT_FOUND'
        });
      }

      const station = result.rows[0];

      res.json({
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
        createdAt: station.created_at
      });
    } catch (error) {
      throw error;
    }
  }

  async getNearbyStations(req, res) {
    try {
      const lat = parseFloat(req.query.lat);
      const lng = parseFloat(req.query.lng);
      const radius = parseInt(req.query.radius) || 500; // Default 500 meters

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({
          error: 'Latitude and longitude are required',
          code: 'MISSING_COORDINATES'
        });
      }

      const query = `
        SELECT 
          s.id, s.station_code, s.name, s.address, s.lat, s.lng,
          s.type, s.amenities, s.is_active, s.created_at,
          ST_Distance(s.location, ST_MakePoint($1, $2)::geography) as distance_meters
        FROM stations s
        WHERE s.is_active = true
          AND ST_DWithin(s.location, ST_MakePoint($1, $2)::geography, $3)
        ORDER BY distance_meters
        LIMIT 50
      `;

      const result = await pool.query(query, [lng, lat, radius]);

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
        createdAt: station.created_at,
        distanceMeters: Math.round(parseFloat(station.distance_meters))
      }));

      res.json({
        center: { lat, lng },
        radius,
        stations
      });
    } catch (error) {
      throw error;
    }
  }

  async createStation(req, res) {
    try {
      const { stationCode, name, address, lat, lng, type, amenities } = createStationSchema.parse(req.body);

      const query = `
        INSERT INTO stations (station_code, name, address, lat, lng, location, type, amenities)
        VALUES ($1, $2, $3, $4, $5, ST_MakePoint($5, $4)::geography, $6, $7)
        RETURNING id, station_code, name, address, lat, lng, type, amenities, is_active, created_at
      `;

      const result = await pool.query(query, [
        stationCode, name, address, lat, lng, type, JSON.stringify(amenities || {})
      ]);

      const station = result.rows[0];

      res.status(201).json({
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
        createdAt: station.created_at
      });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          error: 'Station with this code already exists',
          code: 'DUPLICATE_STATION_CODE'
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

  async updateStation(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Build dynamic update query
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      const allowedFields = ['name', 'address', 'lat', 'lng', 'type', 'amenities', 'is_active'];
      
      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
          if (key === 'lat' || key === 'lng') {
            // For coordinates, we need to update both lat/lng and location
            continue; // Handle separately
          } else if (key === 'amenities') {
            updateFields.push(`${key} = $${paramIndex}`);
            updateValues.push(JSON.stringify(value));
          } else {
            updateFields.push(`${key} = $${paramIndex}`);
            updateValues.push(value);
          }
          paramIndex++;
        }
      }

      // Handle coordinate updates
      if (updates.lat !== undefined && updates.lng !== undefined) {
        updateFields.push(`lat = $${paramIndex}`);
        updateValues.push(updates.lat);
        paramIndex++;
        updateFields.push(`lng = $${paramIndex}`);
        updateValues.push(updates.lng);
        paramIndex++;
        updateFields.push(`location = ST_MakePoint($${paramIndex}, $${paramIndex - 1})::geography`);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          error: 'No valid fields to update',
          code: 'NO_UPDATE_FIELDS'
        });
      }

      updateValues.push(id);

      const query = `
        UPDATE stations 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, station_code, name, address, lat, lng, type, amenities, is_active
      `;

      const result = await pool.query(query, updateValues);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Station not found',
          code: 'STATION_NOT_FOUND'
        });
      }

      const station = result.rows[0];

      res.json({
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
        isActive: station.is_active
      });
    } catch (error) {
      throw error;
    }
  }

  async deleteStation(req, res) {
    try {
      const { id } = req.params;

      // Check if station exists
      const checkQuery = 'SELECT id FROM stations WHERE id = $1';
      const checkResult = await pool.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Station not found',
          code: 'STATION_NOT_FOUND'
        });
      }

      // Soft delete by setting is_active to false
      const updateQuery = `
        UPDATE stations 
        SET is_active = false
        WHERE id = $1
      `;

      await pool.query(updateQuery, [id]);

      res.json({
        message: 'Station deactivated successfully'
      });
    } catch (error) {
      throw error;
    }
  }

  async getStationArrivals(req, res) {
    try {
      const { id } = req.params;

      // This is a simplified implementation
      // In a real system, you would calculate ETA based on current bus locations and schedules
      
      const query = `
        SELECT 
          b.id, b.plate_number, b.last_lat, b.last_lng, b.last_seen_at,
          r.id as route_id, r.route_code, r.name as route_name, r.color as route_color,
          rs.stop_order, rs.avg_travel_time_min
        FROM buses b
        JOIN routes r ON b.current_route_id = r.id
        JOIN route_stations rs ON r.id = rs.route_id
        WHERE rs.station_id = $1 
          AND b.status = 'active'
          AND b.last_seen_at > NOW() - INTERVAL '10 minutes'
        ORDER BY rs.stop_order
      `;

      const result = await pool.query(query, [id]);

      const arrivals = result.rows.map(bus => ({
        busId: bus.id,
        plateNumber: bus.plate_number,
        route: {
          id: bus.route_id,
          code: bus.route_code,
          name: bus.route_name,
          color: bus.route_color
        },
        currentLocation: bus.last_lat && bus.last_lng ? {
          lat: parseFloat(bus.last_lat),
          lng: parseFloat(bus.last_lng)
        } : null,
        stopOrder: bus.stop_order,
        avgTravelTimeMin: bus.avg_travel_time_min,
        estimatedArrival: bus.avg_travel_time_min ? 
          new Date(Date.now() + bus.avg_travel_time_min * 60000).toISOString() : null,
        lastSeenAt: bus.last_seen_at
      }));

      res.json({
        stationId: id,
        arrivals
      });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new StationsController();
