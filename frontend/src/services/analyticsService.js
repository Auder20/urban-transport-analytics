import { analyticsApi } from './api'

export const analyticsService = {
  // Get KPIs
  getKPIS: async () => {
    const response = await analyticsApi.get('/stats/kpis')
    return response.data
  },

  // Get system stats
  getSystemStats: async () => {
    const response = await analyticsApi.get('/stats/system')
    return response.data
  },

  // Get delays analysis
  getDelays: async (params = {}) => {
    const response = await analyticsApi.get('/delays', { params })
    return response.data
  },

  // Get heatmap data
  getHeatmap: async (params = {}) => {
    const response = await analyticsApi.get('/heatmap', { params })
    return response.data
  },

  // Get problematic routes
  getProblematicRoutes: async (params = {}) => {
    const response = await analyticsApi.get('/routes/problematic', { params })
    return response.data
  },

  // Get peak hours analysis
  getPeakHours: async (params = {}) => {
    const response = await analyticsApi.get('/peak-hours', { params })
    return response.data
  },

  // Get route analysis
  getRouteAnalysis: async (routeId, params = {}) => {
    const response = await analyticsApi.get(`/analyze/route/${routeId}/summary`, { params })
    return response.data
  },

  // Get anomalies
  getAnomalies: async (params = {}) => {
    const response = await analyticsApi.get('/analyze/anomalies', { params })
    return response.data
  },

  // Predict delay
  predictDelay: async (params) => {
    const response = await analyticsApi.get('/predict/delay', { params })
    return response.data
  },

  // Train model
  trainModel: async () => {
    const response = await analyticsApi.post('/train/model')
    return response.data
  },

  // Get training status
  getTrainingStatus: async () => {
    const response = await analyticsApi.get('/train/status')
    return response.data
  },

  // Get data quality report
  getDataQuality: async () => {
    const response = await analyticsApi.get('/train/data-quality')
    return response.data
  },
}
