import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { busesService } from '@/services/busesService'

export function useAllBuses(page = 1, limit = 20, filters = {}) {
  return useQuery({
    queryKey: ['buses', 'all', page, limit, filters],
    queryFn: () => busesService.getAll({ page, limit, ...filters }),
    staleTime: 30 * 1000,
  })
}

export function useBus(id) {
  return useQuery({
    queryKey: ['buses', id],
    queryFn: () => busesService.getById(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  })
}

export function useCreateBus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: busesService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['buses'] }),
  })
}

export function useUpdateBus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => busesService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['buses'] })
      queryClient.invalidateQueries({ queryKey: ['buses', id] })
    },
  })
}

export function useDeleteBus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => busesService.update(id, { status: 'inactive' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['buses'] }),
  })
}
