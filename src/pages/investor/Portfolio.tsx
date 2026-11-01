import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  RiBriefcaseLine,
  RiArrowRightLine,
  RiEyeLine,
  RiEyeOffLine,
  RiMapPinLine,
  RiSortDesc,
  RiSearchLine,
  RiTimeLine,
  RiCheckLine,
  RiArrowDownSLine,
  // Only used by the commented-out Quick Overview card:
  // RiPieChart2Line, RiLineChartLine, RiFlashlightLine, RiCheckboxCircleLine,
} from 'react-icons/ri';
import { usePortfolioPerformance, useInvestmentListFeed } from '@/hooks/useInvestment';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { formatCurrency, cn } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { Investment } from '@/types'; // PortfolioPerformance — only for the commented-out Quick Overview

// ─── Constants ─────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'this_week' },
  { label: 'This month', value: 'this_month' },
  { label: 'Past 6 months', value: 'past_6_months' },
  // Hidden until the backend supports period=all_time (it doesn't load yet)
  // { label: 'This year', value: 'all_time' },
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
  { value: 'resales', label: 'Resales' },
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

// ─── Badge maps ────────────────────────────────────────────────────────────────

const MODEL_BADGE: Record<string, string> = {
  co_development: 'bg-emerald-500',
  fractional:     'bg-violet-500',
  land_banking:   'bg-orange-500',
  save_to_own:    'bg-blue-500',
  outright:       'bg-amber-500',
};

const STATUS_BADGE: Record<string, string> = {
  active:         'bg-emerald-500',
  pending:        'bg-amber-500',
  completed:      'bg-blue-500',
  exited:         'bg-slate-500',
  pending_resale: 'bg-violet-500',
};

// ─── DataCol helper ────────────────────────────────────────────────────────────

function DataCol({
  label,
  value,
  className,
  valueClassName,
}: {
  label: string;
  value: string;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={cn('min-w-0 flex-1 px-3 border-l border-foreground/8', className)}>
      <p className="text-foreground/40 text-[10px]">{label}</p>
      <p className={cn('text-xs font-bold mt-0.5 truncate', valueClassName ?? 'text-foreground')}>{value}</p>
    </div>
  );
}

// ─── Investment card ───────────────────────────────────────────────────────────

function InvestmentCard({ inv }: { inv: Investment }) {
  const modelBadgeCls = MODEL_BADGE[inv.type] ?? 'bg-foreground/30';
  const statusBadgeBg = STATUS_BADGE[inv.status] ?? 'bg-foreground/40';
  // Only fractional holdings earn returns (payouts). The API sends totalReturns: 0 for outright,
  // land banking and co-development (checked live 31 Oct 2026), so the Returns field is left out
  // for those unless a value arrives.
  const hasReturns = inv.type === 'fractional' || inv.totalReturns !== 0;
  const returnsClass =
    inv.totalReturns > 0 ? 'text-green-400' :
    inv.totalReturns < 0 ? 'text-red-400' :
    'text-foreground/60';
  const returnsValue =
    inv.totalReturns > 0 ? `+${formatCurrency(inv.totalReturns)}` :
    inv.totalReturns < 0 ? `-${formatCurrency(Math.abs(inv.totalReturns))}` :
    formatCurrency(0);

  // Investment type sits on the image in its model colour, as on the marketplace cards
  const thumbnail = (
    <div className="relative w-19 h-19 rounded-xl overflow-hidden shrink-0">
      {inv.propertyImageUrl ? (
        <img src={inv.propertyImageUrl} alt={inv.title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-accent/10 flex items-center justify-center">
          <RiBriefcaseLine className="text-accent h-6 w-6" />
        </div>
      )}
      <span
        className={cn(
          'absolute top-1.5 left-1.5 max-w-[calc(100%-0.75rem)] truncate text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-lg whitespace-nowrap leading-none',
          modelBadgeCls,
        )}
      >
        {inv.typeLabel === 'Co-development' ? 'Co-Dev' : inv.typeLabel}
      </span>
    </div>
  );

  const statusPill = (
    <span
      className={cn(
        'inline-block text-white text-[10px] font-semibold px-2 py-0.5 rounded-lg whitespace-nowrap leading-tight',
        statusBadgeBg,
      )}
    >
      {inv.statusLabel}
    </span>
  );

  return (
    <Link
      to={`/investor/portfolio/${inv.id}`}
      className="block rounded-2xl border border-foreground/10 hover:border-foreground/20 bg-card transition-all active:scale-[0.99]"
    >
      {/* Mobile — original design */}
      <div className="md:hidden flex items-center gap-3 p-3">
        {thumbnail}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-foreground text-sm font-bold truncate">{inv.title}</p>
            {statusPill}
          </div>
          <div className="flex items-center gap-1 mt-1">
            <RiMapPinLine className="text-foreground/40 h-3 w-3 shrink-0" />
            <p className="text-foreground/50 text-xs truncate">{inv.location}</p>
          </div>
          <div className="flex items-center mt-2 pt-2 border-t border-foreground/8">
            <div className="flex-1 min-w-0">
              <p className="text-foreground/40 text-[10px]">Units Owned</p>
              <p className="text-foreground text-xs font-bold mt-0.5">{inv.unitsOwnedLabel}</p>
            </div>
            <div className="w-px h-6 bg-foreground/10 mx-2 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-foreground/40 text-[10px]">Current Value</p>
              <p className="text-foreground text-xs font-bold mt-0.5">{formatCurrency(inv.currentValue)}</p>
            </div>
            {inv.projectMilestoneLabel && (
              <>
                <div className="hidden sm:block w-px h-6 bg-foreground/10 mx-2 shrink-0" />
                <div className="hidden sm:flex flex-1 min-w-0 flex-col">
                  <p className="text-foreground/40 text-[10px]">Milestone</p>
                  <p className="text-foreground text-xs font-bold mt-0.5 truncate">{inv.projectMilestoneLabel}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Desktop — new table-row design */}
      <div className="hidden md:flex items-center gap-3 p-3">
        {thumbnail}
        <div className="w-36 shrink-0 min-w-0">
          <p className="text-foreground text-sm font-bold truncate">{inv.title}</p>
          <div className="flex items-center gap-1 mt-1">
            <RiMapPinLine className="text-foreground/40 h-3 w-3 shrink-0" />
            <p className="text-foreground/50 text-xs truncate">{inv.location}</p>
          </div>
        </div>
        <div className="flex flex-1 items-center">
          <div className="min-w-0 flex-1 px-3 border-l border-foreground/8">
            <p className="text-foreground/40 text-[10px]">Status</p>
            <div className="mt-0.5">{statusPill}</div>
          </div>
          <DataCol label="Units Owned" value={inv.unitsOwnedLabel} />
          <DataCol label="Invested Amount" value={formatCurrency(inv.totalInvested)} />
          <DataCol label="Current Value" value={formatCurrency(inv.currentValue)} valueClassName="text-accent" />
          {hasReturns && <DataCol label="Returns" value={returnsValue} valueClassName={returnsClass} />}
        </div>
        <RiArrowRightLine className="text-foreground/30 shrink-0 h-4 w-4" />
      </div>
    </Link>
  );
}

// ─── Quick Overview sidebar ────────────────────────────────────────────────────
// Removed from the design (1 Nov 2026), kept for reference.

/*
function QuickOverview({ perf, loading }: { perf: PortfolioPerformance | undefined; loading: boolean }) {
  const items = [
    {
      icon: <RiPieChart2Line className="h-5 w-5 text-orange-500" />,
      iconBg: 'bg-orange-500/15',
      label: 'Total Invested',
      value: perf ? formatCurrency(perf.totalInvested) : null,
    },
    {
      icon: <RiLineChartLine className="h-5 w-5 text-emerald-500" />,
      iconBg: 'bg-emerald-500/15',
      label: 'Total Returns',
      value: perf ? formatCurrency(perf.returnsEarned) : null,
    },
    {
      icon: <RiFlashlightLine className="h-5 w-5 text-violet-500" />,
      iconBg: 'bg-violet-500/15',
      label: 'Active Investments',
      value: perf ? String(perf.activeInvestments) : null,
    },
    {
      icon: <RiCheckboxCircleLine className="h-5 w-5 text-blue-500" />,
      iconBg: 'bg-blue-500/15',
      label: 'Total Investments',
      value: perf ? String(perf.totalInvestments) : null,
    },
  ];

  return (
    <div className="rounded-2xl border border-foreground/10 bg-card p-4 sticky top-20">
      <p className="text-foreground text-sm font-semibold mb-4">Quick Overview</p>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center shrink-0', item.iconBg)}>
              {item.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-foreground/50 text-xs">{item.label}</p>
              {loading ? (
                <Skeleton className="h-4 w-24 mt-1" />
              ) : (
                <p className="text-foreground text-sm font-bold mt-0.5 truncate">{item.value ?? '—'}</p>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
*/

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Portfolio() {
  const isMobile = useMediaQuery('(max-width: 639px)');

  const [tab, setTab] = useState<TabValue>('all');
  const [period, setPeriod] = useState<PeriodValue>('past_6_months');
  const [sort, setSort] = useState<SortValue>('recent');
  const [showValue, setShowValue] = useState(true);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 300).trim();

  const { performance: perf, isLoading: perfLoading } = usePortfolioPerformance(period);
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInvestmentListFeed(tab === 'all' ? undefined : tab, search);

  const rawInvestments = useMemo(
    () => data?.pages.flatMap((p) => p.data ?? []) ?? [],
    [data],
  );

  const filtered = useMemo(() => sortInvestments(rawInvestments, sort), [rawInvestments, sort]);

  const currentPeriodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label ?? 'This month';

  // Opens the bottom sheet on mobile; on desktop it's the dropdown's trigger
  const periodButton = (
    <button
      type="button"
      onClick={isMobile ? () => setPeriodOpen(true) : undefined}
      className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
    >
      <RiTimeLine className="h-3.5 w-3.5" />
      {currentPeriodLabel}
      <RiArrowDownSLine className="h-3.5 w-3.5" />
    </button>
  );
  const currentSortLabel = SORT_OPTIONS.find((s) => s.value === sort)?.label ?? 'Recent';

  return (
    <div className="space-y-5 pb-4">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Portfolio</h1>
        <p className="text-foreground/50 text-sm mt-0.5">Track your investments and earnings</p>
      </div>

      {/* Top card — hero (full width now the performance card is out) */}
      <div className="grid grid-cols-1 gap-3">
        {/* Hero — Total Portfolio Value */}
        <div className="relative rounded-2xl overflow-hidden bg-primary p-5 min-h-[170px] flex flex-col justify-between">
          <div className="flex flex-row justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <p className="text-white/60 text-sm">Total Portfolio Value</p>
                <button
                  onClick={() => setShowValue((v) => !v)}
                  className="text-white/40 hover:text-white/70 transition-colors"
                >
                  {showValue ? <RiEyeLine className="h-4 w-4" /> : <RiEyeOffLine className="h-4 w-4" />}
                </button>
              </div>

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

            <div className="flex flex-col items-end gap-3">
              {/* Period filter — bottom sheet on mobile, dropdown on larger screens */}
              {isMobile ? (
                periodButton
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>{periodButton}</DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    {PERIOD_OPTIONS.map((opt) => (
                      <DropdownMenuItem
                        key={opt.value}
                        onClick={() => setPeriod(opt.value)}
                        className={cn('justify-between', period === opt.value && 'text-accent')}
                      >
                        {opt.label}
                        {period === opt.value && <RiCheckLine className="h-4 w-4" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <img src="/resources/portfolio-hero.png" alt="portfolio" className="h-auto w-24 sm:w-32" />
            </div>
          </div>

          {/* Insights — invested + returns on the left, investment counts on the right */}
          <div className="flex items-start justify-between gap-4 mt-4 pt-4 border-t border-white/10">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <p className="text-white/60 text-xs">Total Invested</p>
                {perfLoading ? (
                  <Skeleton className="h-4 w-24 bg-white/10" />
                ) : (
                  <p className="text-white text-base font-bold">{formatCurrency(perf?.totalInvested ?? 0)}</p>
                )}
              </div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <p className="text-green-400 text-xs">Returns</p>
                {perfLoading ? (
                  <Skeleton className="h-3.5 w-20 bg-white/10" />
                ) : (
                  <p className="text-white text-xs font-semibold">{formatCurrency(perf?.returnsEarned ?? 0)}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5 text-right shrink-0">
              <div className="flex items-baseline justify-end gap-2">
                <p className="text-white/60 text-xs">Total Investments</p>
                {perfLoading ? (
                  <Skeleton className="h-4 w-6 bg-white/10" />
                ) : (
                  <p className="text-white text-base font-bold">{perf?.totalInvestments ?? 0}</p>
                )}
              </div>
              <div className="flex items-baseline justify-end gap-2">
                <p className="text-green-400 text-xs">Active</p>
                {perfLoading ? (
                  <Skeleton className="h-3.5 w-5 bg-white/10" />
                ) : (
                  <p className="text-white text-xs font-semibold">{perf?.activeInvestments ?? 0}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Performance — removed from the design (1 Nov 2026), kept for reference
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
        */}
      </div>

      {/* Bottom — investments list + quick overview sidebar */}
      <div className="flex flex-col xl:flex-row gap-5">

        {/* My Investments list */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <p className="text-foreground font-semibold">My Investments</p>
            {/* Search — sent to the API as ?search= */}
            <div className="relative w-full sm:w-96">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 h-4 w-4" />
              <Input
                type="search"
                className="pl-9 h-9"
                placeholder="Search by property name"
                aria-label="Search investments"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </div>

          {/* Status filter tabs + sort */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 no-scrollbar [-webkit-overflow-scrolling:touch]">
              {STATUS_TABS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
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
            <button
              onClick={() => setSortOpen(true)}
              className="shrink-0 self-end sm:self-auto flex items-center gap-1.5 text-foreground/60 text-sm hover:text-foreground transition-colors"
            >
              <RiSortDesc className="h-4 w-4" />
              Sort by:&nbsp;<span className="text-accent font-medium">{currentSortLabel}</span>
              <RiArrowDownSLine className="h-3.5 w-3.5 text-accent" />
            </button>
          </div>

          {/* Investment cards */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
            </div>
          ) : !filtered.length && search ? (
            <EmptyState
              icon={<RiSearchLine />}
              title="No matching investments"
              description={`Nothing in your portfolio matches "${search}".`}
            />
          ) : !filtered.length ? (
            <EmptyState
              icon={<RiBriefcaseLine />}
              title="No investments yet"
              description="Start investing in real estate to see your portfolio here."
              action={
                <Link to="/investor/marketplace">
                  <Button variant="default" size="sm">Browse Property Hub</Button>
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

        {/* Quick Overview — removed from the design (1 Nov 2026), kept for reference
        <div className="hidden xl:block xl:w-64 shrink-0">
          <QuickOverview perf={perf} loading={perfLoading} />
        </div>
        */}
      </div>

      {/* Period filter sheet — mobile only (desktop uses the dropdown on the value card) */}
      <Sheet open={periodOpen} onOpenChange={setPeriodOpen}>
        <SheetContent side="bottom" className="pb-8">
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
