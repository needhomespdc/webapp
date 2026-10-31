import { useId, useMemo, useState } from 'react';
import {
  RiBuildingLine,
  RiMapPinLine,
  RiHistoryLine,
  RiArrowUpSFill,
  RiArrowDownSFill,
} from 'react-icons/ri';
import { SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import type { Investment } from '@/types';
import type { GrowthEvent } from '@/api/investments.api';
import { useInvestmentGrowthHistory } from '@/hooks/useInvestment';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { MODEL_BADGE } from './modelBadge';

const CARD = 'bg-card border border-foreground/5 rounded-3xl';
const CHART_COLOR = '#E8692A'; // brand accent
const CHART_LINE = '#9A3412'; // darker stroke over the accent fill, as in the design
const DAY = 86_400_000;

const PERIODS = [
  { value: 'all', label: 'All time', days: Infinity },
  { value: '1y', label: 'Past year', days: 365 },
  { value: '6m', label: 'Past 6 months', days: 182 },
  { value: '3m', label: 'Past 3 months', days: 91 },
  { value: '1m', label: 'Past month', days: 30 },
] as const;

type PeriodValue = (typeof PERIODS)[number]['value'];
type Point = { t: number; v: number };

const longDate = (t: number | string) => formatDate(new Date(t).toISOString(), { month: 'long' });
const pct = (n: number) => `${Number(n.toFixed(1))}%`;

/**
 * Value series for the chart: purchase → each recorded value change → today.
 * For a shorter period, the line starts at the cutoff with the value held at that moment.
 */
function buildSeries(inv: Investment, events: GrowthEvent[], days: number): Point[] {
  const now = Date.now();
  const start = inv.startedAt ? new Date(inv.startedAt).getTime() : now;
  const all: Point[] = [
    { t: start, v: inv.totalInvested },
    ...events
      .map((e) => ({ t: new Date(e.occurredAt).getTime(), v: e.newValue }))
      .filter((p) => p.t > start && p.t < now)
      .sort((a, b) => a.t - b.t),
    { t: now, v: inv.currentValue },
  ];
  const cutoff = now - days * DAY;
  if (!(cutoff > start)) return all;
  const before = all.filter((p) => p.t <= cutoff);
  const held = before[before.length - 1]?.v ?? inv.totalInvested;
  return [{ t: cutoff, v: held }, ...all.filter((p) => p.t > cutoff)];
}

/** Smooth path through the points (Catmull-Rom converted to cubic Béziers). */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function ValueTrendChart({ series }: { series: Point[] }) {
  const gradId = useId();
  const W = 400;
  const H = 180;
  const t0 = series[0].t;
  const tSpan = Math.max(series[series.length - 1].t - t0, 1);
  const values = series.map((p) => p.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  // Keep the curve in the upper part of the chart; a flat series sits at about a third of the height
  const toY = (v: number) => (range === 0 ? H * 0.35 : H * 0.08 + (1 - (v - min) / range) * H * 0.6);
  const pts = series.map((p) => ({ x: ((p.t - t0) / tSpan) * W, y: toY(p.v) }));
  const line = smoothPath(pts);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CHART_COLOR} stopOpacity={0.5} />
          <stop offset="100%" stopColor={CHART_COLOR} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${line} L ${W} ${H} L 0 ${H} Z`} fill={`url(#${gradId})`} />
      <path d={line} stroke={CHART_LINE} strokeWidth={2} fill="none" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

interface Props {
  inv: Investment;
  isOpen: boolean;
  onClose: () => void;
}

const PERF_TITLE: Record<string, string> = {
  land_banking: 'Land Performance',
  fractional: 'Portfolio Performance',
  co_development: 'Investment Performance',
  outright: 'Property Performance',
  save_to_own: 'Payment Performance',
};

export function PerformanceSheet({ inv, isOpen, onClose }: Props) {
  // Same mobile breakpoint and hook as every other sheet (also updates when the window resizes)
  const isMobile = useMediaQuery('(max-width: 639px)');
  const [period, setPeriod] = useState<PeriodValue>('all');
  const { growthEvents, isLoading } = useInvestmentGrowthHistory(isOpen ? inv.id : undefined);

  const appreciation = inv.currentValue - inv.totalInvested;
  const isPositive = appreciation >= 0;
  const perfTitle = PERF_TITLE[inv.type] ?? 'Investment Performance';
  const trendTitle = inv.type === 'land_banking' ? 'Land Value Trend' : 'Value Trend';
  const valueNoun = inv.type === 'land_banking' ? 'land' : 'property';

  const days = PERIODS.find((p) => p.value === period)?.days ?? Infinity;
  const series = useMemo(() => buildSeries(inv, growthEvents, days), [inv, growthEvents, days]);
  const history = useMemo(
    () => [...growthEvents].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()),
    [growthEvents]
  );

  const stats = [
    { label: 'Total Invested', value: formatCurrency(inv.totalInvested), cls: 'text-foreground', align: 'text-left' },
    { label: 'Current Value', value: formatCurrency(inv.currentValue), cls: 'text-foreground', align: 'text-center' },
    {
      label: 'Appreciation',
      value: formatCurrency(appreciation),
      cls: isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      align: 'text-right',
    },
  ];

  const body = (
    <>
      {/* Header: centred title; the modal's own close button sits top-right */}
      <div className="px-12 py-5 shrink-0">
        <DialogTitle className="text-center text-base font-bold">{perfTitle}</DialogTitle>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
        {/* Investment summary */}
        <div className={cn(CARD, 'p-4')}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0">
              {inv.propertyImageUrl ? (
                <img src={inv.propertyImageUrl} alt={inv.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-accent/10 flex items-center justify-center">
                  <RiBuildingLine className="text-accent h-6 w-6" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-foreground font-bold text-xl leading-tight truncate">{inv.title}</p>
              <span
                className={cn(
                  'inline-block mt-1.5 text-xs font-medium px-4 py-1 rounded-full',
                  MODEL_BADGE[inv.type] ?? 'bg-foreground/10 text-foreground/70'
                )}
              >
                {inv.typeLabel}
              </span>
              <div className="flex items-center gap-1.5 mt-1.5 text-foreground/50 text-sm">
                <RiMapPinLine className="h-4 w-4 shrink-0" />
                <span className="truncate">{inv.location}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-foreground/10 mt-3 bg-foreground/5 rounded-2xl py-2.5">
            {stats.map(({ label, value, cls, align }) => (
              <div key={label} className={cn('px-3 min-w-0', align)}>
                <p className="text-foreground/50 text-xs">{label}</p>
                <p className={cn('font-bold text-sm mt-1 truncate', cls)}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Value trend */}
        <div className={cn(CARD, 'p-4')}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-foreground font-bold text-sm">{trendTitle}</h2>
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodValue)}>
              <SelectTrigger className="w-auto h-9 gap-2 px-3 rounded-xl bg-card border-foreground/15 text-xs text-foreground/60" aria-label="Chart period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ValueTrendChart series={series} />
          <div className="flex items-center justify-between text-foreground text-xs mt-2">
            <span>{longDate(series[0].t)}</span>
            <span>Today</span>
          </div>
          <p className="text-foreground/50 text-xs text-center mt-3">
            Estimated appreciation from purchase to current {valueNoun} value
          </p>
        </div>

        {/* Growth history */}
        <div className={cn(CARD, 'p-4')}>
          <h2 className="text-foreground font-bold text-sm mb-2">Property growth history</h2>
          {isLoading ? (
            <p className="text-foreground/40 text-xs text-center py-8">Loading history…</p>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <RiHistoryLine className="h-10 w-10 text-foreground/50" />
              <p className="text-foreground/50 text-sm">No history found</p>
            </div>
          ) : (
            <ul>
              {history.map((e) => {
                const up = e.changeAmount >= 0;
                return (
                  <li key={e.id} className="flex items-center justify-between gap-3 py-2">
                    <span className="text-foreground/50 text-sm">{longDate(e.occurredAt)}</span>
                    <span className="flex items-center gap-3 shrink-0">
                      <span
                        className={cn(
                          'font-bold text-sm',
                          up ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        )}
                      >
                        {up ? '+' : '-'} {formatCurrency(Math.abs(e.changeAmount))}
                      </span>
                      <span
                        className={cn(
                          'flex items-center text-xs w-14',
                          up ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        )}
                      >
                        {up ? <RiArrowUpSFill className="h-5 w-5" /> : <RiArrowDownSFill className="h-5 w-5" />}
                        {pct(e.changePercent)}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );

  // New design: centred modal on desktop, bottom sheet on mobile
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {isMobile ? (
        <SheetContent
          side="bottom"
          className="p-0 flex flex-col overflow-hidden gap-0 bg-background h-[88vh] rounded-t-3xl"
        >
          {body}
        </SheetContent>
      ) : (
        <DialogContent className="p-0 flex flex-col overflow-hidden gap-0 bg-background max-w-[480px] max-h-[90vh] rounded-3xl">
          {body}
        </DialogContent>
      )}
    </Dialog>
  );
}
