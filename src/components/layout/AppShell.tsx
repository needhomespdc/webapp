import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppShellProps {
  navItems: NavItem[];
}

export interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
}

export function AppShell({ navItems }: AppShellProps) {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop fixed left sidebar. On mobile, Header renders the equivalent menu in a left-side sheet. */}
      <Sidebar navItems={navItems} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        <Header navItems={navItems} />
        <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden pb-6">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
