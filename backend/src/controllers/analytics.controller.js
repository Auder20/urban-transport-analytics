const pool = require('../config/database');
const cacheService = require('../services/cache.service');
const analyticsService = require('../services/analytics.service');

class AnalyticsController {
  async getKPIS(req, res) {
    try {
      const { data, fromCache } = await analyticsService.getKPIS();

      // Enrich with real-time data from PostgreSQL
      const [
        totalBusesResult,
        activeBusesResult,
        totalRoutesResult,
        totalTripsResult,
        recentTripsResult
      ] = await Promise.all([
        pool.query('SELECT COUNT(*) as count FROM buses'),
        pool.query('SELECT COUNT(*) as count FROM buses WHERE status = \'active\' AND last_seen_at > NOW() - INTERVAL \'5 minutes\''),
        pool.query('SELECT COUNT(*) as count FROM routes WHERE status = \'active\''),
        pool.query('SELECT COUNT(*) as count FROM trips WHERE started_at >= CURRENT_DATE'),
        pool.query(`
          SELECT 
            COUNT(CASE WHEN delay_minutes <= 5 THEN 1 END) as on_time,
            COUNT(*) as total,
            AVG(delay_minutes) as avg_delay
          FROM trips 
          WHERE started_at >= CURRENT_DATE
        `)
      ]);

      const kpis = {
        ...data,
        totalBuses: parseInt(totalBusesResult.rows[0].count),
        activeBuses: parseInt(activeBusesResult.rows[0].count),
        totalRoutes: parseInt(totalRoutesResult.rows[0].count),
        totalTripsToday: parseInt(totalTripsResult.rows[0].count),
        onTimePercentageToday: recentTripsResult.rows[0].total > 0 ? 
          (recentTripsResult.rows[0].on_time / recentTripsResult.rows[0].total) * 100 : 0,
        averageDelayToday: parseFloat(recentTripsResult.rows[0].avg_delay) || 0
      };

      res.json({
        kpis,
        fromCache
      });
    } catch (error) {
      throw error;
    }
  }

  async getDelays(req, res) {
    try {
      const route = req.query.route;
      const from = req.query.from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const to = req.query.to || new Date().toISOString();

      let whereClause = 'WHERE t.started_at BETWEEN $1 AND $2';
      let queryParams = [from, to];

      if (route) {
        whereClause += ' AND t.route_id = $3';
        queryParams.push(route);
      }

      const query = `
        SELECT 
          t.route_id,
          r.route_code,
          r.name as route_name,
          r.color as route_color,
          DATE_TRUNC('hour', t.started_at) as hour_bucket,
          COUNT(*) as trip_count,
          AVG(t.delay_minutes) as avg_delay,
          MAX(t.delay_minutes) as max_delay,
          COUNT(CASE WHEN t.delay_minutes > 15 THEN 1 END) as problematic_trips
        FROM trips t
        JOIN routes r ON t.route_id = r.id
        ${whereClause}
        GROUP BY t.route_id, r.route_code, r.name, r.color, DATE_TRUNC('hour', t.started_at)
        ORDER BY hour_bucket DESC, avg_delay DESC
      `;

      const result = await pool.query(query, queryParams);

      const delays = result.rows.map(row => ({
        route: {
          id: row.route_id,
          code: row.route_code,
          name: row.route_name,
          color: row.route_color
        },
        hour: row.hour_bucket,
        tripCount: parseInt(row.trip_count),
        averageDelay: parseFloat(row.avg_delay) || 0,
        maxDelay: parseFloat(row.max_delay) || 0,
        problematicTrips: parseInt(row.problematic_trips)
      }));

      res.json({
        delays,
        period: { from, to },
        route
      });
    } catch (error) {
      throw error;
    }
  }

  async getHeatmap(req, res) {
    try {
      const hours = parseInt(req.query.hours) || 1;

      const query = `
        SELECT 
          b.last_lat,
          b.last_lng,
          b.plate_number,
          r.route_code,
          r.color as route_color,
          EXTRACT(EPOCH FROM (NOW() - b.last_seen_at)) / 60 as minutes_ago
        FROM buses b
        JOIN routes r ON b.current_route_id = r.id
        WHERE b.status = 'active'
          AND b.last_lat IS NOT NULL
          AND b.last_lng IS NOT NULL
          AND b.last_seen_at > NOW() - INTERVAL '${hours} hours'
        ORDER BY b.last_seen_at DESC
      `;

      const result = await pool.query(query);

      const heatmapData = result.rows.map(bus => ({
        lat: parseFloat(bus.last_lat),
        lng: parseFloat(bus.last_lng),
        weight: Math.max(0, 1 - (bus.minutes_ago / (hours * 60))), // Decay over time
        bus: {
          plateNumber: bus.plate_number,
          route: {
            code: bus.route_code,
            color: bus.route_color
          }
        }
      }));

      res.json({
        heatmapData,
        timeWindow: `${hours} hours`,
        count: heatmapData.length
      });
    } catch (error) {
      throw error;
    }
  }

  async getProblematicRoutes(req, res) {
    try {
      const days = parseInt(req.query.days) || 7;

      const query = `
        SELECT 
          r.id,
          r.route_code,
          r.name,
          r.color,
          COUNT(t.id) as total_trips,
          AVG(t.delay_minutes) as avg_delay,
          MAX(t.delay_minutes) as max_delay,
          COUNT(CASE WHEN t.delay_minutes > 15 THEN 1 END) as problematic_trips,
          COUNT(CASE WHEN t.delay_minutes <= 5 THEN 1 END) as on_time_trips,
          (COUNT(CASE WHEN t.delay_minutes <= 5 THEN 1 END)::FLOAT / COUNT(t.id)) * 100 as on_time_percentage
        FROM routes r
        LEFT JOIN trips t ON r.id = t.route_id 
          AND t.started_at >= NOW() - INTERVAL '${days} days'
        WHERE r.status = 'active'
        GROUP BY r.id, r.route_code, r.name, r.color
        HAVING COUNT(t.id) > 0
        ORDER BY avg_delay DESC NULLS LAST
      `;

      const result = await pool.query(query);

      const problematicRoutes = result.rows.map(route => ({
        id: route.id,
        routeCode: route.route_code,
        name: route.name,
        color: route.color,
        totalTrips: parseInt(route.total_trips),
        averageDelay: parseFloat(route.avg_delay) || 0,
        maxDelay: parseFloat(route.max_delay) || 0,
        problematicTrips: parseInt(route.problematic_trips),
        onTimeTrips: parseInt(route.on_time_trips),
        onTimePercentage: parseFloat(route.on_time_percentage) || 0
      }));

      res.json({
        routes: problematicRoutes,
        period: `${days} days`
      });
    } catch (error) {
      throw error;
    }
  }

  async getPeakHours(req, res) {
    try {
      const days = parseInt(req.query.days) || 7;
      const routeId = req.query.route;

      let whereClause = 'WHERE t.started_at >= NOW() - INTERVAL \'${days} days\'';
      let queryParams = [];

      if (routeId) {
        whereClause += ' AND t.route_id = $1';
        queryParams.push(routeId);
      }

      const query = `
        SELECT 
          EXTRACT(HOUR FROM t.started_at) as hour_of_day,
          COUNT(*) as trip_count,
          AVG(t.delay_minutes) as avg_delay,
          COUNT(CASE WHEN t.delay_minutes > 15 THEN 1 END) as problematic_trips,
          AVG(t.passenger_count) as avg_passengers
        FROM trips t
        ${whereClause.replace('${days}', days)}
        GROUP BY EXTRACT(HOUR FROM t.started_at)
        ORDER BY hour_of_day
      `;

      const result = await pool.query(query, queryParams);

      const peakHours = result.rows.map(row => ({
        hour: parseInt(row.hour_of_day),
        tripCount: parseInt(row.trip_count),
        averageDelay: parseFloat(row.avg_delay) || 0,
        problematicTrips: parseInt(row.problematic_trips),
        averagePassengers: parseFloat(row.avg_passengers) || 0
      }));

      // Identify peak hours (top 3 by trip count)
      const sortedByTrips = [...peakHours].sort((a, b) => b.tripCount - a.tripCount);
      const peakHoursList = sortedByTrips.slice(0, 3).map(h => h.hour);

      res.json({
        peakHours,
        peakHoursList,
        period: `${days} days`,
        routeId
      });
    } catch (error) {
      throw error;
    }
  }

  async getRoutePredictions(req, res) {
    try {
      const { routeId } = req.params;
      const { hour, dayOfWeek } = req.query;

      if (!hour || !dayOfWeek) {
        return res.status(400).json({
          error: 'Hour and dayOfWeek parameters are required',
          code: 'MISSING_PARAMETERS'
        });
      }

      const { data: prediction } = await analyticsService.predictDelay(routeId, parseInt(hour), parseInt(dayOfWeek));

      res.json({
        routeId,
        hour: parseInt(hour),
        dayOfWeek: parseInt(dayOfWeek),
        prediction
      });
    } catch (error) {
      throw error;
    }
  }

  async getAnomalies(req, res) {
    try {
      const days = parseInt(req.query.days) || 7;

      const { data: anomalies } = await analyticsService.getAnomalies(days);

      res.json({
        anomalies,
        period: `${days} days`
      });
    } catch (error) {
      throw error;
    }
  }

  async retrainModel(req, res) {
    try {
      const { data: result } = await analyticsService.retrainModel();

      res.json({
        message: 'Model retraining initiated',
        result
      });
    } catch (error) {
      throw error;
    }
  }

  async getSystemStats(req, res) {
    try {
      const [
        dbStats,
        redisStats,
        analyticsHealth
      ] = await Promise.all([
        this.getDatabaseStats(),
        this.getRedisStats(),
        analyticsService.getHealth().catch(() => ({ status: 'unavailable' }))
      ]);

      const stats = {
        database: dbStats,
        cache: redisStats,
        analytics: analyticsHealth,
        timestamp: new Date().toISOString()
      };

      res.json(stats);
    } catch (error) {
      throw error;
    }
  }

  async getDatabaseStats() {
    try {
      const [tablesResult, connectionsResult, sizeResult] = await Promise.all([
        pool.query(`
          SELECT 
            schemaname,
            tablename,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes,
            n_live_tup as live_rows,
            n_dead_tup as dead_rows
          FROM pg_stat_user_tables
          ORDER BY n_live_tup DESC
        `),
        pool.query('SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = \'active\''),
        pool.query(`
          SELECT 
            pg_size_pretty(pg_database_size(current_database())) as database_size,
            pg_size_pretty(pg_total_relation_size('trips')) as trips_table_size
        `)
      ]);

      return {
        tables: tablesResult.rows,
        activeConnections: parseInt(connectionsResult.rows[0].active_connections),
        size: sizeResult.rows[0]
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async getRedisStats() {
    try {
      const info = await cacheService.get('redis:info') || {};
      return {
        status: 'connected',
        info
      };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
}

module.exports = new AnalyticsController();
