import {
  RiBuildingLine,
  RiMapPinLine,
  RiLineChartLine,
} from 'react-icons/ri';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import type { Investment } from '@/types';

function SimpleAreaChart({
  startValue,
  endValue,
  color,
}: {
  startValue: number;
  endValue: number;
  color: string;
}) {
  const W = 400;
  const H = 100;
  const px = 12;
  const py = 12;
  const max = Math.max(startValue, endValue, 1);
  const y1 = H - py - ((startValue / max) * (H - 2 * py));
  const y2 = H - py - ((endValue / max) * (H - 2 * py));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none">
      <defs>
        <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.01} />
        </linearGradient>
      </defs>
      <path
        d={`M ${px} ${y1} L ${W - px} ${y2} L ${W - px} ${H - py} L ${px} ${H - py} Z`}
        fill="url(#perfGrad)"
      />
      <path
        d={`M ${px} ${y1} L ${W - px} ${y2}`}
        stroke={color}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
      />
      <circle cx={px} cy={y1} r={4} fill={color} />
      <circle cx={W - px} cy={y2} r={4} fill={color} />
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
  const isMobile =
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;

  const appreciation = inv.currentValue - inv.totalInvested;
  const changePercent = inv.currentValueChangePercent ?? 0;
  const isPositive = changePercent >= 0;
  const chartColor = isPositive ? '#22c55e' : '#f87171';
  const perfTitle = PERF_TITLE[inv.type] ?? 'Investment Performance';
  const trendTitle = inv.type === 'land_banking' ? 'Land Value Trend' : 'Value Trend';
  const historyNoun = inv.type === 'land_banking' ? 'land value changes' : 'value changes';

  const stats = [
    { label: 'Total Invested', value: formatCurrency(inv.totalInvested), cls: 'text-foreground' },
    { label: 'Current Value', value: formatCurrency(inv.currentValue), cls: 'text-foreground' },
    {
      label: 'Appreciation',
      value: formatCurrency(appreciation),
      cls: isPositive ? 'text-green-400' : 'text-red-400',
    },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={cn(
          'p-0 flex flex-col overflow-hidden gap-0',
          isMobile ? 'h-[88vh] rounded-t-3xl' : 'w-[480px] sm:max-w-[480px]'
        )}
      >
        {/* Header */}
        <div className="px-4 py-4 border-b border-foreground/10 shrink-0 pr-12">
          <SheetTitle className="text-base font-bold">{perfTitle}</SheetTitle>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Investment summary */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
              {inv.propertyImageUrl ? (
                <img src={inv.propertyImageUrl} alt={inv.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-accent/10 flex items-center justify-center">
                  <RiBuildingLine className="text-accent h-4 w-4" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-foreground font-bold text-sm truncate">{inv.title}</p>
              <div className="flex items-center gap-1 mt-0.5 text-foreground/50 text-xs">
                <RiMapPinLine className="h-3 w-3 shrink-0" />
                {inv.location}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-foreground/10">
              {stats.map(({ label, value, cls }) => (
                <div key={label} className="p-4">
                  <p className="text-foreground/50 text-[10px]">{label}</p>
                  <p className={cn('font-bold text-sm mt-1 truncate', cls)}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Value Trend Chart */}
          <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/10">
              <h2 className="text-foreground font-semibold text-sm">{trendTitle}</h2>
              <div className="flex items-center gap-1.5 text-foreground/40 text-xs">
                <RiLineChartLine className="h-3.5 w-3.5" />
                All time
              </div>
            </div>
            <div className="px-4 py-4">
              <SimpleAreaChart
                startValue={inv.totalInvested}
                endValue={inv.currentValue}
                color={chartColor}
              />
              {inv.startedAt && (
                <div className="flex items-center justify-between text-foreground/30 text-xs mt-1">
                  <span>{formatDate(inv.startedAt)}</span>
                  <span>Today</span>
                </div>
              )}
              <p className="text-foreground/40 text-xs mt-3 leading-relaxed">
                Estimated appreciation from purchase to current{' '}
                {inv.type === 'land_banking' ? 'land' : 'investment'} value.
              </p>
            </div>
          </div>

          {/* Growth history */}
          <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
            <h2 className="text-foreground font-semibold text-sm mb-4">Property growth history</h2>
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <RiLineChartLine className="h-5 w-5 text-green-400" />
              </div>
              <p className="text-foreground/40 text-xs text-center">
                No {historyNoun} recorded yet.
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
