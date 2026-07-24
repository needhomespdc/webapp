import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  RiArrowRightLine,
  RiLinksLine,
  RiBuilding2Line,
  RiGroupLine,
  RiCheckboxCircleLine,
  RiCoinLine,
  RiPercentLine,
  RiHeartLine,
  RiArrowUpLine,
  RiMoneyDollarCircleLine,
  RiTimeLine,
  RiArrowDownSLine,
  RiCheckLine,
  RiInformationLine,
  RiEyeLine,
  RiEyeOffLine,
} from 'react-icons/ri';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { KYCStatusBanner } from '@/components/shared/KYCStatusBanner';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useReferralAnalytics, useCommissionWallet, useCommissionEntries } from '@/hooks/usePartner';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { getGreeting } from '@/utils/helpers';
import type { ReferralAnalytics, CommissionEntry } from '@/types';

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'all_time', label: 'All Time' },
];

const PERIOD_FROM_LABEL: Record<string, string> = {
  today: 'from yesterday',
  this_week: 'from last week',
  this_month: 'from last month',
  all_time: 'all time',
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  iconBg,
  label,
  value,
  sub,
  loading,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: React.ReactNode;
  sub: string;
  loading: boolean;
}) {
  return (
    <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4 flex flex-col gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-foreground/50 text-xs leading-none mb-1.5">{label}</p>
        {loading ? (
          <Skeleton className="h-6 w-20" />
        ) : (
          <p className="text-foreground font-bold text-lg leading-none">{value}</p>
        )}
        <p className="text-foreground/30 text-[10px] mt-1">{sub}</p>
      </div>
    </div>
  );
}

// ─── Performance Chart (Recharts) ────────────────────────────────────────────

function PerformanceChart({ data }: { data: ReferralAnalytics['clicksByPeriod'] }) {
  if (!data.length) {
    return (
      <div className="h-[160px] flex items-center justify-center">
        <p className="text-foreground/30 text-sm">No data for this period</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    clicks: d.clicks,
    label: formatDate(d.date, { month: 'short', day: 'numeric' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={chartData} margin={{ top: 10, right: 4, left: -28, bottom: 0 }}>
        <defs>
          <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#F97316" stopOpacity={0.28} />
            <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.4 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.4 }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.75rem',
            fontSize: '12px',
            padding: '6px 12px',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))', opacity: 0.5, marginBottom: 2 }}
          itemStyle={{ color: '#F97316', fontWeight: 600 }}
          formatter={(value) => [Number(value).toLocaleString(), 'Clicks']}
          cursor={{ stroke: '#F97316', strokeWidth: 1, strokeDasharray: '4 2', opacity: 0.5 }}
        />
        <Area
          type="monotone"
          dataKey="clicks"
          stroke="#F97316"
          strokeWidth={2}
          fill="url(#clicksGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#F97316', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Commission Status Badge ──────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-green-600/15 text-green-400',
  approved: 'bg-blue-500/15 text-blue-400',
  pending: 'bg-amber-500/15 text-amber-400',
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'Sale Completed',
  approved: 'Approved',
  pending: 'Pending',
};

// ─── Recent Sale Row ──────────────────────────────────────────────────────────

function SaleRow({ entry }: { entry: CommissionEntry }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-foreground/5 last:border-0">
      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
        <RiBuilding2Line className="text-accent h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-foreground text-sm font-semibold truncate">{entry.propertyTitle}</p>
        <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[entry.status] ?? STATUS_STYLES.pending}`}>
          {STATUS_LABELS[entry.status] ?? 'Pending'}
        </span>
      </div>
      <div className="text-right shrink-0">
        <p className="text-foreground/40 text-[10px]">You Earned</p>
        <p className="text-green-400 text-sm font-bold mt-0.5">+{formatCurrency(entry.amount)}</p>
        <p className="text-foreground/30 text-[10px] mt-0.5">{formatDate(entry.occurredAt, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PartnerDashboard() {
  const { user } = useAuth();
  const isMobile = useMediaQuery('(max-width: 639px)');
  const [period, setPeriod] = useState('this_month');
  const [periodOpen, setPeriodOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  const { analytics, isLoading: analyticsLoading } = useReferralAnalytics(period);
  // const { wallet, isLoading: walletLoading } = useCommissionWallet();
  const { isLoading: walletLoading } = useCommissionWallet();
  const { entries, isLoading: entriesLoading } = useCommissionEntries(1, 3);

  const periodLabel = PERIODS.find((p) => p.value === period)?.label ?? 'This Month';
  const conversionRate =
    analytics && analytics.totalClicks > 0
      ? ((analytics.totalConversions / analytics.totalClicks) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {getGreeting()}, {user?.firstName ?? 'Partner'} 👋
        </h1>
        <p className="text-foreground/50 text-sm mt-1">Promote, earn and grow on Needhomes.</p>
      </div>

      {user?.kycStatus && user.kycStatus !== 'approved' && (
        <KYCStatusBanner kycStatus={user.kycStatus} kycPath="/partner/kyc" />
      )}

      {/* Hero earnings card */}
      <div className="bg-primary rounded-2xl p-5 relative overflow-hidden">
        {/* Top row: label + period pill */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <p className="text-white/60 text-xs">Pending Earnings</p>
            <RiInformationLine className="h-3.5 w-3.5 text-white/30" />
          </div>
          <button
            onClick={() => setPeriodOpen(true)}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/15 text-white text-[11px] font-medium pl-3 pr-2.5 py-1 rounded-full border border-white/20 transition-colors"
          >
            {periodLabel}
            <RiArrowDownSLine className="h-3.5 w-3.5 text-white/50" />
          </button>
        </div>

        {/* Balance + eye toggle */}
        <div className="flex items-center gap-2 mb-2">
          {walletLoading ? (
            <Skeleton className="h-9 w-44 bg-white/10" />
          ) : showBalance ? (
            // <CurrencyDisplay amount={wallet?.balance ?? 0} size="xl" className="text-white" />
            <CurrencyDisplay amount={0} size="xl" className="text-white" />
          ) : (
            <p className="text-3xl font-black text-white/30 tracking-widest">••••••</p>
          )}
          <button
            onClick={() => setShowBalance((v) => !v)}
            className="text-white/40 hover:text-white/70 transition-colors ml-1 shrink-0"
          >
            {showBalance ? <RiEyeLine className="h-4 w-4" /> : <RiEyeOffLine className="h-4 w-4" />}
          </button>
        </div>

        {/* Trend sub-line */}
        <div className="flex items-center gap-1.5">
          <RiArrowUpLine className="text-accent h-3.5 w-3.5 shrink-0" />
          <p className="text-white/60 text-xs">
            <span className="text-accent font-semibold">{conversionRate}%</span>
            {' '}{PERIOD_FROM_LABEL[period] ?? 'from last month'}
          </p>
        </div>
      </div>

      {/* Stats row — horizontal scroll */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<RiGroupLine className="h-5 w-5" />}
          iconBg="bg-accent/15 text-accent"
          label="Total Referrals"
          value={analytics?.totalClicks ?? 0}
          sub={periodLabel}
          loading={analyticsLoading}
        />
        <StatCard
          icon={<RiCheckboxCircleLine className="h-5 w-5" />}
          iconBg="bg-green-600/15 text-green-400"
          label="Successful Sales"
          value={analytics?.totalConversions ?? 0}
          sub={periodLabel}
          loading={analyticsLoading}
        />
        <StatCard
          icon={<RiCoinLine className="h-5 w-5" />}
          iconBg="bg-violet-500/15 text-violet-400"
          label="Total Earned"
          value={<CurrencyDisplay amount={analytics?.totalLifetimeEarnings ?? 0} size="sm" className="text-foreground font-bold text-lg" />}
          sub="All Time"
          loading={analyticsLoading}
        />
        <StatCard
          icon={<RiPercentLine className="h-5 w-5" />}
          iconBg="bg-blue-500/15 text-blue-400"
          label="Conversion Rate"
          value={`${conversionRate}%`}
          sub={periodLabel}
          loading={analyticsLoading}
        />
      </div>

      {/* Quick actions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-foreground font-semibold text-base">Quick Actions</p>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <Link to="/partner/properties">
            <Card className="hover:border-accent/40 transition-colors cursor-pointer h-full">
              <CardContent className="p-3 flex flex-col items-center text-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-accent/15 flex items-center justify-center text-accent">
                  <RiLinksLine className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-xs font-semibold">Get Referral Link</p>
                  <p className="text-foreground/40 text-[10px] mt-0.5 leading-tight">Share your link</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/partner/properties">
            <Card className="hover:border-accent/40 transition-colors cursor-pointer h-full">
              <CardContent className="p-3 flex flex-col items-center text-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-accent/15 flex items-center justify-center text-accent">
                  <RiBuilding2Line className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-xs font-semibold">Browse Properties</p>
                  <p className="text-foreground/40 text-[10px] mt-0.5 leading-tight">Find to promote</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/partner/favorites">
            <Card className="hover:border-accent/40 transition-colors cursor-pointer h-full">
              <CardContent className="p-3 flex flex-col items-center text-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-accent/15 flex items-center justify-center text-accent">
                  <RiHeartLine className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-foreground text-xs font-semibold">Favorites</p>
                  <p className="text-foreground/40 text-[10px] mt-0.5 leading-tight">Saved properties</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Performance overview + Recent sales — side by side on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-foreground font-semibold text-base">Performance Overview</p>
              <button
                onClick={() => setPeriodOpen(true)}
                className="flex items-center gap-1.5 text-accent text-sm font-medium hover:opacity-80 transition-opacity"
              >
                <RiTimeLine className="h-3.5 w-3.5" />
                {periodLabel}
                <RiArrowDownSLine className="h-3.5 w-3.5" />
              </button>
            </div>

            {analyticsLoading ? (
              <Skeleton className="h-[140px] w-full" />
            ) : (
              <PerformanceChart data={analytics?.clicksByPeriod ?? []} />
            )}

            {/* Legend */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-foreground/10">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-accent inline-block" />
                  <p className="text-foreground/50 text-xs">Clicks</p>
                </div>
                <p className="text-foreground font-bold text-lg leading-none">{analytics?.totalClicks ?? 0}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                  <p className="text-foreground/50 text-xs">Sales</p>
                </div>
                <p className="text-foreground font-bold text-lg leading-none">{analytics?.totalConversions ?? 0}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-foreground/40 text-xs mb-1">Conv. Rate</p>
                <p className="text-accent font-bold text-lg leading-none">{conversionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-foreground font-semibold text-base">Recent Sales</p>
              <Link to="/partner/commissions" className="text-accent text-sm font-medium flex items-center gap-1 hover:underline">
                View All <RiArrowRightLine className="h-4 w-4" />
              </Link>
            </div>

            {entriesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : !entries.length ? (
              <div className="text-center py-8">
                <RiMoneyDollarCircleLine className="h-10 w-10 text-foreground/20 mx-auto mb-2" />
                <p className="text-foreground/50 text-sm">No sales yet.</p>
                <p className="text-foreground/30 text-xs mt-1">Start sharing referral links to earn commissions.</p>
              </div>
            ) : (
              <div>
                {entries.map((entry) => (
                  <SaleRow key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Period filter sheet */}
      <Sheet open={periodOpen} onOpenChange={setPeriodOpen}>
        <SheetContent side={isMobile ? 'bottom' : 'right'} className="pb-8">
          <SheetHeader>
            <SheetTitle>Filter by period</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 mt-2">
            {PERIODS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setPeriod(opt.value); setPeriodOpen(false); }}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-colors',
                  period === opt.value
                    ? 'bg-accent/15 text-accent border border-accent/30'
                    : 'bg-foreground/5 text-foreground hover:bg-foreground/10'
                )}
              >
                {opt.label}
                {period === opt.value && <RiCheckLine className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
