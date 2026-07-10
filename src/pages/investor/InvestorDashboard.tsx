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
  const { investments: investmentsData, isLoading: invLoading } = useInvestmentList(1, 5);
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
          src="/resources/woman-with-card.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-linear-to-r from-primary/95 via-primary/80 to-primary/30" />
        <div className="relative z-10 flex flex-col justify-center w-full h-full p-6 sm:p-8">
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
            <path d="M 0,36 L 10,32 L 14,37 L 20,26 L 24,18 L 28,28 L 36,22 L 42,30 L 50,20 L 56,24 L 64,16 L 70,22 L 80,17 L 90,24 L 100,14 L 112,20 L 120,16 L 120,40 L 0,40 Z" fill="url(#cg1)" />
            <path d="M 0,36 L 10,32 L 14,37 L 20,26 L 24,18 L 28,28 L 36,22 L 42,30 L 50,20 L 56,24 L 64,16 L 70,22 L 80,17 L 90,24 L 100,14 L 112,20 L 120,16" fill="none" style={{ stroke: '#F97316', strokeOpacity: 0.9 }} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
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
            <path d="M 0,38 L 8,30 L 12,36 L 18,22 L 22,15 L 26,26 L 32,30 L 38,20 L 44,28 L 50,17 L 54,13 L 58,24 L 66,28 L 74,18 L 82,24 L 92,14 L 104,22 L 120,13 L 120,40 L 0,40 Z" fill="url(#cg2)" />
            <path d="M 0,38 L 8,30 L 12,36 L 18,22 L 22,15 L 26,26 L 32,30 L 38,20 L 44,28 L 50,17 L 54,13 L 58,24 L 66,28 L 74,18 L 82,24 L 92,14 L 104,22 L 120,13" fill="none" style={{ stroke: '#F97316', strokeOpacity: 0.9 }} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
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
            <path d="M 0,36 L 12,30 L 18,34 L 26,26 L 34,30 L 40,21 L 46,16 L 50,26 L 58,20 L 66,28 L 74,18 L 80,24 L 88,15 L 94,22 L 104,17 L 112,22 L 120,15 L 120,40 L 0,40 Z" fill="url(#cg3)" />
            <path d="M 0,36 L 12,30 L 18,34 L 26,26 L 34,30 L 40,21 L 46,16 L 50,26 L 58,20 L 66,28 L 74,18 L 80,24 L 88,15 L 94,22 L 104,17 L 112,22 L 120,15" fill="none" style={{ stroke: '#F97316', strokeOpacity: 0.9 }} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
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
            <path d="M 0,38 L 6,30 L 10,38 L 16,23 L 20,14 L 24,28 L 30,21 L 34,34 L 40,18 L 44,12 L 48,26 L 56,18 L 62,30 L 68,16 L 74,24 L 82,13 L 92,21 L 104,15 L 112,21 L 120,12 L 120,40 L 0,40 Z" fill="url(#cg4)" />
            <path d="M 0,38 L 6,30 L 10,38 L 16,23 L 20,14 L 24,28 L 30,21 L 34,34 L 40,18 L 44,12 L 48,26 L 56,18 L 62,30 L 68,16 L 74,24 L 82,13 L 92,21 L 104,15 L 112,21 L 120,12" fill="none" style={{ stroke: '#F97316', strokeOpacity: 0.9 }} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link to="/investor/marketplace">
          <Card className="hover:border-accent/40 transition-colors cursor-pointer">
            <CardContent className="p-2.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
                <RiStore2LineIcon />
              </div>
              <div>
                <p className="text-foreground text-sm font-semibold">Explore</p>
                <p className="text-foreground/50 text-xs">Browse properties</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/investor/wallet">
          <Card className="hover:border-accent/40 transition-colors cursor-pointer">
            <CardContent className="p-2.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
                <RiWalletIcon />
              </div>
              <div>
                <p className="text-foreground text-sm font-semibold">Fund Wallet</p>
                <p className="text-foreground/50 text-xs">Top up balance</p>
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
        <CardContent className="pt-0">
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
      <path d="M21 11.646V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9.354A3.985 3.985 0 0 1 2 9V3a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v6c0 .738-.202 1.430-.546 2.022zM5 13.9V20h14v-6.1a4.027 4.027 0 0 1-2 .578 3.988 3.988 0 0 1-3-1.36 3.988 3.988 0 0 1-3 1.36 3.988 3.988 0 0 1-3-1.36 3.988 3.988 0 0 1-2 .782zM4 4v5a2 2 0 1 0 4 0V4H4zm6 0v5a2 2 0 1 0 4 0V4h-4zm6 0v5a2 2 0 1 0 4 0V4h-4z" />
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
