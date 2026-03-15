import axios from 'axios'
import { useAppStore } from '@/store/useAppStore'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAppStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      useAppStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Analytics API instance
const analyticsApi = axios.create({
  baseURL: '/analytics',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

analyticsApi.interceptors.request.use(
  (config) => {
    const token = useAppStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Helper functions for common API patterns
const apiRequest = async (method, url, data = null, config = {}) => {
  try {
    const response = await api({
      method,
      url,
      data,
      ...config,
    })
    return response.data
  } catch (error) {
    console.error(`API ${method} ${url} error:`, error)
    throw error
  }
}

const analyticsRequest = async (method, url, data = null, config = {}) => {
  try {
    const response = await analyticsApi({
      method,
      url,
      data,
      ...config,
    })
    return response.data
  } catch (error) {
    console.error(`Analytics API ${method} ${url} error:`, error)
    throw error
  }
}

// Export instances and helpers
export { api, analyticsApi, apiRequest, analyticsRequest }
export default api
