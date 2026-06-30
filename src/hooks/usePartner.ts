import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { partnersApi } from '@/api/partners.api';
import { queryKeys } from '@/lib/queryKeys';

export function usePromotableProperties(page = 1, limit = 10) {
  const query = useQuery({
    queryKey: queryKeys.partner.properties(page),
    queryFn: () => partnersApi.getPromotableProperties(page, limit),
  });

  return {
    properties: query.data?.data ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
  };
}

export function useReferralAnalytics(period = '30d') {
  const query = useQuery({
    queryKey: queryKeys.partner.analytics(period),
    queryFn: () => partnersApi.getReferralAnalytics(period).then((r) => r.data),
  });

  return { analytics: query.data, isLoading: query.isLoading };
}

export function useCommissionWallet() {
  const query = useQuery({
    queryKey: queryKeys.partner.wallet,
    queryFn: () => partnersApi.getCommissionWallet().then((r) => r.data),
    refetchInterval: 60_000,
  });

  return { wallet: query.data, isLoading: query.isLoading };
}

export function useCommissionEntries(page = 1, limit = 10) {
  const query = useQuery({
    queryKey: queryKeys.partner.commissions(page),
    queryFn: () => partnersApi.getCommissionEntries(page, limit),
  });

  return {
    entries: query.data?.data ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
  };
}

export function useRequestCommissionPayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: partnersApi.requestPayout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.partner.wallet });
      queryClient.invalidateQueries({ queryKey: queryKeys.partner.commissions(1) });
    },
  });
}
