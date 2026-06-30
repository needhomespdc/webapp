import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RiCursorLine, RiUserAddLine, RiMoneyDollarCircleLine, RiArrowRightLine } from 'react-icons/ri';
import { useAuth } from '@/hooks/useAuth';
import { useReferralAnalytics, useCommissionWallet, useCommissionEntries } from '@/hooks/usePartner';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const PERIODS = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '1y', label: '1Y' },
];

export default function PartnerDashboard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('30d');

  const { analytics, isLoading: analyticsLoading } = useReferralAnalytics(period);
  const { wallet, isLoading: walletLoading } = useCommissionWallet();
  const { entries, isLoading: entriesLoading } = useCommissionEntries(1, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome, {user?.firstName} 👋</h1>
        <p className="text-white/50 text-sm mt-1">Track your referrals and commission earnings.</p>
      </div>

      {/* Commission wallet */}
      <Card>
        <CardContent className="p-5">
          <p className="text-white/50 text-xs mb-1">Commission Wallet Balance</p>
          {walletLoading ? (
            <Skeleton className="h-9 w-40" />
          ) : (
            <CurrencyDisplay amount={wallet?.balance ?? 0} size="xl" className="text-white" />
          )}
          <div className="flex items-center justify-between mt-3">
            <p className="text-white/40 text-xs">
              Total earned: {formatCurrency(wallet?.totalEarned ?? 0)}
            </p>
            <Link to="/partner/wallet">
              <Button size="sm">Withdraw</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Period filter */}
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              period === p.value
                ? 'bg-accent text-white border-accent'
                : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Analytics stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center text-accent mb-2">
              <RiCursorLine className="h-4 w-4" />
            </div>
            <p className="text-white/50 text-xs mb-1">Total Clicks</p>
            {analyticsLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <p className="text-2xl font-bold text-white">{analytics?.totalClicks ?? 0}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="w-9 h-9 rounded-xl bg-green-600/15 flex items-center justify-center text-green-400 mb-2">
              <RiUserAddLine className="h-4 w-4" />
            </div>
            <p className="text-white/50 text-xs mb-1">Conversions</p>
            {analyticsLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <p className="text-2xl font-bold text-white">{analytics?.totalConversions ?? 0}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
            <RiMoneyDollarCircleLine className="h-5 w-5" />
          </div>
          <div>
            <p className="text-white/50 text-xs">Lifetime Earnings</p>
            <CurrencyDisplay amount={analytics?.totalLifetimeEarnings ?? 0} size="lg" className="text-white" />
          </div>
        </CardContent>
      </Card>

      {/* Recent commissions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Commissions</CardTitle>
            <Link to="/partner/commissions" className="text-accent text-sm font-medium flex items-center gap-1 hover:underline">
              View all <RiArrowRightLine className="h-4 w-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {entriesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : !entries.length ? (
            <p className="text-white/50 text-sm text-center py-6">No commissions yet. Start sharing referral links!</p>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <RiMoneyDollarCircleLine className="text-accent h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{entry.propertyTitle}</p>
                    <p className="text-white/50 text-xs">{formatDate(entry.createdAt)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-green-400 text-sm font-semibold">+{formatCurrency(entry.commissionAmount)}</p>
                    <StatusBadge status={entry.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
