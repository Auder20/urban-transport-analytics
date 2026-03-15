const pool = require('../config/database');
const cacheService = require('../services/cache.service');
const { z } = require('zod');

const createTripSchema = z.object({
  busId: z.string().uuid('Invalid bus ID'),
  routeId: z.string().uuid('Invalid route ID'),
  driverId: z.string().uuid('Invalid driver ID').optional(),
  scheduledStart: z.string().datetime('Invalid scheduled start time'),
  passengerCount: z.number().int().min(0).default(0)
});

class TripsController {
  async getAllTrips(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      const route = req.query.route;
      const status = req.query.status;
      const from = req.query.from;
      const to = req.query.to;

      let whereClause = 'WHERE 1=1';
      let queryParams = [limit, offset];
      let paramIndex = 3;

      if (route) {
        whereClause += ` AND t.route_id = $1`;
        queryParams = [route, limit, offset];
        paramIndex = 3;
      }

      if (status) {
        const statusIndex = route ? 2 : 1;
        whereClause += ` AND t.status = $${statusIndex}`;
        queryParams.splice(statusIndex - 1, 0, status);
        paramIndex++;
      }

      if (from) {
        const fromIndex = queryParams.length - 2;
        whereClause += ` AND t.started_at >= $${fromIndex}`;
        queryParams.splice(fromIndex - 1, 0, from);
        paramIndex++;
      }

      if (to) {
        const toIndex = queryParams.length - 2;
        whereClause += ` AND t.started_at <= $${toIndex}`;
        queryParams.splice(toIndex - 1, 0, to);
        paramIndex++;
      }

      const query = `
        SELECT 
          t.id, t.bus_id, t.route_id, t.driver_id, t.started_at, t.ended_at,
          t.scheduled_start, t.delay_minutes, t.passenger_count, t.status,
          b.plate_number, b.capacity,
          r.route_code, r.name as route_name, r.color as route_color,
          d.full_name as driver_name, d.email as driver_email
        FROM trips t
        JOIN buses b ON t.bus_id = b.id
        JOIN routes r ON t.route_id = r.id
        LEFT JOIN users d ON t.driver_id = d.id
        ${whereClause}
        ORDER BY t.started_at DESC
        LIMIT $${paramIndex - 2} OFFSET $${paramIndex - 1}
      `;

      const countQuery = `
        SELECT COUNT(*) 
        FROM trips t
        ${whereClause.replace('LIMIT $1 OFFSET $2', '')}
      `;

      const [tripsResult, countResult] = await Promise.all([
        pool.query(query, queryParams),
        pool.query(countQuery, queryParams.slice(0, -2))
      ]);

      const trips = tripsResult.rows.map(trip => ({
        id: trip.id,
        bus: {
          id: trip.bus_id,
          plateNumber: trip.plate_number,
          capacity: trip.capacity
        },
        route: {
          id: trip.route_id,
          code: trip.route_code,
          name: trip.route_name,
          color: trip.route_color
        },
        driver: trip.driver_id ? {
          id: trip.driver_id,
          name: trip.driver_name,
          email: trip.driver_email
        } : null,
        startedAt: trip.started_at,
        endedAt: trip.ended_at,
        scheduledStart: trip.scheduled_start,
        delayMinutes: trip.delay_minutes,
        passengerCount: trip.passenger_count,
        status: trip.status
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

  async getTripById(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          t.id, t.bus_id, t.route_id, t.driver_id, t.started_at, t.ended_at,
          t.scheduled_start, t.delay_minutes, t.passenger_count, t.status,
          b.plate_number, b.model, b.capacity,
          r.route_code, r.name as route_name, r.color as route_color, r.distance_km,
          d.full_name as driver_name, d.email as driver_email
        FROM trips t
        JOIN buses b ON t.bus_id = b.id
        JOIN routes r ON t.route_id = r.id
        LEFT JOIN users d ON t.driver_id = d.id
        WHERE t.id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Trip not found',
          code: 'TRIP_NOT_FOUND'
        });
      }

      const trip = result.rows[0];

      res.json({
        id: trip.id,
        bus: {
          id: trip.bus_id,
          plateNumber: trip.plate_number,
          model: trip.model,
          capacity: trip.capacity
        },
        route: {
          id: trip.route_id,
          code: trip.route_code,
          name: trip.route_name,
          color: trip.route_color,
          distanceKm: trip.distance_km ? parseFloat(trip.distance_km) : null
        },
        driver: trip.driver_id ? {
          id: trip.driver_id,
          name: trip.driver_name,
          email: trip.driver_email
        } : null,
        startedAt: trip.started_at,
        endedAt: trip.ended_at,
        scheduledStart: trip.scheduled_start,
        delayMinutes: trip.delay_minutes,
        passengerCount: trip.passenger_count,
        status: trip.status
      });
    } catch (error) {
      throw error;
    }
  }

  async createTrip(req, res) {
    try {
      const { busId, routeId, driverId, scheduledStart, passengerCount } = createTripSchema.parse(req.body);

      const query = `
        INSERT INTO trips (bus_id, route_id, driver_id, scheduled_start, passenger_count)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, bus_id, route_id, driver_id, scheduled_start, passenger_count, status
      `;

      const result = await pool.query(query, [busId, routeId, driverId, scheduledStart, passengerCount]);
      const trip = result.rows[0];

      res.status(201).json({
        id: trip.id,
        busId: trip.bus_id,
        routeId: trip.route_id,
        driverId: trip.driver_id,
        scheduledStart: trip.scheduled_start,
        passengerCount: trip.passenger_count,
        status: trip.status
      });
    } catch (error) {
      if (error.code === '23503') {
        return res.status(400).json({
          error: 'Invalid bus, route, or driver ID',
          code: 'FOREIGN_KEY_VIOLATION'
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

  async startTrip(req, res) {
    try {
      const { id } = req.params;

      const query = `
        UPDATE trips 
        SET started_at = NOW(), status = 'in_progress'
        WHERE id = $1 AND status = 'scheduled'
        RETURNING id, started_at, status
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Trip not found or already started',
          code: 'TRIP_NOT_FOUND_OR_STARTED'
        });
      }

      const trip = result.rows[0];

      res.json({
        id: trip.id,
        startedAt: trip.started_at,
        status: trip.status,
        message: 'Trip started successfully'
      });
    } catch (error) {
      throw error;
    }
  }

  async endTrip(req, res) {
    try {
      const { id } = req.params;
      const { passengerCount } = req.body;

      const query = `
        UPDATE trips 
        SET ended_at = NOW(), status = 'completed', 
            passenger_count = COALESCE($2, passenger_count)
        WHERE id = $1 AND status = 'in_progress'
        RETURNING id, ended_at, status, passenger_count
      `;

      const result = await pool.query(query, [id, passengerCount]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Trip not found or not in progress',
          code: 'TRIP_NOT_FOUND_OR_NOT_IN_PROGRESS'
        });
      }

      const trip = result.rows[0];

      res.json({
        id: trip.id,
        endedAt: trip.ended_at,
        status: trip.status,
        passengerCount: trip.passenger_count,
        message: 'Trip completed successfully'
      });
    } catch (error) {
      throw error;
    }
  }

  async getTripDelays(req, res) {
    try {
      const { id } = req.params;

      // Get trip details
      const tripQuery = `
        SELECT t.id, t.route_id, t.started_at, t.scheduled_start, t.delay_minutes,
               r.route_code, r.name as route_name
        FROM trips t
        JOIN routes r ON t.route_id = r.id
        WHERE t.id = $1
      `;

      const tripResult = await pool.query(tripQuery, [id]);

      if (tripResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Trip not found',
          code: 'TRIP_NOT_FOUND'
        });
      }

      const trip = tripResult.rows[0];

      // Get route stations with delays
      const delaysQuery = `
        SELECT 
          s.id, s.station_code, s.name, s.lat, s.lng,
          rs.stop_order, rs.avg_travel_time_min,
          -- This would normally come from actual stop data
          rs.avg_travel_time_min as actual_delay_min
        FROM stations s
        JOIN route_stations rs ON s.id = rs.station_id
        WHERE rs.route_id = $1
        ORDER BY rs.stop_order
      `;

      const delaysResult = await pool.query(delaysQuery, [trip.route_id]);

      const delays = delaysResult.rows.map((station, index) => ({
        station: {
          id: station.id,
          stationCode: station.station_code,
          name: station.name,
          location: {
            lat: parseFloat(station.lat),
            lng: parseFloat(station.lng)
          }
        },
        stopOrder: station.stop_order,
        scheduledArrival: new Date(trip.started_at).getTime() + (station.avg_travel_time_min || 0) * 60000,
        actualArrival: new Date(trip.started_at).getTime() + (station.actual_delay_min || 0) * 60000,
        delayMinutes: station.actual_delay_min || 0,
        avgTravelTimeMin: station.avg_travel_time_min
      }));

      res.json({
        trip: {
          id: trip.id,
          route: {
            id: trip.route_id,
            code: trip.route_code,
            name: trip.route_name
          },
          startedAt: trip.started_at,
          scheduledStart: trip.scheduled_start,
          totalDelayMinutes: trip.delay_minutes
        },
        delays
      });
    } catch (error) {
      throw error;
    }
  }

  async getTripsByRoute(req, res) {
    try {
      const { routeId } = req.params;
      const days = parseInt(req.query.days) || 7;

      const query = `
        SELECT 
          t.id, t.started_at, t.scheduled_start, t.delay_minutes, 
          t.passenger_count, t.status,
          b.plate_number,
          d.full_name as driver_name
        FROM trips t
        JOIN buses b ON t.bus_id = b.id
        LEFT JOIN users d ON t.driver_id = d.id
        WHERE t.route_id = $1 
          AND t.started_at >= NOW() - INTERVAL '${days} days'
        ORDER BY t.started_at DESC
      `;

      const result = await pool.query(query, [routeId]);

      const trips = result.rows.map(trip => ({
        id: trip.id,
        startedAt: trip.started_at,
        scheduledStart: trip.scheduled_start,
        delayMinutes: trip.delay_minutes,
        passengerCount: trip.passenger_count,
        status: trip.status,
        bus: {
          plateNumber: trip.plate_number
        },
        driver: trip.driver_name ? {
          name: trip.driver_name
        } : null
      }));

      res.json({
        routeId,
        days,
        trips,
        stats: {
          totalTrips: trips.length,
          averageDelay: trips.reduce((sum, trip) => sum + (trip.delayMinutes || 0), 0) / trips.length,
          onTimePercentage: trips.filter(trip => (trip.delayMinutes || 0) <= 5).length / trips.length * 100
        }
      });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new TripsController();
