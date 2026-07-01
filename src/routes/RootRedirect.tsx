import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function RootRedirect() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Navigate to={user?.role === 'partner' ? '/partner/dashboard' : '/investor/dashboard'} replace />;
}
