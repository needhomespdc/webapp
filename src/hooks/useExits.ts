import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { exitsApi } from '@/api/exits.api';
import { queryKeys } from '@/lib/queryKeys';

export function useEligibleExits() {
  const query = useQuery({
    queryKey: queryKeys.exits.eligible,
    queryFn: () => exitsApi.getEligible(),
  });

  return { eligible: query.data ?? [], isLoading: query.isLoading };
}

export function useExitList(filter = 'history') {
  const query = useQuery({
    queryKey: queryKeys.exits.list,
    queryFn: () => exitsApi.list(filter),
  });

  return {
    exits: query.data?.data ?? [],
    summary: query.data?.summary ?? { completedCount: 0, pendingCount: 0 },
    isLoading: query.isLoading,
  };
}

export function useExitDetail(exitId: string | undefined) {
  const query = useQuery({
    queryKey: queryKeys.exits.detail(exitId ?? ''),
    queryFn: () => exitsApi.getById(exitId!).then((r) => {
      const raw = r as unknown as Record<string, unknown>;
      return (raw.data ?? raw) as import('@/types').ExitDetail;
    }),
    enabled: !!exitId,
  });

  return { exit: query.data, isLoading: query.isLoading };
}

export function useCreateExit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: exitsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exits.eligible });
      queryClient.invalidateQueries({ queryKey: queryKeys.exits.list });
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.all });
    },
  });
}

export function useCancelExit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: exitsApi.cancel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.exits.list }),
  });
}
