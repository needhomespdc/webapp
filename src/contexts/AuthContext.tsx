import { createContext, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import authApi from '@/api/auth.api';
import {
  setAccessToken,
  setRefreshToken,
  refreshAccessToken as performRefresh,
  setUnauthorizedHandler,
  unwrapEnvelope,
} from '@/lib/fetchClient';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const storeToken = useCallback((token: string | null) => {
    setTokenState(token);
    setAccessToken(token);
  }, []);

  // Delegates to the single canonical refresh implementation in fetchClient.ts
  // (it dedupes concurrent calls itself via a shared in-flight promise), then
  // syncs the result into React state so isAuthenticated reacts correctly.
  const refreshToken = useCallback(async (): Promise<string> => {
    const token = await performRefresh();
    storeToken(token);
    return token;
  }, [storeToken]);

  // Attempt to restore the session on mount. The refresh token only lives in
  // memory (set on login) — it does not persist across a full page reload,
  // so this will fail fast with "No refresh token available" on a fresh load
  // and the user lands on /login. That's expected given the backend reads
  // the refresh token from the request body, not an httpOnly cookie.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refreshToken();
        const res = await authApi.getMe();
        if (!cancelled) setUser(unwrapEnvelope<User>(res));
      } catch {
        if (!cancelled) storeToken(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshToken, storeToken]);

  // When a request's silent-refresh-then-retry also fails (refresh token itself expired),
  // clear local state reactively — route guards redirect to /login, no manual navigation needed.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      storeToken(null);
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, [storeToken]);

  const login = useCallback(
    async (email: string, password: string, rememberMe = false) => {
      const res = await authApi.login({ email, password, rememberMe });
      const {
        accessToken: token,
        refreshToken: refreshTokenFromResponse,
        user: loggedInUser,
      } = unwrapEnvelope<{ accessToken: string; refreshToken: string; user: User }>(res);
      setRefreshToken(refreshTokenFromResponse, rememberMe);
      storeToken(token);
      setUser(loggedInUser);
    },
    [storeToken]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    setRefreshToken(null);
    storeToken(null);
    setUser(null);
  }, [storeToken]);

  const updateProfile = useCallback((data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!accessToken && !!user,
        isLoading,
        login,
        logout,
        refreshToken,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
