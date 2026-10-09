import { useCallback } from 'react';
import { WalletContext } from './wallet.context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { walletApi } from '@/api/wallet.api';
import { useAuth } from '@/hooks/useAuth';


export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['wallet', 'me'],
    queryFn: () => walletApi.getWallet(),
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
