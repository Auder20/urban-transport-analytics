import { api } from './api'

export const analyticsService = {
  // Get KPIs — Node: GET /api/analytics/kpis
  getKPIS: async () => {
    const response = await api.get('/analytics/kpis')
    return response.data
  },

  // Get system stats — Node: GET /api/analytics/system/stats
  getSystemStats: async () => {
    const response = await api.get('/analytics/system/stats')
    return response.data
  },

  // Get delays analysis — Node: GET /api/analytics/delays
  getDelays: async (params = {}) => {
    const response = await api.get('/analytics/delays', { params })
    return response.data
  },

  // Get heatmap data — Node: GET /api/analytics/heatmap
  getHeatmap: async (params = {}) => {
    const response = await api.get('/analytics/heatmap', { params })
    return response.data
  },

  // Get problematic routes — Node: GET /api/analytics/routes/problematic
  getProblematicRoutes: async (params = {}) => {
    const response = await api.get('/analytics/routes/problematic', { params })
    return response.data
  },

  // Get peak hours analysis — Node: GET /api/analytics/peak-hours
  getPeakHours: async (params = {}) => {
    const response = await api.get('/analytics/peak-hours', { params })
    return response.data
  },

  // Get route analysis — Node: GET /api/analytics/analyze/route/:id/summary
  getRouteAnalysis: async (routeId, params = {}) => {
    const response = await api.get(`/analytics/analyze/route/${routeId}/summary`, { params })
    return response.data
  },

  // Get anomalies — Node: GET /api/analytics/anomalies
  getAnomalies: async (params = {}) => {
    const response = await api.get('/analytics/anomalies', { params })
    return response.data
  },

  // Predict delay — Node: GET /api/analytics/predict/delay
  predictDelay: async (params) => {
    const response = await api.get('/analytics/predict/delay', { params })
    return response.data
  },

  // Train model — Node: POST /api/analytics/retrain-model
  trainModel: async () => {
    const response = await api.post('/analytics/retrain-model')
    return response.data
  },

  // Get training status — Node: GET /api/analytics/train/status
  getTrainingStatus: async () => {
    const response = await api.get('/analytics/train/status')
    return response.data
  },

  // Get data quality report — Node: GET /api/analytics/train/data-quality
  getDataQuality: async () => {
    const response = await api.get('/analytics/train/data-quality')
    return response.data
  },
}
