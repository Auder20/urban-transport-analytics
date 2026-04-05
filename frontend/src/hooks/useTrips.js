import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tripsService } from '@/services/tripsService'

export function useAllTrips(page = 1, limit = 20, filters = {}, options = {}) {
  return useQuery({
    queryKey: ['trips', 'all', page, limit, filters],
    queryFn: () => tripsService.getAll({ page, limit, ...filters }),
    staleTime: 2 * 60 * 1000,
    ...options
  })
}

export function useTripsByRoute(routeId, params = {}) {
  return useQuery({
    queryKey: ['trips', 'route', routeId, params],
    queryFn: () => tripsService.getByRoute(routeId, params),
    staleTime: 2 * 60 * 1000,
    enabled: !!routeId,
  })
}

export function useDeleteTrip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: tripsService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  })
}
