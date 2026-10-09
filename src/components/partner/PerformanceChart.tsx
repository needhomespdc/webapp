import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatDate } from '@/lib/utils';
import type { ReferralAnalytics } from '@/types';

// Referral clicks over time on the partner dashboard. In its own file so the chart library
// (recharts, ~300 KB) is loaded lazily: the rest of the dashboard shows without waiting for it.
export default function PerformanceChart({ data }: { data: ReferralAnalytics['clicksByPeriod'] }) {
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
