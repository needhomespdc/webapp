import { createContext, useContext, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { walletApi } from '@/api/wallet.api';
import { useAuth } from '@/hooks/useAuth';
import type { Wallet } from '@/types';

interface WalletContextValue {
  wallet: Wallet | null;
  isLoadingWallet: boolean;
  refreshWallet: () => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['wallet', 'me'],
    queryFn: () => walletApi.getWallet().then((r) => r.data),
    enabled: isAuthenticated && user?.role === 'investor',
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const refreshWallet = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['wallet', 'me'] });
  }, [queryClient]);

  return (
    <WalletContext.Provider
      value={{ wallet: data ?? null, isLoadingWallet: isLoading, refreshWallet }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWalletContext must be used within WalletProvider');
  return ctx;
}
