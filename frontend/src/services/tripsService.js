import { api } from './api'

export const tripsService = {
  getAll: async (params = {}) => {
    const response = await api.get('/trips', { params })
    return response.data
  },
  getById: async (id) => {
    const response = await api.get(`/trips/${id}`)
    return response.data
  },
  getByRoute: async (routeId, params = {}) => {
    const response = await api.get(`/trips/route/${routeId}`, { params })
    return response.data
  },
}
