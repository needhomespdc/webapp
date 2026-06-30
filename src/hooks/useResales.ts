import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { resalesApi } from '@/api/resales.api';
import { queryKeys } from '@/lib/queryKeys';

export function useEligibleResales() {
  const query = useQuery({
    queryKey: queryKeys.resales.eligible,
    queryFn: () => resalesApi.getEligible().then((r) => r.data),
  });

  return { eligible: query.data ?? [], isLoading: query.isLoading };
}

export function useMyResales() {
  const query = useQuery({
    queryKey: queryKeys.resales.mine,
    queryFn: () => resalesApi.listMine().then((r) => r.data),
  });

  return { resales: query.data ?? [], isLoading: query.isLoading };
}

export function useCreateResale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resalesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resales.eligible });
      queryClient.invalidateQueries({ queryKey: queryKeys.resales.mine });
    },
  });
}

export function useCancelResale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resalesApi.cancel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.resales.mine }),
  });
}

export function useDeleteResale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resalesApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.resales.mine }),
  });
}
