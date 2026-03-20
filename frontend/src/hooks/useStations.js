import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { stationsService } from '@/services/stationsService'

export function useAllStations(page = 1, limit = 20, filters = {}) {
  return useQuery({
    queryKey: ['stations', 'all', page, limit, filters],
    queryFn: () => stationsService.getAll({ page, limit, ...filters }),
    staleTime: 5 * 60 * 1000,
  })
}

export function useStation(id) {
  return useQuery({
    queryKey: ['stations', id],
    queryFn: () => stationsService.getById(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  })
}

export function useStationArrivals(id) {
  return useQuery({
    queryKey: ['stations', id, 'arrivals'],
    queryFn: () => stationsService.getArrivals(id),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    enabled: !!id,
  })
}
