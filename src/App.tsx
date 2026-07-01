import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { queryClient } from '@/lib/queryClient';
import { router } from '@/routes';

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <WalletProvider>
            <NotificationProvider>
              <ErrorBoundary>
                <RouterProvider router={router} />
              </ErrorBoundary>
              <Toaster />
            </NotificationProvider>
          </WalletProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
