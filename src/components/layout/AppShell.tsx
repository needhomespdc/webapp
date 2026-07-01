import { Outlet } from 'react-router-dom';
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
  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop fixed left sidebar. On mobile, Header renders the equivalent menu in a left-side sheet. */}
      <Sidebar navItems={navItems} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        <Header navItems={navItems} />
        <main className="flex-1 overflow-y-auto pb-6">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
