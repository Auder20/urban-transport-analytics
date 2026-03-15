import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { routesService } from '@/services/routesService'

export function useRoutes(page = 1, limit = 20, filters = {}) {
  return useQuery({
    queryKey: ['routes', page, limit, filters],
    queryFn: () => routesService.getAll({ page, limit, ...filters }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useRoute(routeId) {
  return useQuery({
    queryKey: ['routes', routeId],
    queryFn: () => routesService.getById(routeId),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!routeId,
  })
}

export function useRouteStations(routeId) {
  return useQuery({
    queryKey: ['routes', routeId, 'stations'],
    queryFn: () => routesService.getStations(routeId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!routeId,
  })
}

export function useRouteBuses(routeId) {
  return useQuery({
    queryKey: ['routes', routeId, 'buses'],
    queryFn: () => routesService.getBuses(routeId),
    staleTime: 30 * 1000, // 30 seconds
    enabled: !!routeId,
  })
}

export function useCreateRoute() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: routesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] })
    },
  })
}

export function useUpdateRoute() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }) => routesService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['routes'] })
      queryClient.invalidateQueries({ queryKey: ['routes', id] })
    },
  })
}

export function useDeleteRoute() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: routesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] })
    },
  })
}
