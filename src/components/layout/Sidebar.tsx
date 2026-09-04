import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { RiLogoutBoxLine, RiShieldCheckLine, RiCustomerService2Line, RiArrowDownSLine, RiLinksLine } from 'react-icons/ri';
import { useAuth } from '@/hooks/useAuth';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { cn } from '@/lib/utils';
import type { NavItem } from './AppShell';

interface SidebarProps {
  navItems: NavItem[];
}

export function Sidebar({ navItems }: SidebarProps) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const location = useLocation();
  const isWalletRoute = location.pathname.includes('/wallet');

  const showKycBanner   = user?.role === 'partner' && user?.kycStatus !== 'approved';
  const showShareBanner = user?.role === 'partner' && user?.kycStatus === 'approved';

  const showInvestorKycBanner    = user?.role === 'investor' && user?.kycStatus !== 'approved';
  const showMarketplaceBanner    = user?.role === 'investor' && !isWalletRoute;
  const showAddFundsBanner       = user?.role === 'investor' && isWalletRoute;
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const check = () => {
      setHasOverflow(el.scrollHeight > el.clientHeight + 4);
      setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
    };
    check();
    el.addEventListener('scroll', check);
    window.addEventListener('resize', check);
    return () => { el.removeEventListener('scroll', check); window.removeEventListener('resize', check); };
  }, [navItems, showKycBanner, showShareBanner, showInvestorKycBanner, showMarketplaceBanner, showAddFundsBanner]);

  const scrollToBottom = () =>
    navRef.current?.scrollTo({ top: navRef.current.scrollHeight, behavior: 'smooth' });
  const scrollToTop = () =>
    navRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

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

      {/* Nav wrapper — relative so the floating scroll button sits inside */}
      <div className="flex-1 relative min-h-0">
        <nav
          ref={navRef}
          className="h-full px-3 py-4 space-y-1 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
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

          {/* Share nudge — shown once KYC is approved */}
          {showShareBanner && (
            <div className="mt-4 rounded-2xl bg-primary p-4 flex flex-col gap-3">
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
                onClick={() => navigate('/partner/share')}
                className="w-full bg-accent hover:bg-accent/90 text-white text-xs font-semibold rounded-xl py-2.5 transition-colors"
              >
                Share Now
              </button>
              <button
                onClick={() => navigate('/partner/support')}
                className="flex items-top gap-2 text-white/50 hover:text-white/80 transition-colors"
              >
                <RiCustomerService2Line className="h-3.5 w-3.5 shrink-0" />
                <span className="text-[11px]">Need Help? Chat with our support team</span>
              </button>
            </div>
          )}

          {/* KYC verification nudge — partners only, hidden once approved */}
          {showKycBanner && (
            <div className="mt-4 rounded-2xl bg-primary p-4 flex flex-col gap-3">
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
                onClick={() => navigate('/partner/kyc')}
                className="w-full bg-accent hover:bg-accent/90 text-white text-xs font-semibold rounded-xl py-2.5 transition-colors"
              >
                Start Verification
              </button>
              <button
                onClick={() => navigate('/partner/support')}
                className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors"
              >
                <RiCustomerService2Line className="h-3.5 w-3.5 shrink-0" />
                <span className="text-[11px]">Need Help? Chat with our support team</span>
              </button>
            </div>
          )}

          {/* ── Investor banners ─────────────────────────────── */}

          {/* KYC nudge — investors, persists on all routes until approved */}
          {showInvestorKycBanner && (
            <div className="mt-4 rounded-2xl border border-accent/25 bg-accent/8 p-4 flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                  <RiShieldCheckLine className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-foreground text-sm font-bold leading-snug">Verify Your Identity</p>
                  <p className="text-foreground/55 text-xs mt-1 leading-snug">
                    Complete KYC to unlock your full investment potential.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/investor/kyc')}
                className="w-full bg-accent hover:bg-accent/90 text-white text-xs font-semibold rounded-xl py-2.5 transition-colors"
              >
                Start Verification
              </button>
              <button
                onClick={() => navigate('/investor/support')}
                className="flex items-center gap-2 text-foreground/40 hover:text-foreground/70 transition-colors"
              >
                <RiCustomerService2Line className="h-3.5 w-3.5 shrink-0" />
                <span className="text-[11px]">Need Help? Chat with our support team</span>
              </button>
            </div>
          )}

          {/* Explore Marketplace nudge — investors, all routes except wallet */}
          {showMarketplaceBanner && (
            <div className="mt-4 rounded-2xl bg-card border border-foreground/10 overflow-hidden">
              <div className="p-4">
                <p className="text-foreground text-sm font-bold leading-snug">Invest in your future</p>
                <p className="text-foreground/50 text-xs mt-1.5 leading-snug">
                  Start building wealth with secure real estate investments.
                </p>
                <button
                  onClick={() => navigate('/investor/marketplace')}
                  className="mt-3 w-full bg-accent hover:bg-accent/90 text-white text-xs font-semibold rounded-xl py-2.5 transition-colors"
                >
                  Explore Marketplace
                </button>
              </div>
              <img
                src="/resources/invest-hero-house.png"
                alt=""
                aria-hidden
                className="w-full object-cover"
              />
            </div>
          )}

          {/* Add Funds nudge — investors, wallet route only */}
          {showAddFundsBanner && (
            <div className="mt-4 rounded-2xl bg-primary overflow-hidden">
              <div className="p-4">
                <p className="text-white text-sm font-bold leading-snug">Grow your portfolio with more opportunities</p>
                <p className="text-white/55 text-xs mt-1.5 leading-snug">
                  Add funds to invest in high-yield properties.
                </p>
                <button
                  onClick={() => navigate('/investor/wallet')}
                  className="mt-3 w-full bg-accent hover:bg-accent/90 text-white text-xs font-semibold rounded-xl py-2.5 transition-colors"
                >
                  Add Funds Now
                </button>
              </div>
              <img
                src="/resources/wallet-hero.png"
                alt=""
                aria-hidden
                className="w-50 h-50 text-center object-cover"
              />
            </div>
          )}
        </nav>

        {/* Floating scroll button — toggles between down and up */}
        {hasOverflow && (
          <button
            onClick={canScrollDown ? scrollToBottom : scrollToTop}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-card border border-foreground/10 shadow-sm rounded-full px-3 py-1.5 text-foreground/50 transition-all"
          >
            <RiArrowDownSLine className={cn('h-3.5 w-3.5 transition-transform', !canScrollDown && 'rotate-180')} />
            <span className="text-[11px] font-medium">{canScrollDown ? 'Scroll down' : 'Scroll up'}</span>
          </button>
        )}
      </div>

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
