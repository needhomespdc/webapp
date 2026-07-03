import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useRouteError } from 'react-router-dom';
import {
  RiErrorWarningLine,
  RiHome4Line,
  RiRefreshLine,
  RiLockLine,
  RiServerLine,
  RiWifiOffLine,
} from 'react-icons/ri';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/fetchClient';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

type ErrorCategory = 'auth' | 'server' | 'network' | 'generic';

interface ErrorMeta {
  category: ErrorCategory;
  title: string;
  description: string;
}

function categorise(error: Error): ErrorMeta {
  if (error instanceof ApiError) {
    const { status, message } = error;

    if (status === 401 || status === 403) {
      return {
        category: 'auth',
        title: status === 403 ? 'Access denied' : 'Session expired',
        description:
          message ||
          (status === 403
            ? "You don't have permission to view this page."
            : 'Your session has expired. Please log in again.'),
      };
    }

    if (status >= 500) {
      return {
        category: 'server',
        title: 'Server error',
        description:
          message || 'Our servers are having trouble right now. Please try again in a moment.',
      };
    }

    if (status === 404) {
      return {
        category: 'generic',
        title: 'Resource not found',
        description: message || 'The requested data could not be found.',
      };
    }

    return {
      category: 'generic',
      title: 'Request failed',
      description: message || `An error occurred (code ${status}).`,
    };
  }

  // TypeError: Failed to fetch → network / offline
  if (
    error instanceof TypeError &&
    (error.message.toLowerCase().includes('fetch') ||
      error.message.toLowerCase().includes('network'))
  ) {
    return {
      category: 'network',
      title: 'No internet connection',
      description: 'Unable to reach the server. Please check your connection and try again.',
    };
  }

  return {
    category: 'generic',
    title: 'Something went wrong',
    description:
      error.message ||
      'This page hit an unexpected error. Try reloading — if it keeps happening, contact support.',
  };
}

const ICON: Record<ErrorCategory, ReactNode> = {
  auth: <RiLockLine className="h-8 w-8 text-amber-400" />,
  server: <RiServerLine className="h-8 w-8 text-red-400" />,
  network: <RiWifiOffLine className="h-8 w-8 text-blue-400" />,
  generic: <RiErrorWarningLine className="h-8 w-8 text-red-400" />,
};

const ICON_BG: Record<ErrorCategory, string> = {
  auth: 'bg-amber-500/10',
  server: 'bg-red-500/10',
  network: 'bg-blue-500/10',
  generic: 'bg-red-500/10',
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      const meta = categorise(this.state.error);

      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="mb-8">
            <img
              src="/logo/needhomes-logo.png"
              alt="NeedHomes"
              className="h-8 w-fit mx-auto dark:hidden"
            />
            <img
              src="/logo/logo-hero-white.png"
              alt="NeedHomes"
              className="h-8 w-fit mx-auto hidden dark:block"
            />
          </div>

          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 ${ICON_BG[meta.category]}`}>
            {ICON[meta.category]}
          </div>

          <h1 className="text-xl font-bold text-foreground">{meta.title}</h1>
          <p className="text-foreground/50 text-sm mt-2 max-w-xs">{meta.description}</p>

          {import.meta.env.DEV && (
            <pre className="mt-4 text-left text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-4 max-w-sm w-full overflow-x-auto">
              {this.state.error.stack ?? this.state.error.message}
            </pre>
          )}

          <div className="flex items-center gap-3 mt-8">
            {meta.category === 'auth' ? (
              <Button size="sm" onClick={() => window.location.assign('/login')}>
                <RiHome4Line className="h-4 w-4" />
                Go to login
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => window.location.assign('/')}>
                  <RiHome4Line className="h-4 w-4" />
                  Go home
                </Button>
                <Button size="sm" onClick={() => window.location.reload()}>
                  <RiRefreshLine className="h-4 w-4" />
                  Reload
                </Button>
              </>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ─── Route-level error page (used as React Router errorElement) ───────────────

function toError(raw: unknown): Error {
  if (raw instanceof Error) return raw;
  if (raw && typeof raw === 'object' && 'status' in raw) {
    const res = raw as { status: number; statusText?: string; data?: unknown };
    return new ApiError(res.status, res.data, res.statusText ?? `HTTP ${res.status}`);
  }
  return new Error(String(raw));
}

export function RouteErrorPage() {
  const raw = useRouteError();
  const meta = categorise(toError(raw));

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-8">
        <img src="/logo/needhomes-logo.png" alt="NeedHomes" className="h-8 w-fit mx-auto dark:hidden" />
        <img src="/logo/logo-hero-white.png" alt="NeedHomes" className="h-8 w-fit mx-auto hidden dark:block" />
      </div>

      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 ${ICON_BG[meta.category]}`}>
        {ICON[meta.category]}
      </div>

      <h1 className="text-xl font-bold text-foreground">{meta.title}</h1>
      <p className="text-foreground/50 text-sm mt-2 max-w-xs">{meta.description}</p>

      {import.meta.env.DEV && raw instanceof Error && (
        <pre className="mt-4 text-left text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-4 max-w-sm w-full overflow-x-auto">
          {raw.stack ?? raw.message}
        </pre>
      )}

      <div className="flex items-center gap-3 mt-8">
        {meta.category === 'auth' ? (
          <Button size="sm" onClick={() => window.location.assign('/login')}>
            <RiHome4Line className="h-4 w-4" />
            Go to login
          </Button>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={() => window.location.assign('/')}>
              <RiHome4Line className="h-4 w-4" />
              Go home
            </Button>
            <Button size="sm" onClick={() => window.location.reload()}>
              <RiRefreshLine className="h-4 w-4" />
              Reload
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
