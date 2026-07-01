import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { investmentsApi } from '@/api/investments.api';
import { queryKeys } from '@/lib/queryKeys';

export function useInvestmentList(page = 1, limit = 10) {
  const query = useQuery({
    queryKey: queryKeys.investments.list(page),
    queryFn: () => investmentsApi.list(page, limit),
  });

  return {
    investments: query.data?.data ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useInvestmentDetail(investmentId: string | undefined) {
  const query = useQuery({
    queryKey: queryKeys.investments.detail(investmentId ?? ''),
    queryFn: () => investmentsApi.getById(investmentId!).then((data) => data),
    enabled: !!investmentId,
  });

  return { investment: query.data, isLoading: query.isLoading, error: query.error };
}

export function usePortfolioPerformance(period = '1y') {
  const query = useQuery({
    queryKey: queryKeys.investments.performance(period),
    queryFn: () => investmentsApi.getPerformance(period).then((r) => r.data),
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
