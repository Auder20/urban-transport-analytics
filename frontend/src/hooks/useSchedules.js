import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { schedulesService } from '@/services/schedulesService'

export function useAllSchedules(params = {}) {
  return useQuery({
    queryKey: ['schedules', 'all', params],
    queryFn: () => schedulesService.getAll(params),
    staleTime: 5 * 60 * 1000,
  })
}

export function useSchedulesByRoute(routeId) {
  return useQuery({
    queryKey: ['schedules', 'route', routeId],
    queryFn: () => schedulesService.getByRoute(routeId),
    staleTime: 5 * 60 * 1000,
    enabled: !!routeId,
  })
}

export function useCreateSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: schedulesService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schedules'] }),
  })
}
