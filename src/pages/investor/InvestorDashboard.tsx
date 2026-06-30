import { Link } from 'react-router-dom';
import {
  RiArrowRightUpLine,
  RiBriefcaseLine,
  RiArrowRightLine,
  RiAlertLine,
} from 'react-icons/ri';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolioPerformance, useInvestmentList } from '@/hooks/useInvestment';
import { useWallet, useWalletTransactions } from '@/hooks/useWallet';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function InvestorDashboard() {
  const { user } = useAuth();

  const { performance: performanceData, isLoading: perfLoading } = usePortfolioPerformance('1y');
  const { wallet: walletData, isLoading: walletLoading } = useWallet();
  const { investments: investmentsData, isLoading: invLoading } = useInvestmentList(1, 5);
  const { transactions: txData } = useWalletTransactions(1, 5);

  const displayName =
    user?.investorType === 'corporate'
      ? (user.companyName ?? 'Investor')
      : (user?.firstName ?? 'Investor');

  const kycApproved = user?.kycStatus === 'approved';

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Good day, {displayName} 👋
        </h1>
        <p className="text-white/50 text-sm mt-1">Here's your investment overview.</p>
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

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-white/50 text-xs mb-1">Wallet Balance</p>
            {walletLoading ? (
              <Skeleton className="h-7 w-28 mt-1" />
            ) : (
              <CurrencyDisplay
                amount={walletData?.balance ?? 0}
                size="lg"
                className="text-white"
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-white/50 text-xs mb-1">Total Invested</p>
            {perfLoading ? (
              <Skeleton className="h-7 w-28 mt-1" />
            ) : (
              <CurrencyDisplay
                amount={performanceData?.totalInvested ?? 0}
                size="lg"
                className="text-white"
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-white/50 text-xs mb-1">Total Returns</p>
            {perfLoading ? (
              <Skeleton className="h-7 w-28 mt-1" />
            ) : (
              <CurrencyDisplay
                amount={performanceData?.totalReturns ?? 0}
                size="lg"
                className="text-green-400"
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-white/50 text-xs mb-1">Active Investments</p>
            {perfLoading ? (
              <Skeleton className="h-7 w-16 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-white">
                {performanceData?.activeCount ?? 0}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/investor/marketplace">
          <Card className="hover:border-accent/40 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
                <RiStore2LineIcon />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Explore</p>
                <p className="text-white/50 text-xs">Browse properties</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/investor/wallet">
          <Card className="hover:border-accent/40 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
                <RiWalletIcon />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Fund Wallet</p>
                <p className="text-white/50 text-xs">Top up balance</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent investments */}
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
              <RiBriefcaseLine className="h-10 w-10 text-white/20 mx-auto mb-2" />
              <p className="text-white/50 text-sm">No investments yet.</p>
              <Link to="/investor/marketplace">
                <Button variant="outline" size="sm" className="mt-3">
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
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <RiBriefcaseLine className="text-accent h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {inv.property?.title ?? 'Property'}
                    </p>
                    <p className="text-white/50 text-xs">
                      {inv.quantity} unit{inv.quantity !== 1 ? 's' : ''} · {formatDate(inv.createdAt)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white text-sm font-semibold">
                      {formatCurrency(inv.totalAmount)}
                    </p>
                    <StatusBadge status={inv.status} />
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
          <CardContent className="pt-0 space-y-3">
            {txData.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 px-3 py-2 rounded-xl">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  tx.type === 'deposit' || tx.type === 'commission'
                    ? 'bg-green-600/15 text-green-400'
                    : 'bg-red-500/15 text-red-400'
                }`}>
                  <RiArrowRightUpLine className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium capitalize truncate">{tx.type}</p>
                  <p className="text-white/50 text-xs">{formatDate(tx.createdAt)}</p>
                </div>
                <span className={`text-sm font-semibold ${
                  tx.type === 'deposit' || tx.type === 'commission'
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}>
                  {tx.type === 'deposit' || tx.type === 'commission' ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
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
