import type { ReactNode } from 'react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Image panel — hidden below lg, fixed full-height on desktop */}
      <div className="hidden lg:block relative lg:w-[42%] xl:w-[38%] shrink-0">
        <img
          src="/resources/woman-with-card.jpg"
          alt="Invest with NeedHomes"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-primary/90 via-primary/20 to-primary/10" />
        <div className="relative z-10 flex flex-col h-full p-10">
          <img src="/logo/logo-hero-white.png" alt="NeedHomes Logo" className="h-9 w-fit" />
          <div className="mt-auto text-white max-w-sm">
            <h2 className="text-3xl font-bold leading-tight">
              Smart real estate investment, simplified.
            </h2>
            <p className="text-white/70 text-sm mt-3">
              Join thousands of investors building wealth through fractional ownership, land
              banking, and curated property opportunities across Nigeria.
            </p>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col min-h-screen">
        <div className="flex items-center justify-between p-6 lg:p-8 lg:pb-0">
          <div className="lg:hidden">
            <img src="/logo/logo-hero-white.png" alt="NeedHomes Logo" className="h-9 hidden dark:block" />
            <img src="/logo/needhomes-logo.png" alt="NeedHomes Logo" className="h-9 dark:hidden" />
          </div>
          <div className="lg:ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex-1 flex flex-col">{children}</div>
      </div>
    </div>
  );
}
