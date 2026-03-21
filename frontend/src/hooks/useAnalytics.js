import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { analyticsService } from '@/services/analyticsService'
import { useAppStore } from '@/store/useAppStore'

export function useKPIS() {
  const { autoRefresh } = useAppStore()
  return useQuery({
    queryKey: ['analytics', 'kpis'],
    queryFn: analyticsService.getKPIS,
    staleTime: 2 * 60 * 1000,
    refetchInterval: autoRefresh ? 2 * 60 * 1000 : false,
  })
}

export function useSystemStats() {
  return useQuery({
    queryKey: ['analytics', 'system-stats'],
    queryFn: analyticsService.getSystemStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useDelays(params = {}) {
  return useQuery({
    queryKey: ['analytics', 'delays', params],
    queryFn: () => analyticsService.getDelays(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useHeatmap(params = {}) {
  const { autoRefresh } = useAppStore()
  return useQuery({
    queryKey: ['analytics', 'heatmap', params],
    queryFn: () => analyticsService.getHeatmap(params),
    staleTime: 60 * 1000,
    refetchInterval: autoRefresh ? 60 * 1000 : false,
  })
}

export function useProblematicRoutes(params = {}) {
  return useQuery({
    queryKey: ['analytics', 'problematic-routes', params],
    queryFn: () => analyticsService.getProblematicRoutes(params),
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

export function usePeakHours(params = {}) {
  return useQuery({
    queryKey: ['analytics', 'peak-hours', params],
    queryFn: () => analyticsService.getPeakHours(params),
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

export function useRouteAnalysis(routeId, params = {}) {
  return useQuery({
    queryKey: ['analytics', 'route-analysis', routeId, params],
    queryFn: () => analyticsService.getRouteAnalysis(routeId, params),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!routeId,
  })
}

export function useAnomalies(params = {}) {
  return useQuery({
    queryKey: ['analytics', 'anomalies', params],
    queryFn: () => analyticsService.getAnomalies(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useDelayPrediction(params) {
  return useQuery({
    queryKey: ['analytics', 'delay-prediction', params],
    queryFn: () => analyticsService.predictDelay(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!params.route_id && !!params.hour && !!params.day_of_week,
  })
}

export function useTrainModel() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: analyticsService.trainModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })
}

export function useTrainingStatus() {
  return useQuery({
    queryKey: ['analytics', 'training-status'],
    queryFn: analyticsService.getTrainingStatus,
    staleTime: 60 * 1000, // 1 minute
  })
}

export function useDataQuality() {
  return useQuery({
    queryKey: ['analytics', 'data-quality'],
    queryFn: analyticsService.getDataQuality,
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}
