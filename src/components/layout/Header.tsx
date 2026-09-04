import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { RiMenuLine, RiLogoutBoxLine, RiUserLine, RiArrowDownSLine, RiVerifiedBadgeLine, RiShieldCheckLine, RiCustomerService2Line, RiLinksLine } from 'react-icons/ri';
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

  const initials = user?.role === 'investor' && user.investorType === 'corporate'
    ? (user.companyName ?? 'C').charAt(0).toUpperCase()
    : `${(user?.firstName ?? '').charAt(0)}${(user?.lastName ?? '').charAt(0)}`.toUpperCase() || '?';

  const isVerified = user?.role === 'investor' && user?.kycStatus === 'approved';

  const notifPath = user?.role === 'investor' ? '/investor/notifications' : user?.role === 'partner' ? '/partner/notifications' : "/";
  const profilePath = user?.role === 'investor' ? '/investor/profile' : user?.role === 'partner' ? '/partner/profile' : "/";

  const showKycBanner   = user?.role === 'partner' && user?.kycStatus !== 'approved';
  const showShareBanner = user?.role === 'partner' && user?.kycStatus === 'approved';

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
          <a href={user?.role === 'partner' ? '/partner/dashboard' : '/investor/dashboard'} className="flex items-center lg:hidden">
            <img src="/logo/logo-hero-white.png" alt="NeedHomes Logo" className="w-30 hidden dark:block" />
            <img src="/logo/needhomes-logo.png" alt="NeedHomes Logo" className="w-30 dark:hidden" />
          </a>
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
                <span className="relative shrink-0">
                  <span className="w-9 h-9 rounded-full bg-accent/15 text-accent flex items-center justify-center text-sm font-bold overflow-hidden">
                    {user?.profilePictureUrl
                      ? <img src={user.profilePictureUrl} alt={displayName} className="w-full h-full object-cover" />
                      : initials}
                  </span>
                  {isVerified && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap flex items-center gap-0.5 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                      <RiVerifiedBadgeLine className="text-[9px]" />
                      Verified
                    </span>
                  )}
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
          <SheetContent side="left" className="w-68 p-0 flex flex-col">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>

            {/* Logo strip */}
            <div className="px-4 py-4 border-b border-foreground/5 flex items-center">
              <img src="/logo/logo-hero-white.png" alt="NeedHomes" className="w-28 hidden dark:block" />
              <img src="/logo/needhomes-logo.png" alt="NeedHomes" className="w-28 dark:hidden" />
            </div>

            <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
              {menuItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
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

              {/* Share nudge — partner only, KYC approved */}
              {showShareBanner && (
                <div className="mt-3 rounded-2xl bg-primary p-4 flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <RiLinksLine className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold leading-snug">Share more. Earn more.</p>
                    <p className="text-white/55 text-xs mt-1 leading-snug">
                      Invite people to invest and earn attractive commissions.
                    </p>
                  </div>
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/partner/share'); }}
                    className="w-full bg-accent hover:bg-accent/90 text-white text-xs font-semibold rounded-xl py-2.5 transition-colors"
                  >
                    Share Now
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/partner/support'); }}
                    className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors"
                  >
                    <RiCustomerService2Line className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-[11px]">Need Help? Chat with our support team</span>
                  </button>
                </div>
              )}

              {/* KYC nudge — partner only, not yet approved */}
              {showKycBanner && (
                <div className="mt-3 rounded-2xl bg-primary p-4 flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <RiShieldCheckLine className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold leading-snug">Verify Your Account</p>
                    <p className="text-white/55 text-xs mt-1 leading-snug">
                      Complete KYC to increase your withdrawal limit and access exclusive partner benefits.
                    </p>
                  </div>
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/partner/kyc'); }}
                    className="w-full bg-accent hover:bg-accent/90 text-white text-xs font-semibold rounded-xl py-2.5 transition-colors"
                  >
                    Start Verification
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/partner/support'); }}
                    className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors"
                  >
                    <RiCustomerService2Line className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-[11px]">Need Help? Chat with our support team</span>
                  </button>
                </div>
              )}
            </nav>

            <div className="px-2 py-3 border-t border-foreground/5">
              <button
                onClick={() => { setMenuOpen(false); setLogoutOpen(true); }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-400/5 transition-all"
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
