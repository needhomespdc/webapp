// Kept apart from the provider component so React Fast Refresh can hot-reload the provider
// file (a file that exports both components and other values forces a full reload).
import { createContext } from 'react';
import type { User } from '@/types';

export interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string>;
  updateProfile: (data: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
