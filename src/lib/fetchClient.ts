const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://api.needhomes.ng/api';
const REFRESH_TOKEN_STORAGE_KEY = 'needhomes_refresh_token';

function readPersistedRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

let accessToken: string | null = null;
// Seed from localStorage so a page reload can restore a "remembered" session.
let refreshTokenValue: string | null = readPersistedRefreshToken();
let refreshTokenIsPersisted = refreshTokenValue !== null;
let refreshPromise: Promise<string> | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * The backend's POST /auth/refresh expects `{ refreshToken }` in the request
 * body (confirmed via a live 400 "refreshToken should not be empty" response)
 * — it does not read it from an httpOnly cookie despite CLAUDE.md's docs.
 * The token itself comes back in the login response body, so the client must
 * hold onto it and send it explicitly on every refresh.
 *
 * Pass `persist: true` (set by AuthContext when "Remember Me" was checked at
 * login) to also write it to localStorage so the session survives a reload.
 * Otherwise it's memory-only and a reload requires a fresh login.
 */
export function setRefreshToken(token: string | null, persist = false) {
  refreshTokenValue = token;
  refreshTokenIsPersisted = persist && token !== null;
  try {
    if (refreshTokenIsPersisted) {
      localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token!);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    }
  } catch {
    // localStorage unavailable (e.g. private browsing) — falls back to memory-only.
  }
}

export function getRefreshToken(): string | null {
  return refreshTokenValue;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export class ApiError extends Error {
  status: number;
  response: { status: number; data: unknown };

  constructor(status: number, data: unknown, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = { status, data };
  }
}

function getMessage(body: unknown): string | undefined {
  return (body as { message?: string } | null)?.message;
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function buildHeaders(options: RequestInit): Headers {
  const headers = new Headers(options.headers);
  const isFormData = options.body instanceof FormData;
  if (!isFormData && options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  return headers;
}

async function rawFetch(path: string, options: RequestInit): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options),
    credentials: 'include',
  });
}

const NO_REFRESH_PATHS = ['/auth/refresh', '/auth/login', '/auth/register'];

type RefreshTokenBody = {
  data?: { accessToken?: string; refreshToken?: string };
  accessToken?: string;
  refreshToken?: string;
} | null;

/**
 * Single canonical implementation of the refresh call, used both by the
 * automatic 401-retry path below and by AuthContext's explicit mount-time
 * refresh. Previously these were two separate implementations that drifted
 * out of sync — this one is the only one that should ever call /auth/refresh.
 */
export async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      if (!refreshTokenValue) {
        throw new ApiError(401, null, 'No refresh token available');
      }
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });
      const body = await parseBody(res);
      if (!res.ok) {
        throw new ApiError(res.status, body, getMessage(body) ?? 'Session expired');
      }
      const data = body as RefreshTokenBody;
      const token = data?.data?.accessToken ?? data?.accessToken ?? '';
      const rotatedRefreshToken = data?.data?.refreshToken ?? data?.refreshToken;
      accessToken = token;
      // Preserve whatever persistence choice was made at login when rotating.
      if (rotatedRefreshToken) setRefreshToken(rotatedRefreshToken, refreshTokenIsPersisted);
      return token;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const res = await rawFetch(path, options);

  if (res.status === 401 && !isRetry && !NO_REFRESH_PATHS.includes(path)) {
    try {
      await refreshAccessToken();
      return request<T>(path, options, true);
    } catch (err) {
      accessToken = null;
      setRefreshToken(null);
      onUnauthorized?.();
      throw err;
    }
  }

  const body = await parseBody(res);
  if (!res.ok) {
    throw new ApiError(res.status, body, getMessage(body) ?? `Request failed with status ${res.status}`);
  }
  return body as T;
}

async function requestBlob(path: string, options: RequestInit = {}, isRetry = false): Promise<Blob> {
  const res = await rawFetch(path, options);

  if (res.status === 401 && !isRetry) {
    try {
      await refreshAccessToken();
      return requestBlob(path, options, true);
    } catch (err) {
      accessToken = null;
      setRefreshToken(null);
      onUnauthorized?.();
      throw err;
    }
  }

  if (!res.ok) {
    const body = await parseBody(res);
    throw new ApiError(res.status, body, getMessage(body) ?? `Request failed with status ${res.status}`);
  }
  return res.blob();
}

function jsonBody(data: unknown): BodyInit | undefined {
  if (data === undefined) return undefined;
  if (data instanceof FormData) return data;
  return JSON.stringify(data);
}

export const api = {
  get: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, data?: unknown, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'POST', body: jsonBody(data) }),

  patch: <T>(path: string, data?: unknown, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'PATCH', body: jsonBody(data) }),

  put: <T>(path: string, data?: unknown, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'PUT', body: jsonBody(data) }),

  delete: <T>(path: string, data?: unknown, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'DELETE', body: jsonBody(data) }),

  getBlob: (path: string, options?: RequestInit) => requestBlob(path, { ...options, method: 'GET' }),
};

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.response.data && getMessage(err.response.data) ? getMessage(err.response.data)! : err.message || fallback;
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}

/**
 * Some endpoints return the documented `{ success, message, data }` envelope;
 * others (e.g. /auth/login) return the payload flat with no `data` wrapper.
 * Unwrap defensively so callers don't have to guess which shape they got.
 */
export function unwrapEnvelope<T>(res: unknown): T {
  if (res && typeof res === 'object' && 'data' in res && (res as { data?: unknown }).data !== undefined) {
    return (res as { data: T }).data;
  }
  return res as T;
}
