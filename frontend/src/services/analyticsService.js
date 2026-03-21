import { api } from './api'

// Error handling wrapper for analytics service
const handleAnalyticsError = (error) => {
  if (error.response) {
    const status = error.response.status
    
    // Handle service unavailable (503/502)
    if (status === 503 || status === 502) {
      throw new Error('ML service is currently unavailable')
    }
    
    // Handle not found (404) - return null instead of throwing
    if (status === 404) {
      return null
    }
    
    // Let 401/403 and other errors propagate normally
    throw error
  }
  
  // Network errors - propagate normally
  throw error
}

// Wrapper function for API calls with error handling
const analyticsCall = async (apiCall) => {
  try {
    const response = await apiCall()
    return response.data
  } catch (error) {
    const result = handleAnalyticsError(error)
    return result // Will be null for 404, or will throw for other errors
  }
}

export const analyticsService = {
  // Get KPIs — Node: GET /api/analytics/kpis
  getKPIS: async () => {
    return analyticsCall(() => api.get('/analytics/kpis'))
  },

  // Get system stats — Node: GET /api/analytics/system/stats
  getSystemStats: async () => {
    return analyticsCall(() => api.get('/analytics/system/stats'))
  },

  // Get delays analysis — Node: GET /api/analytics/delays
  getDelays: async (params = {}) => {
    return analyticsCall(() => api.get('/analytics/delays', { params }))
  },

  // Get heatmap data — Node: GET /api/analytics/heatmap
  getHeatmap: async (params = {}) => {
    return analyticsCall(() => api.get('/analytics/heatmap', { params }))
  },

  // Get problematic routes — Node: GET /api/analytics/routes/problematic
  getProblematicRoutes: async (params = {}) => {
    return analyticsCall(() => api.get('/analytics/routes/problematic', { params }))
  },

  // Get peak hours analysis — Node: GET /api/analytics/peak-hours
  getPeakHours: async (params = {}) => {
    return analyticsCall(() => api.get('/analytics/peak-hours', { params }))
  },

  // Get route analysis — Node: GET /api/analytics/analyze/route/:id/summary
  getRouteAnalysis: async (routeId, params = {}) => {
    return analyticsCall(() => api.get(`/analytics/analyze/route/${routeId}/summary`, { params }))
  },

  // Get anomalies — Node: GET /api/analytics/anomalies
  getAnomalies: async (params = {}) => {
    return analyticsCall(() => api.get('/analytics/anomalies', { params }))
  },

  // Predict delay — Node: GET /api/analytics/predict/delay
  predictDelay: async (params) => {
    return analyticsCall(() => api.get('/analytics/predict/delay', { params }))
  },

  // Train model — Node: POST /api/analytics/retrain-model
  trainModel: async () => {
    return analyticsCall(() => api.post('/analytics/retrain-model'))
  },

  // Get training status — Node: GET /api/analytics/train/status
  getTrainingStatus: async () => {
    return analyticsCall(() => api.get('/analytics/train/status'))
  },

  // Get data quality report — Node: GET /api/analytics/train/data-quality
  getDataQuality: async () => {
    return analyticsCall(() => api.get('/analytics/train/data-quality'))
  },
}
