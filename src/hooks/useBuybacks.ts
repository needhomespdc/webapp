import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { buybacksApi } from '@/api/buybacks.api';
import { queryKeys } from '@/lib/queryKeys';

export function useEligibleBuybacks() {
  const query = useQuery({
    queryKey: queryKeys.buybacks.eligible,
    queryFn: () => buybacksApi.getEligible(),
  });
  return { eligible: query.data ?? [], isLoading: query.isLoading };
}

export function useMyBuybacks() {
  const query = useQuery({
    queryKey: queryKeys.buybacks.mine,
    queryFn: () => buybacksApi.listMine(),
  });
  return { buybacks: query.data ?? [], isLoading: query.isLoading };
}

export function useBuybackDetail(id: string | undefined) {
  const query = useQuery({
    queryKey: queryKeys.buybacks.detail(id ?? ''),
    queryFn: () => buybacksApi.getById(id!),
    enabled: !!id,
  });
  return { buyback: query.data, isLoading: query.isLoading };
}

export function useCancelBuyback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: buybacksApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buybacks.mine });
      queryClient.invalidateQueries({ queryKey: queryKeys.buybacks.eligible });
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.all });
    },
  });
}

export function useCreateBuyback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: buybacksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.buybacks.mine });
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.all });
    },
  });
}
