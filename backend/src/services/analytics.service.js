const axios = require('axios');
const cacheService = require('./cache.service');

class AnalyticsService {
  constructor() {
    this.analyticsUrl = process.env.ANALYTICS_URL || 'http://analytics:8000';
  }

  async getKPIS() {
    try {
      return await cacheService.getOrFetch(
        'analytics:kpis',
        async () => {
          const response = await axios.get(`${this.analyticsUrl}/stats/system`, {
            timeout: 5000
          });
          return response.data;
        },
        120 // 2 minutes TTL
      );
    } catch (error) {
      console.error('Analytics service getKPIS error:', error);
      throw new Error('Failed to fetch KPIs from analytics service');
    }
  }

  async predictDelay(routeId, hour, dayOfWeek) {
    try {
      const cacheKey = `analytics:delay:${routeId}:${hour}:${dayOfWeek}`;
      return await cacheService.getOrFetch(
        cacheKey,
        async () => {
          const response = await axios.get(`${this.analyticsUrl}/predict/delay`, {
            params: { route_id: routeId, hour, day_of_week: dayOfWeek },
            timeout: 5000
          });
          return response.data;
        },
        300 // 5 minutes TTL
      );
    } catch (error) {
      console.error('Analytics service predictDelay error:', error);
      throw new Error('Failed to predict delay');
    }
  }

  async getRouteAnalysis(routeId) {
    try {
      const cacheKey = `analytics:route:${routeId}`;
      return await cacheService.getOrFetch(
        cacheKey,
        async () => {
          const response = await axios.get(`${this.analyticsUrl}/analyze/route/${routeId}/summary`, {
            timeout: 5000
          });
          return response.data;
        },
        600 // 10 minutes TTL
      );
    } catch (error) {
      console.error('Analytics service getRouteAnalysis error:', error);
      throw new Error('Failed to get route analysis');
    }
  }

  async getAnomalies(days = 7) {
    try {
      const cacheKey = `analytics:anomalies:${days}`;
      return await cacheService.getOrFetch(
        cacheKey,
        async () => {
          const response = await axios.get(`${this.analyticsUrl}/analyze/anomalies`, {
            params: { days },
            timeout: 5000
          });
          return response.data;
        },
        1800 // 30 minutes TTL
      );
    } catch (error) {
      console.error('Analytics service getAnomalies error:', error);
      throw new Error('Failed to get anomalies');
    }
  }

  async retrainModel() {
    try {
      const response = await axios.post(`${this.analyticsUrl}/train/model`, {}, {
        timeout: 30000 // 30 seconds timeout for training
      });
      
      // Invalidate relevant caches
      await cacheService.invalidatePattern('analytics:*');
      
      return response.data;
    } catch (error) {
      console.error('Analytics service retrainModel error:', error);
      throw new Error('Failed to retrain model');
    }
  }

  async getTrainingStatus() {
    try {
      const response = await axios.get(`${this.analyticsUrl}/train/status`, {
        timeout: 5000
      })
      return response.data
    } catch (error) {
      console.error('Analytics service getTrainingStatus error:', error)
      throw new Error('Failed to get training status')
    }
  }

  async getDataQuality() {
    try {
      const cacheKey = 'analytics:data-quality'
      return await cacheService.getOrFetch(
        cacheKey,
        async () => {
          const response = await axios.get(`${this.analyticsUrl}/train/data-quality`, {
            timeout: 5000
          })
          return response.data
        },
        1800 // 30 minutes TTL
      )
    } catch (error) {
      console.error('Analytics service getDataQuality error:', error)
      throw new Error('Failed to get data quality')
    }
  }

  async getRouteAnalysisSummary(routeId) {
    try {
      const cacheKey = `analytics:route-summary:${routeId}` 
      return await cacheService.getOrFetch(
        cacheKey,
        async () => {
          const response = await axios.get(`${this.analyticsUrl}/analyze/route/${routeId}/summary`, {
            timeout: 10000
          })
          return response.data
        },
        600 // 10 minutes TTL
      )
    } catch (error) {
      console.error('Analytics service getRouteAnalysisSummary error:', error)
      throw new Error('Failed to get route analysis summary')
    }
  }

  async predictDelayForRoute(params) {
    try {
      const { route_id, hour, day_of_week } = params
      const cacheKey = `analytics:predict:${route_id}:${hour}:${day_of_week}` 
      return await cacheService.getOrFetch(
        cacheKey,
        async () => {
          const response = await axios.get(`${this.analyticsUrl}/predict/delay`, {
            params: { route_id, hour, day_of_week },
            timeout: 5000
          })
          return response.data
        },
        300 // 5 minutes TTL
      )
    } catch (error) {
      console.error('Analytics service predictDelayForRoute error:', error)
      throw new Error('Failed to predict delay')
    }
  }

  async getHealth() {
    try {
      const response = await axios.get(`${this.analyticsUrl}/health`, {
        timeout: 3000
      });
      return response.data;
    } catch (error) {
      console.error('Analytics service health check error:', error);
      throw new Error('Analytics service unavailable');
    }
  }
}

module.exports = new AnalyticsService();
