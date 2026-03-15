const GpsLog = require('../models/GpsLog.model');
const cacheService = require('./cache.service');
const { v4: uuidv4 } = require('uuid');

class GPSService {
  async saveLocation(busId, locationData) {
    try {
      const gpsLog = new GpsLog({
        bus_id: busId,
        route_id: locationData.route_id,
        timestamp: new Date(locationData.timestamp),
        location: {
          type: 'Point',
          coordinates: [locationData.lng, locationData.lat]
        },
        speed_kmh: locationData.speed_kmh,
        heading: locationData.heading,
        altitude_m: locationData.altitude_m,
        accuracy_m: locationData.accuracy_m,
        occupancy_pct: locationData.occupancy_pct,
        engine_status: locationData.engine_status,
        odometer_km: locationData.odometer_km
      });

      await gpsLog.save();

      // Update live buses cache
      await this.updateLiveBusesCache(busId, locationData);

      // Publish real-time update
      await cacheService.publish('bus:location:update', {
        busId,
        lat: locationData.lat,
        lng: locationData.lng,
        speed: locationData.speed_kmh,
        timestamp: locationData.timestamp,
        route_id: locationData.route_id
      });

      return gpsLog;
    } catch (error) {
      console.error('GPS service saveLocation error:', error);
      throw error;
    }
  }

  async updateLiveBusesCache(busId, locationData) {
    try {
      const liveBuses = await cacheService.get('buses:live') || {};
      liveBuses[busId] = {
        ...locationData,
        last_seen: new Date().toISOString()
      };
      await cacheService.set('buses:live', liveBuses, 15); // 15 seconds TTL
    } catch (error) {
      console.error('Update live buses cache error:', error);
    }
  }

  async getLiveBuses() {
    try {
      return await cacheService.getOrFetch(
        'buses:live',
        async () => {
          const recentLogs = await GpsLog
            .find({
              timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
            })
            .sort({ timestamp: -1 })
            .lean();

          const buses = {};
          recentLogs.forEach(log => {
            if (!buses[log.bus_id] || new Date(log.timestamp) > new Date(buses[log.bus_id].timestamp)) {
              buses[log.bus_id] = {
                bus_id: log.bus_id,
                route_id: log.route_id,
                lat: log.location.coordinates[1],
                lng: log.location.coordinates[0],
                speed_kmh: log.speed_kmh,
                heading: log.heading,
                occupancy_pct: log.occupancy_pct,
                timestamp: log.timestamp
              };
            }
          });

          return buses;
        },
        15 // 15 seconds TTL
      );
    } catch (error) {
      console.error('Get live buses error:', error);
      return { data: {}, fromCache: false };
    }
  }

  async getBusHistory(busId, hours = 24) {
    try {
      const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      const history = await GpsLog
        .find({
          bus_id: busId,
          timestamp: { $gte: startTime }
        })
        .sort({ timestamp: 1 })
        .lean();

      return history.map(log => ({
        timestamp: log.timestamp,
        lat: log.location.coordinates[1],
        lng: log.location.coordinates[0],
        speed_kmh: log.speed_kmh,
        heading: log.heading,
        occupancy_pct: log.occupancy_pct
      }));
    } catch (error) {
      console.error('Get bus history error:', error);
      throw error;
    }
  }
}

module.exports = new GPSService();
