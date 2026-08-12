import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { investmentsApi } from '@/api/investments.api';
import { queryKeys } from '@/lib/queryKeys';

export function useInvestmentList(page = 1, limit = 10, status?: string) {
  const query = useQuery({
    queryKey: queryKeys.investments.list(page, status),
    queryFn: () => investmentsApi.list(page, limit, status),
  });

  return {
    investments: query.data?.data ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useInvestmentListFeed(status?: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.investments.feed(status ?? 'all'),
    queryFn: ({ pageParam }) => investmentsApi.list(pageParam as number, 10, status),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const p = lastPage?.pagination;
      if (!p) return undefined;
      return p.page < p.totalPages ? p.page + 1 : undefined;
    },
  });
}

export function useInvestmentDetail(investmentId: string | undefined) {
  const query = useQuery({
    queryKey: queryKeys.investments.detail(investmentId ?? ''),
    queryFn: () => investmentsApi.getById(investmentId!),
    enabled: !!investmentId,
  });

  return { investment: query.data, isLoading: query.isLoading, error: query.error };
}

export function usePortfolioPerformance(period = 'past_6_months') {
  const query = useQuery({
    queryKey: queryKeys.investments.performance(period),
    queryFn: () => investmentsApi.getPerformance(period),
  });

  return { performance: query.data, isLoading: query.isLoading, error: query.error };
}

export function useCheckoutInvestment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: investmentsApi.checkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.me });
    },
  });
}

export function usePayInstallment(investmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { transactionPin: string }) =>
      investmentsApi.payInstallment(investmentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.detail(investmentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.me });
    },
  });
}
