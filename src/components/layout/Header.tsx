import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { RiMenuLine, RiLogoutBoxLine, RiUserLine, RiArrowDownSLine } from 'react-icons/ri';
import { HiOutlineBell } from 'react-icons/hi2';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
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

  const displayName =
    user?.role === 'partner'
      ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
      : user?.investorType === 'corporate'
      ? (user.companyName ?? 'Corporate')
      : `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

  const initials = (displayName || user?.email || '?').trim().charAt(0).toUpperCase();

  const notifPath = user?.role === 'investor' ? '/investor/notifications' : user?.role === 'partner' ? '/partner/notifications' : "/";
  const profilePath = user?.role === 'investor' ? '/investor/profile' : user?.role === 'partner' ? '/partner/profile' : "/";

  // Notifications and Profile are reached via this header (bell + dropdown), not the mobile menu.
  const menuItems = navItems.filter((item) => item.label !== 'Notifications');

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 h-14 bg-background/95 backdrop-blur border-b border-foreground/5">
        {/* Left — hamburger, then logo. Both mobile-only; desktop already has the sidebar. */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 -ml-2 text-foreground/60 hover:text-foreground transition-colors lg:hidden"
          >
            <RiMenuLine className="h-5 w-5" />
          </button>
          <div className="flex items-center lg:hidden">
            <img src="/logo/logo-hero-white.png" alt="NeedHomes Logo" className="w-30 hidden dark:block" />
            <img src="/logo/needhomes-logo.png" alt="NeedHomes Logo" className="w-30 dark:hidden" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <ThemeToggle />

          <button
            onClick={() => navigate(notifPath)}
            className="relative p-2 text-foreground/60 hover:text-foreground transition-colors"
          >
            <HiOutlineBell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-accent rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Profile — avatar-only on mobile (where the hamburger used to sit), avatar + name on desktop */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 pl-1 pr-1 lg:pr-2 py-1 rounded-xl hover:bg-foreground/5 transition-colors">
                <span className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center text-sm font-semibold shrink-0">
                  {initials}
                </span>
                <span className="hidden lg:flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground max-w-30 truncate">
                    {displayName || 'Account'}
                  </span>
                  <RiArrowDownSLine className="h-4 w-4 text-foreground/50" />
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-foreground truncate">{displayName || 'Account'}</p>
                <p className="text-xs text-foreground/40 truncate">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(profilePath)}>
                <RiUserLine className="h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setLogoutOpen(true)}
                className="text-red-400 focus:bg-red-400/10 focus:text-red-400"
              >
                <RiLogoutBoxLine className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                        : 'text-foreground/70 hover:text-foreground hover:bg-foreground/5'
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

            <div className="border-t border-foreground/5 pt-2 space-y-1">
              <NavLink
                to={profilePath}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 w-full px-3 py-3 rounded-xl transition-all',
                    isActive ? 'bg-accent/15 text-accent' : 'text-foreground/70 hover:text-foreground hover:bg-foreground/5'
                  )
                }
              >
                <RiUserLine className="h-5 w-5 shrink-0" />
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium truncate">{displayName || 'Profile'}</p>
                  <p className="text-xs text-foreground/40 truncate">{user?.email}</p>
                </div>
              </NavLink>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setLogoutOpen(true);
                }}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-red-400 hover:bg-red-400/5 transition-all"
              >
                <RiLogoutBoxLine className="h-5 w-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

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
    </>
  );
}
