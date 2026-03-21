import axios from 'axios'
import { useAppStore } from '@/store/useAppStore'

// Response interceptor setup function
const setupResponseInterceptor = (instance) => {
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config
      
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true
        
        try {
          // Cookie will be sent automatically with credentials: 'include'
          const response = await axios.post('/api/auth/refresh', {}, {
            withCredentials: true
          })
          
          const newToken = response.data.accessToken
          useAppStore.getState().setToken(newToken)
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return instance(originalRequest)
        } catch (refreshError) {
          // Refresh failed, logout and redirect
          useAppStore.getState().logout()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      }
      
      return Promise.reject(error)
    }
  )
}

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  withCredentials: true, // Send cookies automatically
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
setupResponseInterceptor(api)

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

// Export instances and helpers
export { api, apiRequest }
export default api
