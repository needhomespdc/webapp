import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  RiBriefcaseLine,
  RiArrowRightLine,
  RiAlertLine,
  RiLineChartLine,
  RiMapPinLine,
  RiEyeLine,
  RiEyeOffLine,
} from 'react-icons/ri';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolioPerformance, useInvestmentList } from '@/hooks/useInvestment';
import { useWallet, useWalletTransactions } from '@/hooks/useWallet';
import { cn, formatCurrency, formatRelativeDate } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getGreeting } from '@/utils/helpers';
import { HiArrowTrendingDown, HiArrowTrendingUp } from 'react-icons/hi2';

export default function InvestorDashboard() {
  const { user } = useAuth();

  const { performance: performanceData, isLoading: perfLoading } = usePortfolioPerformance('past_6_months');
  const { wallet: walletData, isLoading: walletLoading } = useWallet();
  const { investments: investmentsData, isLoading: invLoading } = useInvestmentList(1, 3);
  const { transactions: txData } = useWalletTransactions(1, 5);

  const displayName =
    user?.investorType === 'corporate'
      ? (user.companyName ?? 'Investor')
      : (user?.firstName ?? 'Investor');

  const [showValues, setShowValues] = useState({ walletBalance: true, portfolioValue: true, activeInvestments: true, totalReturns: true });
  const toggleValue = (key: keyof typeof showValues) => setShowValues((v) => ({ ...v, [key]: !v[key] }));

  const kycApproved = user?.kycStatus === 'approved';
  const hasBothRecent = !!investmentsData?.length && !!txData?.length;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {getGreeting()}, {displayName} 👋
        </h1>
        <p className="text-foreground/50 text-sm mt-1">Here's your investment overview.</p>
      </div>

      {/* KYC banner */}
      {!kycApproved && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <RiAlertLine className="text-amber-400 h-5 w-5 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-amber-400 text-sm font-medium">
              {user?.kycStatus === 'pending'
                ? 'Your KYC is under review.'
                : user?.kycStatus === 'rejected'
                ? 'Your KYC was rejected. Please re-submit.'
                : 'Complete KYC to unlock investments and withdrawals.'}
            </p>
          </div>
          {user?.kycStatus !== 'pending' && (
            <Link to="/investor/kyc">
              <Button size="sm" variant="outline" className="shrink-0 border-amber-500/50 text-amber-400">
                {user?.kycStatus === 'rejected' ? 'Re-submit' : 'Complete KYC'}
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Invest CTA banner */}
      <Link
        to="/investor/invest"
        className="group relative block rounded-2xl overflow-hidden min-h-[160px] sm:min-h-[180px]"
      >
        <img
          src="/resources/invest-hero-house.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-linear-to-r from-primary/95 via-primary/80 to-primary/30" />
        <div className="relative z-10 flex flex-col justify-center w-full h-full p-4 sm:p-6">
          <h2 className="text-white text-xl sm:text-2xl font-bold leading-tight">
            Grow your wealth through real estate
          </h2>
          <p className="text-white/70 text-sm mt-2">
            Explore fractional ownership, land banking, and more — start with as little as
            ₦50,000.
          </p>
          <span className="inline-flex items-center gap-2 bg-accent text-white text-sm font-bold px-5 py-2.5 rounded-xl mt-4 w-fit hover:bg-[#d45a1e] transition-colors">
            <RiLineChartLine className="h-4 w-4" />
            Invest Now
          </span>
        </div>
      </Link>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardContent className="p-4 pb-7 relative z-10">
            <div className="flex items-center justify-between mb-1">
              <p className="text-foreground/50 text-xs">Wallet Balance</p>
              <button onClick={() => toggleValue('walletBalance')} className="text-foreground/30 hover:text-foreground/60 transition-colors">
                {showValues.walletBalance ? <RiEyeLine className="h-3.5 w-3.5" /> : <RiEyeOffLine className="h-3.5 w-3.5" />}
              </button>
            </div>
            {walletLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : showValues.walletBalance ? (
              <CurrencyDisplay amount={walletData?.availableBalance ?? 0} size="lg" className="text-foreground" />
            ) : (
              <p className="text-xl font-bold text-foreground/30 tracking-widest">••••••</p>
            )}
          </CardContent>
          <svg viewBox="0 0 120 40" preserveAspectRatio="none" className="absolute bottom-0 right-0 w-3/4 h-10 pointer-events-none">
            <defs>
              <linearGradient id="cg1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style={{ stopColor: '#F97316', stopOpacity: 0.45 }} />
                <stop offset="100%" style={{ stopColor: '#F97316', stopOpacity: 0 }} />
              </linearGradient>
            </defs>
            <path d="M 0,38 C 20,36 30,28 45,25 C 60,22 65,30 80,24 C 95,18 105,14 120,11 L 120,40 L 0,40 Z" fill="url(#cg1)" />
            <path d="M 0,38 C 20,36 30,28 45,25 C 60,22 65,30 80,24 C 95,18 105,14 120,11" fill="none" style={{ stroke: '#F97316', strokeOpacity: 0.9 }} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-4 pb-7 relative z-10">
            <div className="flex items-center justify-between mb-1">
              <p className="text-foreground/50 text-xs">Portfolio Value</p>
              <button onClick={() => toggleValue('portfolioValue')} className="text-foreground/30 hover:text-foreground/60 transition-colors">
                {showValues.portfolioValue ? <RiEyeLine className="h-3.5 w-3.5" /> : <RiEyeOffLine className="h-3.5 w-3.5" />}
              </button>
            </div>
            {perfLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : showValues.portfolioValue ? (
              <CurrencyDisplay amount={performanceData?.totalPortfolioValue ?? 0} size="lg" className="text-foreground" />
            ) : (
              <p className="text-xl font-bold text-foreground/30 tracking-widest">••••••</p>
            )}
          </CardContent>
          <svg viewBox="0 0 120 40" preserveAspectRatio="none" className="absolute bottom-0 right-0 w-3/4 h-10 pointer-events-none">
            <defs>
              <linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style={{ stopColor: '#F97316', stopOpacity: 0.45 }} />
                <stop offset="100%" style={{ stopColor: '#F97316', stopOpacity: 0 }} />
              </linearGradient>
            </defs>
            <path d="M 0,37 C 18,34 28,27 44,24 C 60,21 66,29 82,23 C 97,17 108,13 120,10 L 120,40 L 0,40 Z" fill="url(#cg2)" />
            <path d="M 0,37 C 18,34 28,27 44,24 C 60,21 66,29 82,23 C 97,17 108,13 120,10" fill="none" style={{ stroke: '#F97316', strokeOpacity: 0.9 }} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-4 pb-7 relative z-10">
            <div className="flex items-center justify-between mb-1">
              <p className="text-foreground/50 text-xs">Active Investments</p>
              <button onClick={() => toggleValue('activeInvestments')} className="text-foreground/30 hover:text-foreground/60 transition-colors">
                {showValues.activeInvestments ? <RiEyeLine className="h-3.5 w-3.5" /> : <RiEyeOffLine className="h-3.5 w-3.5" />}
              </button>
            </div>
            {perfLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : showValues.activeInvestments ? (
              <p className="text-2xl font-bold text-foreground">{performanceData?.activeInvestments ?? 0}</p>
            ) : (
              <p className="text-xl font-bold text-foreground/30 tracking-widest">••</p>
            )}
          </CardContent>
          <svg viewBox="0 0 120 40" preserveAspectRatio="none" className="absolute bottom-0 right-0 w-3/4 h-10 pointer-events-none">
            <defs>
              <linearGradient id="cg3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style={{ stopColor: '#F97316', stopOpacity: 0.45 }} />
                <stop offset="100%" style={{ stopColor: '#F97316', stopOpacity: 0 }} />
              </linearGradient>
            </defs>
            <path d="M 0,36 C 22,33 32,26 48,23 C 64,20 70,28 86,22 C 100,16 108,13 120,11 L 120,40 L 0,40 Z" fill="url(#cg3)" />
            <path d="M 0,36 C 22,33 32,26 48,23 C 64,20 70,28 86,22 C 100,16 108,13 120,11" fill="none" style={{ stroke: '#F97316', strokeOpacity: 0.9 }} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-4 pb-7 relative z-10">
            <div className="flex items-center justify-between mb-1">
              <p className="text-foreground/50 text-xs">Total Returns</p>
              <button onClick={() => toggleValue('totalReturns')} className="text-foreground/30 hover:text-foreground/60 transition-colors">
                {showValues.totalReturns ? <RiEyeLine className="h-3.5 w-3.5" /> : <RiEyeOffLine className="h-3.5 w-3.5" />}
              </button>
            </div>
            {perfLoading ? (
              <Skeleton className="h-7 w-28" />
            ) : showValues.totalReturns ? (
              <CurrencyDisplay amount={performanceData?.returnsEarned ?? 0} size="lg" className="text-foreground" />
            ) : (
              <p className="text-xl font-bold text-foreground/30 tracking-widest">••••••</p>
            )}
          </CardContent>
          <svg viewBox="0 0 120 40" preserveAspectRatio="none" className="absolute bottom-0 right-0 w-3/4 h-10 pointer-events-none">
            <defs>
              <linearGradient id="cg4" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style={{ stopColor: '#F97316', stopOpacity: 0.45 }} />
                <stop offset="100%" style={{ stopColor: '#F97316', stopOpacity: 0 }} />
              </linearGradient>
            </defs>
            <path d="M 0,38 C 16,35 26,29 42,26 C 58,23 64,30 80,24 C 95,18 106,14 120,10 L 120,40 L 0,40 Z" fill="url(#cg4)" />
            <path d="M 0,38 C 16,35 26,29 42,26 C 58,23 64,30 80,24 C 95,18 106,14 120,10" fill="none" style={{ stroke: '#F97316', strokeOpacity: 0.9 }} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        <Link to="/investor/marketplace">
          <Card className="hover:border-accent/40 transition-colors cursor-pointer">
            <CardContent className="p-2.5 flex items-center gap-3 flex-col sm:flex-row">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
                <RiStore2LineIcon />
              </div>
              <div className="hidden sm:block">
                <p className="text-foreground text-sm font-semibold">Explore</p>
                <p className="text-foreground/50 text-xs">Browse properties</p>
              </div>
              <div className="sm:hidden">
                <p className="text-foreground text-xs font-semibold">Explore</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/investor/wallet">
          <Card className="hover:border-accent/40 transition-colors cursor-pointer">
            <CardContent className="p-2.5 flex items-center gap-3 flex-col sm:flex-row">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
                <RiWalletIcon />
              </div>
              <div className="hidden sm:block">
                <p className="text-foreground text-sm font-semibold">Fund Wallet</p>
                <p className="text-foreground/50 text-xs">Top up balance</p>
              </div>
              <div className="sm:hidden">
                <p className="text-foreground text-xs font-semibold">Fund Wallet</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/investor/favorites">
          <Card className="hover:border-accent/40 transition-colors cursor-pointer">
            <CardContent className="p-2.5 flex items-center gap-3 flex-col sm:flex-row">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
                <RiHeartIcon />
              </div>
              <div className="hidden sm:block">
                <p className="text-foreground text-sm font-semibold">Favorites</p>
                <p className="text-foreground/50 text-xs">Saved properties</p>
              </div>
              <div className="sm:hidden">
                <p className="text-foreground text-xs font-semibold">Favorites</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent investments + transactions — side-by-side once both have data */}
      <div className={cn(hasBothRecent && 'grid grid-cols-1 lg:grid-cols-2 gap-6')}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Investments</CardTitle>
            <Link to="/investor/portfolio" className="text-accent text-sm font-medium flex items-center gap-1 hover:underline">
              View all <RiArrowRightLine className="h-4 w-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0 p-3">
          {invLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : !investmentsData?.length ? (
            <div className="text-center py-8">
              <RiBriefcaseLine className="h-10 w-10 text-foreground/20 mx-auto mb-2" />
              <p className="text-foreground/50 text-sm">No investments yet.</p>
              <Link to="/investor/marketplace">
                <Button variant="default" size="sm" className="mt-3">
                  Browse Marketplace
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {investmentsData.map((inv) => (
                <Link
                  key={inv.id}
                  to={`/investor/portfolio/${inv.id}`}
                  className="flex items-center gap-3 py-2"
                >
                  {/* Image with model-type badge */}
                  <div className="relative w-[72px] h-[72px] rounded-xl overflow-hidden shrink-0">
                    {inv.propertyImageUrl ? (
                      <img src={inv.propertyImageUrl} alt={inv.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-accent/10 flex items-center justify-center">
                        <RiBriefcaseLine className="text-accent h-6 w-6" />
                      </div>
                    )}
                    <span className="absolute top-1.5 left-1.5 bg-black/50 backdrop-blur text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-tight">
                      {inv?.typeLabel == "Co-development" ? "Co-Dev" : inv?.typeLabel}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-0.5 flex-wrap">
                      <p className="text-foreground text-sm font-bold truncate">{inv.title}</p>

                      <div className="flex items-center gap-1 mt-0.5">
                        <RiMapPinLine className="text-foreground/40 h-3 w-3" />
                        <p className="text-foreground/50 text-xs truncate">{inv.location}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-0 mt-0.5 sm:mt-2 pt-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground/40 text-[10px]">Units Owned</p>
                        <p className="text-foreground text-xs font-bold mt-0.5">{inv.unitsOwnedLabel}</p>
                      </div>
                      <div className="w-px h-6 bg-foreground/10 mx-2" />
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground/40 text-[10px]">Current Value</p>
                        <p className="text-foreground text-xs font-bold mt-0.5">{formatCurrency(inv.currentValue)}</p>
                      </div>

                      {inv.projectMilestoneLabel && (
                        <>
                          <div className="hidden sm:block w-px h-6 bg-foreground/10 mx-2" />
                          <div className="hidden sm:block flex-1 min-w-0">
                            <p className="text-foreground/40 text-[10px]">Project Milestone</p>
                            <p className="text-foreground text-xs font-bold mt-0.5 truncate">{inv.projectMilestoneLabel}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent transactions */}
      {txData && txData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Transactions</CardTitle>
              <Link to="/investor/wallet" className="text-accent text-sm font-medium flex items-center gap-1 hover:underline">
                View all <RiArrowRightLine className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-3">
            {txData?.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 py-2 rounded-xl">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  tx.isCredit ? 'bg-green-600/15 text-green-400' : 'bg-accent/15 text-accent'
                }`}>
                  {tx.isCredit ? (
                    <HiArrowTrendingDown className="h-4 w-4" />
                  ) : (
                    <HiArrowTrendingUp className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm font-medium truncate">{tx.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-foreground/50 text-xs truncate min-w-0">{tx.subtitle}</p>
                    <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      tx.isCredit ? 'bg-green-600/15 text-green-400' : 'bg-accent/15 text-accent'
                    }`}>
                      {tx.isCredit ? 'Money In' : 'Money Out'}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold ${tx.isCredit ? 'text-green-400' : 'text-foreground'}`}>
                    {tx.isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                  <p className="text-foreground/50 text-xs mt-0.5">{formatRelativeDate(tx.createdAt)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}

function RiStore2LineIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 21V3h10v18H1zM13 21V7h10v14H13zM3 5h2v3H3zM7 5h2v3H7zM3 10h2v3H3zM7 10h2v3H7zM3 15h2v3H3zM7 15h2v3H7zM15 9h2v3h-2zM19 9h2v3h-2zM15 14h2v3h-2zM19 14h2v3h-2z"
      />
    </svg>
  );
}

function RiWalletIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M22 7h1v10h-1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h19a1 1 0 0 1 1 1v3zm-2 10h-6a5 5 0 0 1 0-10h6V5H3v14h17v-2zm1-2V9h-7a3 3 0 0 0 0 6h7zm-7-4h3v2h-3v-2z" />
    </svg>
  );
}

function RiHeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M12 20.703l-.343.302a1 1 0 0 0 .686 0L12 20.703zm0 0l.343.302L12 20.703zm0 0C5.5 15.5 2 11.954 2 8.5 2 5.42 4.42 3 7.5 3c1.742 0 3.344.87 4.5 2.265C13.156 3.87 14.758 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.454-3.5 7-10 12.203z" />
    </svg>
  );
}
