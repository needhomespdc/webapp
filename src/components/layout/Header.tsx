import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { RiMenuLine, RiLogoutBoxLine, RiUserLine } from 'react-icons/ri';
import { HiOutlineBell } from 'react-icons/hi2';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { cn } from '@/lib/utils';
import type { NavItem } from './AppShell';

interface HeaderProps {
  navItems: NavItem[];
}

export function Header({ navItems }: HeaderProps) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotificationContext();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName =
    user?.role === 'partner'
      ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
      : user?.investorType === 'corporate'
      ? (user.companyName ?? 'Corporate')
      : `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

  const notifPath = user?.role === 'investor' ? '/investor/notifications' : '/partner/notifications';
  const profilePath = user?.role === 'investor' ? '/investor/profile' : '/partner/profile';

  // Notifications stays reachable via the bell icon below, not in this menu.
  const menuItems = navItems.filter((item) => item.label !== 'Notifications');

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/5 lg:hidden">
      {/* Logo */}
      <div className="flex items-center">
        <img src="/logo/logo-hero-white.png" alt="NeedHomes Logo" className="w-30" />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(notifPath)}
          className="relative p-2 text-white/60 hover:text-white transition-colors"
        >
          <HiOutlineBell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-accent rounded-full text-[10px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setMenuOpen(true)}
          className="p-2 text-white/60 hover:text-white transition-colors"
        >
          <RiMenuLine className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile menu sheet — left side, full nav */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-72 flex flex-col">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>

          <nav className="flex-1 mt-2 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-accent/15 text-accent'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
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

          <div className="border-t border-white/5 pt-2 space-y-1">
            <NavLink
              to={profilePath}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 w-full px-3 py-3 rounded-xl transition-all',
                  isActive ? 'bg-accent/15 text-accent' : 'text-white/70 hover:text-white hover:bg-white/5'
                )
              }
            >
              <RiUserLine className="h-5 w-5 shrink-0" />
              <div className="text-left min-w-0">
                <p className="text-sm font-medium truncate">{displayName || 'Profile'}</p>
                <p className="text-xs text-white/40 truncate">{user?.email}</p>
              </div>
            </NavLink>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-red-400 hover:bg-red-400/5 transition-all"
            >
              <RiLogoutBoxLine className="h-5 w-5" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
