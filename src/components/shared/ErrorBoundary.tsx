import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RiErrorWarningLine } from 'react-icons/ri';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

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
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <RiErrorWarningLine className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-foreground text-lg font-semibold">Something went wrong</h1>
            <p className="text-foreground/50 text-sm mt-2">
              This page hit an unexpected error. Try reloading — if it keeps happening, let us know.
            </p>
            <Button className="mt-5" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
