import { useNavigate } from 'react-router-dom';
import { RiArrowLeftLine, RiHome4Line } from 'react-icons/ri';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function NotFound() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const homePath = isAuthenticated
    ? user?.role === 'partner'
      ? '/partner/dashboard'
      : '/investor/dashboard'
    : '/login';

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

      <div className="relative mb-6 select-none">
        <p className="text-[120px] sm:text-[160px] font-black text-foreground/5 leading-none">
          404
        </p>
        <p className="absolute inset-0 flex items-center justify-center text-5xl sm:text-6xl font-black text-accent leading-none">
          404
        </p>
      </div>

      <h1 className="text-xl sm:text-2xl font-bold text-foreground">Page not found</h1>
      <p className="text-foreground/50 text-sm mt-2 max-w-xs">
        The page you're looking for doesn't exist or may have been moved.
      </p>

      <div className="flex items-center gap-3 mt-8">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <RiArrowLeftLine className="h-4 w-4" />
          Go back
        </Button>
        <Button size="sm" onClick={() => navigate(homePath, { replace: true })}>
          <RiHome4Line className="h-4 w-4" />
          Go home
        </Button>
      </div>
    </div>
  );
}
