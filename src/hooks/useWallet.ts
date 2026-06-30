import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { walletApi } from '@/api/wallet.api';
import { queryKeys } from '@/lib/queryKeys';
import { useWalletContext } from '@/contexts/WalletContext';

export function useWallet() {
  const { wallet, isLoadingWallet, refreshWallet } = useWalletContext();
  return { wallet, isLoading: isLoadingWallet, refresh: refreshWallet };
}

export function useWalletTransactions(page = 1, limit = 10) {
  const query = useQuery({
    queryKey: queryKeys.wallet.transactions(page),
    queryFn: () => walletApi.getTransactions(page, limit),
  });

  return {
    transactions: query.data?.data ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useBankAccounts() {
  const query = useQuery({
    queryKey: queryKeys.wallet.bankAccounts,
    queryFn: () => walletApi.getBankAccounts().then((r) => r.data),
  });

  return { bankAccounts: query.data ?? [], isLoading: query.isLoading };
}

export function useTopUpWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: walletApi.topUp,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.wallet.me }),
  });
}

export function useWithdraw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: walletApi.withdraw,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.transactions(1) });
    },
  });
}

export function useAddBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: walletApi.addBankAccount,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.wallet.bankAccounts }),
  });
}

export function useRemoveBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: walletApi.removeBankAccount,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.wallet.bankAccounts }),
  });
}

export function useSetTransactionPin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: walletApi.setPin,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.wallet.pinStatus }),
  });
}

export function useTransactionPinStatus() {
  const query = useQuery({
    queryKey: queryKeys.wallet.pinStatus,
    queryFn: () => walletApi.getPinStatus().then((r) => r.data),
  });

  return { isPinSet: query.data?.isPinSet ?? false, isLoading: query.isLoading };
}
