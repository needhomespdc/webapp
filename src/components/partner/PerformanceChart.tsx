import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ReferralAnalyticsTotals } from '@/types';

const METRICS: { key: keyof ReferralAnalyticsTotals; label: string }[] = [
  { key: 'clicks', label: 'Clicks' },
  { key: 'views', label: 'Views' },
  { key: 'shares', label: 'Shares' },
  { key: 'leads', label: 'Leads' },
];

// Referral funnel for the selected period vs the one before it. The analytics endpoint returns
// totals only (no time series), so this compares totals. In its own file so the chart library
// (recharts, ~300 KB) is loaded lazily: the rest of the dashboard shows without waiting for it.
export default function PerformanceChart({
  totals,
  previousTotals,
  showPrevious,
}: {
  totals?: ReferralAnalyticsTotals;
  previousTotals?: ReferralAnalyticsTotals;
  showPrevious: boolean;
}) {
  const chartData = METRICS.map(({ key, label }) => ({
    label,
    current: totals?.[key] ?? 0,
    previous: previousTotals?.[key] ?? 0,
  }));

  if (chartData.every((d) => d.current === 0 && (!showPrevious || d.previous === 0))) {
    return (
      <div className="h-[160px] flex items-center justify-center">
        <p className="text-foreground/30 text-sm">No data for this period</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={chartData} margin={{ top: 10, right: 4, left: -28, bottom: 0 }} barGap={2}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.4 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.4 }}
          axisLine={false}
          tickLine={false}
          width={28}
          allowDecimals={false}
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
          formatter={(value, name) => [
            Number(value).toLocaleString(),
            name === 'current' ? 'This period' : 'Previous period',
          ]}
          cursor={{ fill: 'currentColor', opacity: 0.05 }}
        />
        {showPrevious && (
          <Bar dataKey="previous" fill="currentColor" fillOpacity={0.15} radius={[4, 4, 0, 0]} maxBarSize={18} />
        )}
        <Bar dataKey="current" fill="#F97316" radius={[4, 4, 0, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
