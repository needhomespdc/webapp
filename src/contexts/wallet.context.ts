// Kept apart from the provider component so React Fast Refresh can hot-reload the provider
// file (a file that exports both components and other values forces a full reload).
import { createContext, useContext } from 'react';
import type { Wallet } from '@/types';

export interface WalletContextValue {
  wallet: Wallet | null;
  isLoadingWallet: boolean;
  refreshWallet: () => void;
}

export const WalletContext = createContext<WalletContextValue | null>(null);

export function useWalletContext() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWalletContext must be used within WalletProvider');
  return ctx;
}
