import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { RiLogoutBoxLine } from 'react-icons/ri';
import { useAuth } from '@/hooks/useAuth';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { cn } from '@/lib/utils';
import type { NavItem } from './AppShell';

interface SidebarProps {
  navItems: NavItem[];
}

export function Sidebar({ navItems }: SidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } finally {
      setLoggingOut(false);
      setLogoutOpen(false);
    }
  };

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-card border-r border-foreground/5 z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-foreground/5 flex items-center">
        <img src="/logo/logo-hero-white.png" alt="NeedHomes Logo" className="w-30 hidden dark:block" />
        <img src="/logo/needhomes-logo.png" alt="NeedHomes Logo" className="w-30 dark:hidden" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-accent/15 text-accent'
                  : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className="text-xl">
                  {isActive && item.activeIcon ? item.activeIcon : item.icon}
                </span>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-foreground/5">
        <button
          onClick={() => setLogoutOpen(true)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground/60 hover:text-red-400 hover:bg-red-400/5 transition-all w-full"
        >
          <RiLogoutBoxLine className="text-xl" />
          <span>Logout</span>
        </button>
      </div>

      <ConfirmModal
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Log out of NeedHomes?"
        description="You'll need to sign in again to access your dashboard."
        confirmLabel="Logout"
        variant="destructive"
        isLoading={loggingOut}
        onConfirm={handleLogout}
      />
    </aside>
  );
}
