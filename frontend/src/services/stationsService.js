import { api } from './api'

export const stationsService = {
  getAll: async (params = {}) => {
    const response = await api.get('/stations', { params })
    return response.data
  },
  getById: async (id) => {
    const response = await api.get(`/stations/${id}`)
    return response.data
  },
  getArrivals: async (id) => {
    const response = await api.get(`/stations/${id}/arrivals`)
    return response.data
  },
  create: async (data) => {
    const response = await api.post('/stations', data)
    return response.data
  },
  update: async (id, data) => {
    const response = await api.put(`/stations/${id}`, data)
    return response.data
  },
}
