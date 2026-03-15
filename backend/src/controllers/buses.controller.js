const pool = require('../config/database');
const gpsService = require('../services/gps.service');
const cacheService = require('../services/cache.service');
const { z } = require('zod');

const createBusSchema = z.object({
  plateNumber: z.string().min(1, 'Plate number is required'),
  model: z.string().optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  capacity: z.number().int().min(1).max(200).default(80)
});

const updateLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  speed_kmh: z.number().min(0).max(200).optional(),
  heading: z.number().min(0).max(360).optional(),
  altitude_m: z.number().optional(),
  accuracy_m: z.number().optional(),
  occupancy_pct: z.number().min(0).max(100).optional(),
  engine_status: z.enum(['on', 'off', 'idle']).optional(),
  odometer_km: z.number().optional(),
  route_id: z.string().optional(),
  timestamp: z.string().datetime().optional()
});

class BusesController {
  async getAllBuses(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const query = `
        SELECT 
          b.id, b.plate_number, b.model, b.year, b.capacity,
          b.status, b.last_lat, b.last_lng, b.last_seen_at, b.created_at,
          r.id as route_id, r.route_code, r.name as route_name, r.color as route_color
        FROM buses b
        LEFT JOIN routes r ON b.current_route_id = r.id
        ORDER BY b.plate_number
        LIMIT $1 OFFSET $2
      `;

      const countQuery = 'SELECT COUNT(*) FROM buses';

      const [busesResult, countResult] = await Promise.all([
        pool.query(query, [limit, offset]),
        pool.query(countQuery)
      ]);

      const buses = busesResult.rows.map(bus => ({
        id: bus.id,
        plateNumber: bus.plate_number,
        model: bus.model,
        year: bus.year,
        capacity: bus.capacity,
        status: bus.status,
        lastLocation: bus.last_lat && bus.last_lng ? {
          lat: parseFloat(bus.last_lat),
          lng: parseFloat(bus.last_lng)
        } : null,
        lastSeenAt: bus.last_seen_at,
        createdAt: bus.created_at,
        currentRoute: bus.route_id ? {
          id: bus.route_id,
          code: bus.route_code,
          name: bus.route_name,
          color: bus.route_color
        } : null
      }));

      res.json({
        buses,
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

  async getLiveBuses(req, res) {
    try {
      const { data: liveBuses } = await gpsService.getLiveBuses();
      
      // Enrich with bus details
      const busIds = Object.keys(liveBuses);
      if (busIds.length === 0) {
        return res.json({ buses: [] });
      }

      const query = `
        SELECT 
          b.id, b.plate_number, b.capacity, b.status,
          r.id as route_id, r.route_code, r.name as route_name, r.color as route_color
        FROM buses b
        LEFT JOIN routes r ON b.current_route_id = r.id
        WHERE b.id = ANY($1)
      `;

      const busesResult = await pool.query(query, [busIds]);
      const busDetails = {};
      busesResult.rows.forEach(bus => {
        busDetails[bus.id] = bus;
      });

      const enrichedBuses = Object.entries(liveBuses).map(([busId, location]) => {
        const details = busDetails[busId];
        return {
          id: busId,
          plateNumber: details?.plate_number || 'Unknown',
          capacity: details?.capacity || 80,
          status: details?.status || 'active',
          location: {
            lat: location.lat,
            lng: location.lng,
            speedKmh: location.speed_kmh,
            heading: location.heading,
            occupancyPct: location.occupancy_pct,
            timestamp: location.timestamp
          },
          currentRoute: details?.route_id ? {
            id: details.route_id,
            code: details.route_code,
            name: details.route_name,
            color: details.route_color
          } : null
        };
      });

      res.json({ buses: enrichedBuses });
    } catch (error) {
      throw error;
    }
  }

  async getBusById(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          b.id, b.plate_number, b.model, b.year, b.capacity,
          b.status, b.last_lat, b.last_lng, b.last_seen_at, b.created_at,
          r.id as route_id, r.route_code, r.name as route_name, r.color as route_color
        FROM buses b
        LEFT JOIN routes r ON b.current_route_id = r.id
        WHERE b.id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Bus not found',
          code: 'BUS_NOT_FOUND'
        });
      }

      const bus = result.rows[0];

      res.json({
        id: bus.id,
        plateNumber: bus.plate_number,
        model: bus.model,
        year: bus.year,
        capacity: bus.capacity,
        status: bus.status,
        lastLocation: bus.last_lat && bus.last_lng ? {
          lat: parseFloat(bus.last_lat),
          lng: parseFloat(bus.last_lng)
        } : null,
        lastSeenAt: bus.last_seen_at,
        createdAt: bus.created_at,
        currentRoute: bus.route_id ? {
          id: bus.route_id,
          code: bus.route_code,
          name: bus.route_name,
          color: bus.route_color
        } : null
      });
    } catch (error) {
      throw error;
    }
  }

  async createBus(req, res) {
    try {
      const { plateNumber, model, year, capacity } = createBusSchema.parse(req.body);

      const query = `
        INSERT INTO buses (plate_number, model, year, capacity)
        VALUES ($1, $2, $3, $4)
        RETURNING id, plate_number, model, year, capacity, status, created_at
      `;

      const result = await pool.query(query, [plateNumber, model, year, capacity]);
      const bus = result.rows[0];

      res.status(201).json({
        id: bus.id,
        plateNumber: bus.plate_number,
        model: bus.model,
        year: bus.year,
        capacity: bus.capacity,
        status: bus.status,
        createdAt: bus.created_at
      });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          error: 'Bus with this plate number already exists',
          code: 'DUPLICATE_PLATE'
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

  async updateBus(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Build dynamic update query
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      const allowedFields = ['model', 'year', 'capacity', 'status', 'current_route_id'];
      
      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updateFields.push(`${key} = $${paramIndex}`);
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
        UPDATE buses 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, plate_number, model, year, capacity, status, updated_at
      `;

      const result = await pool.query(query, updateValues);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Bus not found',
          code: 'BUS_NOT_FOUND'
        });
      }

      const bus = result.rows[0];

      res.json({
        id: bus.id,
        plateNumber: bus.plate_number,
        model: bus.model,
        year: bus.year,
        capacity: bus.capacity,
        status: bus.status,
        updatedAt: bus.updated_at
      });
    } catch (error) {
      throw error;
    }
  }

  async updateBusLocation(req, res) {
    try {
      const { id } = req.params;
      const locationData = updateLocationSchema.parse(req.body);

      // Save to GPS logs
      await gpsService.saveLocation(id, {
        ...locationData,
        timestamp: locationData.timestamp || new Date().toISOString()
      });

      // Update bus last location
      const updateQuery = `
        UPDATE buses 
        SET last_lat = $1, last_lng = $2, last_seen_at = NOW()
        WHERE id = $3
      `;

      await pool.query(updateQuery, [locationData.lat, locationData.lng, id]);

      res.json({
        message: 'Location updated successfully',
        location: {
          busId: id,
          lat: locationData.lat,
          lng: locationData.lng,
          timestamp: locationData.timestamp || new Date().toISOString()
        }
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

  async getBusTrack(req, res) {
    try {
      const { id } = req.params;
      const hours = parseInt(req.query.hours) || 24;

      const track = await gpsService.getBusHistory(id, hours);

      res.json({
        busId: id,
        hours,
        track,
        count: track.length
      });
    } catch (error) {
      throw error;
    }
  }

  async getBusTrips(req, res) {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const query = `
        SELECT 
          t.id, t.started_at, t.ended_at, t.scheduled_start, 
          t.delay_minutes, t.passenger_count, t.status,
          r.id as route_id, r.route_code, r.name as route_name, r.color as route_color
        FROM trips t
        JOIN routes r ON t.route_id = r.id
        WHERE t.bus_id = $1
        ORDER BY t.started_at DESC
        LIMIT $2 OFFSET $3
      `;

      const countQuery = 'SELECT COUNT(*) FROM trips WHERE bus_id = $1';

      const [tripsResult, countResult] = await Promise.all([
        pool.query(query, [id, limit, offset]),
        pool.query(countQuery, [id])
      ]);

      const trips = tripsResult.rows.map(trip => ({
        id: trip.id,
        startedAt: trip.started_at,
        endedAt: trip.ended_at,
        scheduledStart: trip.scheduled_start,
        delayMinutes: trip.delay_minutes,
        passengerCount: trip.passenger_count,
        status: trip.status,
        route: {
          id: trip.route_id,
          code: trip.route_code,
          name: trip.route_name,
          color: trip.route_color
        }
      }));

      res.json({
        trips,
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
}

module.exports = new BusesController();
