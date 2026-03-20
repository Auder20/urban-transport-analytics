import { api } from './api'

export const schedulesService = {
  getAll: async (params = {}) => {
    const response = await api.get('/schedules', { params })
    return response.data
  },
  getByRoute: async (routeId) => {
    const response = await api.get(`/schedules/route/${routeId}`)
    return response.data
  },
  create: async (data) => {
    const response = await api.post('/schedules', data)
    return response.data
  },
  update: async (id, data) => {
    const response = await api.put(`/schedules/${id}`, data)
    return response.data
  },
  deactivate: async (id) => {
    const response = await api.post(`/schedules/${id}/deactivate`)
    return response.data
  },
}
