import { api } from './api'

export const routesService = {
  // Get all routes
  getAll: async (params = {}) => {
    const response = await api.get('/routes', { params })
    return response.data
  },

  // Get route by ID
  getById: async (id) => {
    const response = await api.get(`/routes/${id}`)
    return response.data
  },

  // Get route stations
  getStations: async (id) => {
    const response = await api.get(`/routes/${id}/stations`)
    return response.data
  },

  // Get route buses
  getBuses: async (id) => {
    const response = await api.get(`/routes/${id}/buses`)
    return response.data
  },

  // Create new route
  create: async (data) => {
    const response = await api.post('/routes', data)
    return response.data
  },

  // Update route
  update: async (id, data) => {
    const response = await api.put(`/routes/${id}`, data)
    return response.data
  },

  // Delete route
  delete: async (id) => {
    const response = await api.delete(`/routes/${id}`)
    return response.data
  },
}
