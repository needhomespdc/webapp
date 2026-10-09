const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://api.needhomes.ng/api';
const REFRESH_TOKEN_STORAGE_KEY = 'needhomes_refresh_token';

/**
 * Where the refresh token lives depends on "Remember me" at login:
 * - ticked   → localStorage: survives closing the tab/browser and is shared by every tab,
 *              for as long as the backend's refresh token lasts (30 days when rememberMe is true)
 * - unticked → sessionStorage: this tab only, gone when the tab closes
 * Rotated tokens stay in whichever storage the session started in.
 */
type TokenStorage = 'local' | 'session';

function storageFor(kind: TokenStorage): Storage {
  return kind === 'local' ? localStorage : sessionStorage;
}

function readPersistedRefreshToken(): { token: string | null; kind: TokenStorage } {
  try {
    const remembered = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
    if (remembered) return { token: remembered, kind: 'local' };
    return { token: sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY), kind: 'session' };
  } catch {
    return { token: null, kind: 'session' };
  }
}

let accessToken: string | null = null;
// Seed from storage so a page reload (or, when remembered, a new tab or browser restart)
// can restore the session.
const persisted = readPersistedRefreshToken();
let refreshTokenValue: string | null = persisted.token;
let refreshTokenStorage: TokenStorage = persisted.kind;
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
 * Pass `remember` at login to choose the storage (see above); later calls (token rotation)
 * keep the current choice. `null` clears the token from both storages (logout / expired).
 */
export function setRefreshToken(token: string | null, remember?: boolean) {
  refreshTokenValue = token;
  if (remember !== undefined) refreshTokenStorage = remember ? 'local' : 'session';
  try {
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    if (token) storageFor(refreshTokenStorage).setItem(REFRESH_TOKEN_STORAGE_KEY, token);
  } catch {
    // Storage unavailable (e.g. some private browsing modes) — falls back to memory-only.
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

/**
 * The request never got a proper answer: no internet, DNS failure, timeout or a dropped
 * connection. Kept separate from ApiError so a flaky network is never mistaken for an
 * expired session (which used to log users out on every network blip).
 */
export class NetworkError extends Error {
  constructor(message = 'Unable to reach NeedHomes. Check your internet connection and try again.') {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * True only when the server itself refused the refresh token (expired, revoked or missing).
 * Network failures and server-side errors (5xx) are NOT a reason to end the session.
 */
export function isSessionRejected(err: unknown): boolean {
  return err instanceof ApiError && [400, 401, 403].includes(err.status);
}

// fetch() rejects with a TypeError when the network fails; turn that into a NetworkError
async function safeFetch(input: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new NetworkError();
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
  return safeFetch(`${BASE_URL}${path}`, {
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
      const res = await safeFetch(`${BASE_URL}/auth/refresh`, {
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
      if (!token) throw new ApiError(401, body, 'Session expired');
      const rotatedRefreshToken = data?.data?.refreshToken ?? data?.refreshToken;
      accessToken = token;
      if (rotatedRefreshToken) setRefreshToken(rotatedRefreshToken);
      return token;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/**
 * Get a fresh access token after a 401. Logs the user out ONLY if the server rejected the
 * refresh token; a network failure or server error is rethrown so the caller can show a
 * "connection problem" message while the user stays signed in (the next action retries).
 */
async function refreshOrEndSession(): Promise<void> {
  try {
    await refreshAccessToken();
  } catch (err) {
    if (isSessionRejected(err)) {
      accessToken = null;
      setRefreshToken(null);
      onUnauthorized?.();
    }
    throw err;
  }
}

async function request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const res = await rawFetch(path, options);

  if (res.status === 401 && !isRetry && !NO_REFRESH_PATHS.includes(path)) {
    await refreshOrEndSession();
    return request<T>(path, options, true);
  }

  const body = await parseBody(res);
  if (!res.ok) {
    throw new ApiError(res.status, body, getMessage(body) ?? `Request failed with status ${res.status}`);
  }
  return body as T;
}

async function requestBlob(path: string, options: RequestInit = {}, isRetry = false): Promise<Blob> {
  const res = await rawFetch(path, options);

  if (res.status === 401 && !isRetry && !NO_REFRESH_PATHS.includes(path)) {
    await refreshOrEndSession();
    return requestBlob(path, options, true);
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
