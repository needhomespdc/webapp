import { createContext, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import authApi from '@/api/auth.api';
import {
  setAccessToken,
  setRefreshToken,
  refreshAccessToken as performRefresh,
  setUnauthorizedHandler,
  unwrapEnvelope,
  isSessionRejected,
} from '@/lib/fetchClient';
import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

// Shown when the app opens while NeedHomes can't be reached. The user's session is kept,
// so Retry signs them straight back in once the connection returns.
function ConnectionErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <WifiOff className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Can't reach NeedHomes</h1>
        <p className="mt-2 text-sm text-foreground/60">
          Check your internet connection and try again. You're still signed in.
        </p>
        <Button className="mt-6 w-full" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </div>
  );
}

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

  // True when restoring the session failed only because NeedHomes couldn't be reached
  // (offline, timeout, server error). The session itself is still valid, so instead of
  // dropping the user on /login we show a "can't connect" screen with a Retry button.
  const [connectionError, setConnectionError] = useState(false);
  const [restoreAttempt, setRestoreAttempt] = useState(0);

  // Attempt to restore the session on mount. The refresh token is persisted
  // in sessionStorage (see fetchClient.ts), so a reload restores it here. If
  // there's no persisted token, or the backend rejects it (expired/revoked),
  // this fails fast and the user lands on /login via the route guards.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refreshToken();
        const res = await authApi.getMe();
        if (!cancelled) setUser(unwrapEnvelope<User>(res));
      } catch (err) {
        if (cancelled) return;
        if (isSessionRejected(err)) {
          // Expired, revoked or no session at all: treat as signed out
          setRefreshToken(null);
          storeToken(null);
        } else {
          // Couldn't reach the server: keep the stored session and let the user retry
          storeToken(null);
          setConnectionError(true);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshToken, storeToken, restoreAttempt]);

  const retryRestore = useCallback(() => {
    setConnectionError(false);
    setIsLoading(true);
    setRestoreAttempt((n) => n + 1);
  }, []);

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
      // rememberMe is still sent to the backend (it may extend the issued
      // refresh token's server-side expiry) but no longer gates client-side
      // persistence — the refresh token is always kept in localStorage so a
      // reload restores the session regardless of this flag.
      const res = await authApi.login({ email, password, rememberMe });
      const {
        accessToken: token,
        refreshToken: refreshTokenFromResponse,
        user: loggedInUser,
      } = unwrapEnvelope<{ accessToken: string; refreshToken: string; user: User }>(res);
      setRefreshToken(refreshTokenFromResponse);
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
      {connectionError ? <ConnectionErrorScreen onRetry={retryRestore} /> : children}
    </AuthContext.Provider>
  );
}
