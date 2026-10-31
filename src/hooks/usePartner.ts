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

// GET /properties/by-slug has no commission fields; only the promotable-properties list carries
// estimatedCommission and commissionRatePercent, so look the property up there (paging until found).
export function usePromotableCommission(slug: string | undefined) {
  const query = useQuery({
    queryKey: queryKeys.partner.commission(slug ?? ''),
    queryFn: async () => {
      for (let page = 1; ; page++) {
        const res = await partnersApi.getPromotableProperties(page, 50);
        const match = res.data.find((p) => p.slug === slug);
        if (match) {
          return {
            estimatedCommission: match.estimatedCommission,
            commissionRatePercent: match.commissionRatePercent,
          };
        }
        if (page >= (res.pagination?.totalPages ?? 1)) return null;
      }
    },
    enabled: !!slug,
    staleTime: 5 * 60_000,
  });

  return {
    estimatedCommission: query.data?.estimatedCommission,
    commissionRatePercent: query.data?.commissionRatePercent,
    isLoading: query.isLoading,
  };
}

export function useReferralAnalytics(period = '30d') {
  const query = useQuery({
    queryKey: queryKeys.partner.analytics(period),
    queryFn: () => partnersApi.getReferralAnalytics(period),
  });

  return { analytics: query.data, isLoading: query.isLoading };
}

// Tokens live 72 hours; refresh well before that so shared links stay valid.
export function useReferralTrackingToken(propertySlug: string, enabled = true) {
  const query = useQuery({
    queryKey: queryKeys.partner.trackingToken(propertySlug),
    queryFn: () => partnersApi.mintReferralTrackingToken(propertySlug || undefined),
    enabled,
    staleTime: 12 * 60 * 60_000,
    retry: false,
  });

  return { trackingToken: query.data?.trackingToken, isLoading: query.isLoading };
}

export function useCommissionWallet() {
  const query = useQuery({
    queryKey: queryKeys.partner.wallet,
    queryFn: () => partnersApi.getCommissionWallet(),
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

export function useCommissionEntry(id: string | null) {
  const query = useQuery({
    queryKey: queryKeys.partner.commissionEntry(id!),
    queryFn: () => partnersApi.getCommissionEntry(id!),
    enabled: !!id,
  });
  return { entry: query.data, isLoading: query.isLoading };
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
