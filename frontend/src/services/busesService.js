import { api } from './api'

export const busesService = {
  getAll: async (params = {}) => {
    const response = await api.get('/buses', { params })
    return response.data
  },
  getById: async (id) => {
    const response = await api.get(`/buses/${id}`)
    return response.data
  },
  create: async (data) => {
    const response = await api.post('/buses', data)
    return response.data
  },
  update: async (id, data) => {
    const response = await api.put(`/buses/${id}`, data)
    return response.data
  },
}
