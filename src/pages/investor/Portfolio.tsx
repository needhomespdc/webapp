import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  RiBriefcaseLine,
  // RiArrowRightLine,
  // RiDownloadLine,
  RiEyeLine,
  RiEyeOffLine,
  RiMapPinLine,
  RiSortDesc,
  RiTimeLine,
  RiCheckLine,
  // RiUserAddLine,
  RiArrowDownSLine,
} from 'react-icons/ri';
import { usePortfolioPerformance, useInvestmentListFeed } from '@/hooks/useInvestment';
// import { useAuth } from '@/hooks/useAuth';
import { useMediaQuery } from '@/hooks/useMediaQuery';
// import { useToast } from '@/hooks/useToast';
import { formatCurrency, cn } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { Investment } from '@/types';

// ─── Constants ─────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'this_week' },
  { label: 'This month', value: 'this_month' },
  { label: 'Past 6 months', value: 'past_6_months' },
  { label: 'This year', value: 'all_time' },
] as const;

const SORT_OPTIONS = [
  { label: 'Recent', value: 'recent' },
  { label: 'Value: High to Low', value: 'value_desc' },
  { label: 'Value: Low to High', value: 'value_asc' },
  { label: 'Returns: High to Low', value: 'returns_desc' },
] as const;

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'exited', label: 'Exited' },
  { value: 'pending_resale', label: 'Resales' },
] as const;

type PeriodValue = (typeof PERIOD_OPTIONS)[number]['value'];
type SortValue = (typeof SORT_OPTIONS)[number]['value'];
type TabValue = (typeof STATUS_TABS)[number]['value'];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function sortInvestments(list: Investment[], sort: SortValue): Investment[] {
  const copy = [...list];
  switch (sort) {
    case 'value_desc': return copy.sort((a, b) => b.currentValue - a.currentValue);
    case 'value_asc': return copy.sort((a, b) => a.currentValue - b.currentValue);
    case 'returns_desc': return copy.sort((a, b) => b.totalReturns - a.totalReturns);
    default: return copy.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

// ─── Investment card (same layout as dashboard) ────────────────────────────────

function InvestmentCard({ inv }: { inv: Investment }) {
  return (
    <Link
      to={`/investor/portfolio/${inv.id}`}
      className="flex items-center gap-3 p-3 rounded-2xl border border-foreground/10 hover:border-foreground/20 bg-card transition-all"
    >
      {/* Thumbnail */}
      <div className="relative w-[72px] h-[72px] rounded-xl overflow-hidden shrink-0">
        {inv.propertyImageUrl ? (
          <img src={inv.propertyImageUrl} alt={inv.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-accent/10 flex items-center justify-center">
            <RiBriefcaseLine className="text-accent h-6 w-6" />
          </div>
        )}
        <span className="absolute top-1.5 left-1.5 bg-black/55 backdrop-blur text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-tight">
          {inv.typeLabel === 'Co-development' ? 'Co-Dev' : inv.typeLabel}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1 flex-wrap">
          <p className="text-foreground text-sm font-bold truncate">{inv.title}</p>
          <div className="flex items-center gap-1">
            <RiMapPinLine className="text-foreground/40 h-3 w-3 shrink-0" />
            <p className="text-foreground/50 text-xs truncate">{inv.location}</p>
          </div>
        </div>

        <div className="flex items-center mt-2 pt-2 border-t border-foreground/5">
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
              <div className="hidden sm:flex flex-1 min-w-0 flex-col">
                <p className="text-foreground/40 text-[10px]">Project Milestone</p>
                <p className="text-foreground text-xs font-bold mt-0.5 truncate">{inv.projectMilestoneLabel}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Portfolio() {
  // const { user } = useAuth();
  // const { toast } = useToast();
  const isMobile = useMediaQuery('(max-width: 639px)');

  const [tab, setTab] = useState<TabValue>('all');
  const [period, setPeriod] = useState<PeriodValue>('past_6_months');
  const [sort, setSort] = useState<SortValue>('recent');
  const [showValue, setShowValue] = useState(true);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const { performance: perf, isLoading: perfLoading } = usePortfolioPerformance(period);
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInvestmentListFeed(tab === 'all' ? undefined : tab);

  const rawInvestments = useMemo(
    () => data?.pages.flatMap((p) => p.data ?? []) ?? [],
    [data],
  );

  const filtered = useMemo(() => sortInvestments(rawInvestments, sort), [rawInvestments, sort]);

  const handleTabChange = (newTab: TabValue) => { setTab(newTab); };

  const currentPeriodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label ?? 'This month';
  const currentSortLabel = SORT_OPTIONS.find((s) => s.value === sort)?.label ?? 'Recent';

  // const copyReferral = () => {
  //   if (!user?.referralCode) return;
  //   const link = `${window.location.origin}/register?ref=${user.referralCode}`;
  //   navigator.clipboard.writeText(link);
  //   toast({ title: 'Referral link copied!' });
  // };

  return (
    <div className="space-y-5 pb-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Portfolio</h1>
          <p className="text-foreground/50 text-sm mt-0.5">Track your investments and earnings</p>
        </div>
        {/* <button
          onClick={() =>
            toast({ title: 'Coming soon', description: 'Portfolio report download will be available soon.' })
          }
          className="w-10 h-10 rounded-xl border border-foreground/10 bg-card flex items-center justify-center text-foreground/50 hover:text-foreground transition-colors"
        >
          <RiDownloadLine className="h-5 w-5" />
        </button> */}
      </div>

      {/* Hero — Total Portfolio Value */}
      <div className="relative rounded-2xl overflow-hidden bg-primary p-5 min-h-[170px] flex flex-col justify-between">
        <div className="flex flex-row justify-between">
          <div className="flex flex-col gap-1">
            {/* Label + toggle */}
            <div className="flex items-center gap-2">
              <p className="text-white/60 text-sm">Total Portfolio Value</p>
              <button
                onClick={() => setShowValue((v) => !v)}
                className="text-white/40 hover:text-white/70 transition-colors"
              >
                {showValue ? <RiEyeLine className="h-4 w-4" /> : <RiEyeOffLine className="h-4 w-4" />}
              </button>
            </div>

            {/* Big value */}
            <div className="mt-1">
              {perfLoading ? (
                <Skeleton className="h-9 w-40 bg-white/10" />
              ) : showValue ? (
                <CurrencyDisplay amount={perf?.totalPortfolioValue ?? 0} size="xl" className="text-white" />
              ) : (
                <p className="text-3xl font-black text-white/30 tracking-widest">••••••</p>
              )}
            </div>
          </div>

          <img src="/resources/portfolio-hero.png" alt="portfolio_image" className='h-auto w-20' />
        </div>

        {/* Mini stats row */}
        <div className="flex items-center mt-4 pt-4 border-t border-white/10">
          {(
            [
              { label: 'Total Invested', amount: perf?.totalInvested ?? 0, currency: true },
              { label: 'Total Returns', amount: perf?.returnsEarned ?? 0, currency: true },
              { label: 'Active', amount: perf?.activeInvestments ?? 0, currency: false },
            ] as const
          ).map((stat, i) => (
            <div key={stat.label} className={cn('flex-1 text-center', i !== 0 && 'border-l border-white/10')}>
              <p className="text-white/50 text-[10px]">{stat.label}</p>
              {perfLoading ? (
                <Skeleton className="h-3.5 w-10 mx-auto mt-1.5 bg-white/10" />
              ) : (
                <p className="text-white text-xs font-bold mt-0.5">
                  {stat.currency ? formatCurrency(stat.amount as number) : (stat.amount as number)}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Portfolio Performance */}
      <div className="rounded-2xl border border-foreground/10 bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-foreground text-sm font-semibold">Portfolio Performance</p>
          <button
            onClick={() => setPeriodOpen(true)}
            className="flex items-center gap-1.5 text-accent text-sm font-medium hover:opacity-80 transition-opacity"
          >
            <RiTimeLine className="h-3.5 w-3.5" />
            {currentPeriodLabel}
            <RiArrowDownSLine className="h-3.5 w-3.5" />
          </button>
        </div>

        {perfLoading ? (
          <div className="space-y-3">
            <div className="flex gap-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 flex-1" />)}
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ) : (
          <>
            <div className="flex items-start divide-x divide-foreground/10">
              <div className="flex-1 pr-4">
                <p className="text-green-400 text-lg font-bold">
                  +{(perf?.totalReturnsPercent ?? 0).toFixed(1)}%
                </p>
                <p className="text-foreground/50 text-[11px] mt-0.5">Total Returns</p>
              </div>
              <div className="flex-1 px-4">
                <CurrencyDisplay amount={perf?.returnsEarned ?? 0} size="lg" className="text-foreground" />
                <p className="text-foreground/50 text-[11px] mt-0.5">Returns Earned</p>
              </div>
              <div className="flex-1 pl-4">
                <p className="text-green-400 text-lg font-bold">
                  {(perf?.portfolioOccupancyPercent ?? 0).toFixed(0)}%
                </p>
                <p className="text-foreground/50 text-[11px] mt-0.5">Portfolio Occupancy</p>
              </div>
            </div>

            <div className="mt-4 h-2 rounded-full bg-foreground/8 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-700"
                style={{ width: `${Math.min(perf?.portfolioOccupancyPercent ?? 0, 100)}%` }}
              />
            </div>
          </>
        )}
      </div>

      {/* My Investments list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-foreground font-semibold">My Investments</p>
          <button
            onClick={() => setSortOpen(true)}
            className="flex items-center gap-1.5 text-foreground/60 text-sm hover:text-foreground transition-colors"
          >
            <RiSortDesc className="h-4 w-4" />
            Sort by:&nbsp;<span className="text-accent font-medium">{currentSortLabel}</span>
            <RiArrowDownSLine className="h-3.5 w-3.5 text-accent" />
          </button>
        </div>

        {/* Status filter tabs */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 no-scrollbar mb-4 [-webkit-overflow-scrolling:touch]">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => handleTabChange(t.value)}
              className={cn(
                'shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium border transition-all',
                tab === t.value
                  ? 'bg-accent/15 border-accent/40 text-accent'
                  : 'bg-transparent border-foreground/10 text-foreground/60 hover:border-foreground/20'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Investment cards */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[100px] w-full rounded-2xl" />)}
          </div>
        ) : !filtered.length ? (
          <EmptyState
            icon={<RiBriefcaseLine />}
            title="No investments yet"
            description="Start investing in real estate to see your portfolio here."
            action={
              <Link to="/investor/marketplace">
                <Button variant="default" size="sm">Browse Marketplace</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((inv) => <InvestmentCard key={inv.id} inv={inv} />)}
          </div>
        )}

        {hasNextPage && (
          <div className="flex justify-center mt-5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="min-w-32"
            >
              {isFetchingNextPage ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </div>

      {/* Referral invite banner */}
      {/* <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 p-4">
        <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <RiUserAddLine className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold">Earn more with your investments</p>
          <p className="text-white/70 text-xs mt-0.5">Invite friends and earn up to ₦50,000</p>
        </div>
        <button
          onClick={copyReferral}
          className="shrink-0 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-colors"
        >
          Invite Now
          <RiArrowRightLine className="h-4 w-4" />
        </button>
      </div> */}

      {/* Period filter sheet */}
      <Sheet open={periodOpen} onOpenChange={setPeriodOpen}>
        <SheetContent side={isMobile ? 'bottom' : 'right'} className="pb-8">
          <SheetHeader>
            <SheetTitle>Filter by period</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 mt-2">
            {PERIOD_OPTIONS.map((opt) => (
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

      {/* Sort sheet */}
      <Sheet open={sortOpen} onOpenChange={setSortOpen}>
        <SheetContent side={isMobile ? 'bottom' : 'right'} className="pb-8">
          <SheetHeader>
            <SheetTitle>Sort investments</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 mt-2">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setSort(opt.value); setSortOpen(false); }}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-colors',
                  sort === opt.value
                    ? 'bg-accent/15 text-accent border border-accent/30'
                    : 'bg-foreground/5 text-foreground hover:bg-foreground/10'
                )}
              >
                {opt.label}
                {sort === opt.value && <RiCheckLine className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
