import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'

export function useBusLocations(refetchInterval = 10000) {
  return useQuery({
    queryKey: ['buses', 'live'],
    queryFn: () => api.get('/buses/live').then(r => r.data),
    refetchInterval,
    staleTime: refetchInterval / 2,
    select: (data) => data.buses || [],
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error.response?.status >= 400 && error.response?.status < 500) {
        return false
      }
      // Retry up to 3 times for other errors
      return failureCount < 3
    },
  })
}

export function useBusHistory(busId, hours = 24) {
  return useQuery({
    queryKey: ['buses', busId, 'history', hours],
    queryFn: () => api.get(`/buses/${busId}/track`, { params: { hours } }).then(r => r.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!busId,
  })
}

export function useBusTrips(busId, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['buses', busId, 'trips', page, limit],
    queryFn: () => api.get(`/buses/${busId}/trips`, { params: { page, limit } }).then(r => r.data),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!busId,
  })
}

export function useAllBuses(page = 1, limit = 20, filters = {}) {
  return useQuery({
    queryKey: ['buses', 'all', page, limit, filters],
    queryFn: () => api.get('/buses', { params: { page, limit, ...filters } }).then(r => r.data),
    staleTime: 30 * 1000, // 30 seconds
  })
}
