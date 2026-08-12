import { useParams, useNavigate } from 'react-router-dom';
import {
  RiMapPinLine,
  RiCheckLine,
  RiPhoneLine,
  RiFileTextLine,
  RiDownload2Line,
  RiArrowRightSLine,
  RiInformationLine,
  RiCalendarLine,
  RiBuildingLine,
} from 'react-icons/ri';
import { useInvestmentDetail } from '@/hooks/useInvestment';
import { investmentsApi } from '@/api/investments.api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/useToast';
import type { Investment, InvestmentModelType, InvestmentProgressStep } from '@/types';

// ─── Model theme ───────────────────────────────────────────────────────────────

interface ModelTheme {
  headerBg: string;
  accentBg: string;
  accentBtn: string;
  accentText: string;
  lightBg: string;
  borderLight: string;
}

const MODEL_THEME: Record<InvestmentModelType, ModelTheme> = {
  land_banking: {
    headerBg: 'bg-green-800',
    accentBg: 'bg-green-500',
    accentBtn: 'bg-green-600 hover:bg-green-700',
    accentText: 'text-green-400',
    lightBg: 'bg-green-500/10',
    borderLight: 'border-green-500/20',
  },
  outright: {
    headerBg: 'bg-orange-700',
    accentBg: 'bg-accent',
    accentBtn: 'bg-accent hover:bg-accent/90',
    accentText: 'text-accent',
    lightBg: 'bg-accent/10',
    borderLight: 'border-accent/20',
  },
  co_development: {
    headerBg: 'bg-orange-700',
    accentBg: 'bg-accent',
    accentBtn: 'bg-accent hover:bg-accent/90',
    accentText: 'text-accent',
    lightBg: 'bg-accent/10',
    borderLight: 'border-accent/20',
  },
  fractional: {
    headerBg: 'bg-violet-800',
    accentBg: 'bg-violet-500',
    accentBtn: 'bg-violet-600 hover:bg-violet-700',
    accentText: 'text-violet-400',
    lightBg: 'bg-violet-500/10',
    borderLight: 'border-violet-500/20',
  },
  save_to_own: {
    headerBg: 'bg-blue-800',
    accentBg: 'bg-blue-500',
    accentBtn: 'bg-blue-600 hover:bg-blue-700',
    accentText: 'text-blue-400',
    lightBg: 'bg-blue-500/10',
    borderLight: 'border-blue-500/20',
  },
};

// ─── Compact currency (for header card stats) ─────────────────────────────────

function compactAmount(n: number): string {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return formatCurrency(n);
}

// ─── Inline badges (within colored header card) ───────────────────────────────

function ModelBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-black/25 border border-white/10 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0">
      {children}
    </span>
  );
}

function StatusChip({ status, label }: { status: string; label: string }) {
  const cls: Record<string, string> = {
    active: 'bg-green-500',
    completed: 'bg-green-600',
    pending: 'bg-amber-500',
    exited: 'bg-foreground/40',
    pending_resale: 'bg-violet-500',
  };
  return (
    <span className={cn('text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0', cls[status] ?? 'bg-foreground/30')}>
      {label}
    </span>
  );
}

// ─── Stat cell (white text on colored bg) ────────────────────────────────────

function StatCell({ label, value, sub, subClass }: { label: string; value: string; sub?: string; subClass?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-white/50 text-[10px] truncate">{label}</p>
      <p className="text-white text-xs font-bold mt-0.5 truncate">{value}</p>
      {sub && <p className={cn('text-[10px] mt-0.5', subClass ?? 'text-white/50')}>{sub}</p>}
    </div>
  );
}

// ─── Header card (model-specific layout) ──────────────────────────────────────

function HeaderCard({ inv, theme }: { inv: Investment; theme: ModelTheme }) {
  const type = inv.type;

  const Thumbnail = () =>
    inv.propertyImageUrl ? (
      <img src={inv.propertyImageUrl} alt={inv.title} className="w-20 h-20 rounded-xl object-cover shrink-0" />
    ) : (
      <div className="w-20 h-20 rounded-xl bg-white/10 shrink-0 flex items-center justify-center">
        <RiBuildingLine className="h-8 w-8 text-white/30" />
      </div>
    );

  // Co-Development: no thumbnail; 3×2 stat grid in card
  if (type === 'co_development') {
    const changePercent = inv.currentValueChangePercent ?? 0;
    const stats = [
      {
        label: 'Project Progress',
        value: inv.projectProgressPercent != null ? `${inv.projectProgressPercent}%` : (inv.progressLabel ?? '—'),
      },
      {
        label: 'Project End Date',
        value: inv.projectEndDate ? formatDate(inv.projectEndDate, { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
      },
      {
        label: 'Investment Date',
        value: formatDate(inv.startedAt, { day: 'numeric', month: 'short', year: 'numeric' }),
      },
      {
        label: 'Current Value',
        value: compactAmount(inv.currentValue),
        sub: `${changePercent.toFixed(1)}% Since Investment`,
      },
      { label: 'Project Duration', value: inv.projectDurationLabel ?? '—' },
      { label: 'Units', value: inv.unitsOwnedLabel },
    ];

    return (
      <div className={cn('rounded-2xl p-4', theme.headerBg)}>
        <p className="text-white font-bold text-base leading-tight">{inv.title}</p>
        <div className="flex items-center gap-1.5 flex-wrap mt-2">
          <ModelBadge>{inv.typeLabel}</ModelBadge>
          <StatusChip status={inv.status} label={inv.statusLabel} />
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-white/60 text-xs">
          <RiMapPinLine className="h-3.5 w-3.5 shrink-0" />
          {inv.location}
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/15">
          {stats.map((s) => (
            <StatCell key={s.label} label={s.label} value={s.value} sub={s.sub} />
          ))}
        </div>
      </div>
    );
  }

  // Land Banking: thumbnail + 4-col stats row
  if (type === 'land_banking') {
    return (
      <div className={cn('rounded-2xl p-4', theme.headerBg)}>
        <div className="flex gap-3">
          <Thumbnail />
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-1.5 flex-wrap">
              <ModelBadge>{inv.typeLabel}</ModelBadge>
              <StatusChip status={inv.status} label={inv.statusLabel} />
            </div>
            <p className="text-white font-bold text-sm mt-2 leading-tight">{inv.title}</p>
            <div className="flex items-center gap-1 mt-1.5 text-white/60 text-xs">
              <RiMapPinLine className="h-3 w-3 shrink-0" />
              {inv.location}
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2 mt-4 pt-4 border-t border-white/15 overflow-x-auto">
          <StatCell label="Reservation Period" value={inv.reservationPeriodLabel ?? '—'} />
          <div className="w-px h-8 bg-white/15 shrink-0 mt-0.5" />
          <StatCell label="Your Ownership" value={inv.unitsOwnedLabel} />
          <div className="w-px h-8 bg-white/15 shrink-0 mt-0.5" />
          <StatCell label="Plot Size" value={inv.plotSizeLabel ?? inv.plotSize ?? '—'} />
          <div className="w-px h-8 bg-white/15 shrink-0 mt-0.5" />
          <StatCell
            label="Maturity Date"
            value={inv.maturityDate ? formatDate(inv.maturityDate, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
          />
        </div>
      </div>
    );
  }

  // Outright: thumbnail + title/badges/location/"Fully Owned"
  if (type === 'outright') {
    return (
      <div className={cn('rounded-2xl p-4', theme.headerBg)}>
        <div className="flex gap-3">
          <Thumbnail />
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight">{inv.title}</p>
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <ModelBadge>{inv.typeLabel}</ModelBadge>
              <StatusChip status={inv.status} label={inv.statusLabel} />
            </div>
            <div className="flex items-center gap-1 mt-1.5 text-white/60 text-xs">
              <RiMapPinLine className="h-3 w-3 shrink-0" />
              {inv.location}
            </div>
            {inv.ownershipLabel && (
              <p className="text-white/80 text-xs font-semibold mt-1.5">{inv.ownershipLabel}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fractional / Save-to-Own: thumbnail + 3-col stats row
  const statsRow = type === 'fractional'
    ? [
        { label: 'Your Ownership', value: inv.unitsOwnedLabel },
        { label: 'Progress', value: `${inv.progressPercent.toFixed(0)}%` },
        { label: 'Maturity Date', value: inv.maturityDate ? formatDate(inv.maturityDate, { month: 'short', year: 'numeric' }) : '—' },
      ]
    : [
        { label: 'Your Ownership', value: inv.unitsOwnedLabel },
        { label: 'Amount Paid', value: `${inv.progressPercent.toFixed(0)}%` },
        { label: 'Maturity Date', value: inv.maturityDate ? formatDate(inv.maturityDate, { month: 'short', year: 'numeric' }) : '—' },
      ];

  return (
    <div className={cn('rounded-2xl p-4', theme.headerBg)}>
      <div className="flex gap-3">
        <Thumbnail />
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-1.5 flex-wrap">
            <ModelBadge>{inv.typeLabel}</ModelBadge>
            <StatusChip status={inv.status} label={inv.statusLabel} />
          </div>
          <p className="text-white font-bold text-sm mt-2 leading-tight">{inv.title}</p>
          <div className="flex items-center gap-1 mt-1.5 text-white/60 text-xs">
            <RiMapPinLine className="h-3 w-3 shrink-0" />
            {inv.location}
          </div>
        </div>
      </div>
      <div className="flex items-start gap-4 mt-4 pt-4 border-t border-white/15">
        {statsRow.map((s, i) => (
          <div key={s.label} className="flex items-start gap-4">
            {i > 0 && <div className="w-px h-8 bg-white/15 shrink-0 -mt-0.5" />}
            <StatCell label={s.label} value={s.value} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Financial card ────────────────────────────────────────────────────────────

function FinancialCard({ inv, theme }: { inv: Investment; theme: ModelTheme }) {
  const type = inv.type;
  const changePercent = inv.currentValueChangePercent ?? 0;
  const isPositive = changePercent >= 0;

  let leftLabel: string;
  let leftValue: number;
  let rightLabel: string;
  let rightValue: number;
  let perfLink: string;
  let note: string | null = null;
  let showLeftChange = false;
  let showRightChange = false;
  let showAmountPaid = false;

  if (type === 'land_banking') {
    leftLabel = 'Current Value'; leftValue = inv.currentValue;
    rightLabel = 'Total Invested'; rightValue = inv.totalInvested;
    perfLink = 'Land performance history';
    showLeftChange = true; showAmountPaid = true;
  } else if (type === 'outright') {
    leftLabel = 'Total Paid'; leftValue = inv.totalCommitment;
    rightLabel = 'Current Value'; rightValue = inv.currentValue;
    note = inv.currentValueNote ?? null;
    perfLink = 'View property performance';
    showRightChange = true;
  } else if (type === 'co_development') {
    leftLabel = 'Total Invested'; leftValue = inv.totalInvested;
    rightLabel = 'Initial Property Value'; rightValue = inv.initialPropertyValue ?? inv.currentValue;
    perfLink = 'View investment performance';
  } else if (type === 'fractional') {
    leftLabel = 'Current Value'; leftValue = inv.currentValue;
    rightLabel = 'Total Returns'; rightValue = inv.totalReturns;
    perfLink = 'View performance history';
    showLeftChange = true;
  } else {
    leftLabel = 'Total Paid'; leftValue = inv.totalInvested;
    rightLabel = 'Property Value'; rightValue = inv.totalCommitment;
    perfLink = 'View payment history';
  }

  return (
    <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
      <div className="flex items-start gap-4">
        {/* Left */}
        <div className="flex-1 min-w-0">
          <p className="text-foreground/50 text-xs flex items-center gap-1">
            {leftLabel} <RiInformationLine className="h-3 w-3 shrink-0" />
          </p>
          <p className="text-foreground font-bold text-xl mt-1 leading-tight truncate">{formatCurrency(leftValue)}</p>
          {showLeftChange && (
            <p className={cn('text-xs mt-1 font-semibold', isPositive ? theme.accentText : 'text-red-400')}>
              {isPositive ? '↑' : '↓'} {Math.abs(changePercent).toFixed(1)}% Since investment
            </p>
          )}
        </div>

        <div className="w-px h-14 bg-foreground/10 shrink-0" />

        {/* Right */}
        <div className="flex-1 min-w-0">
          <p className="text-foreground/50 text-xs flex items-center gap-1">
            {rightLabel} <RiInformationLine className="h-3 w-3 shrink-0" />
          </p>
          <p className="text-foreground font-bold text-xl mt-1 leading-tight truncate">{formatCurrency(rightValue)}</p>
          {showRightChange && (
            <p className={cn('text-xs mt-1 font-semibold', isPositive ? theme.accentText : 'text-red-400')}>
              ({isPositive ? '+' : ''}{changePercent.toFixed(0)}%)
            </p>
          )}
          {showAmountPaid && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-foreground/50 text-xs">Amount Paid</span>
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full text-white', theme.accentBg)}>
                {inv.progressPercent.toFixed(0)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {note && <p className="text-foreground/40 text-xs mt-3">{note}</p>}

      <button className={cn('w-full text-center text-sm font-semibold mt-3 pt-3 border-t border-foreground/10', theme.accentText)}>
        {perfLink}
      </button>
    </div>
  );
}

// ─── Investment Progress (Land Banking / Fractional) ─────────────────────────

function ProgressSection({
  steps,
  infoText,
  theme,
}: {
  steps: InvestmentProgressStep[];
  infoText?: string | null;
  theme: ModelTheme;
}) {
  return (
    <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
      <h2 className="text-foreground font-bold text-base mb-5">Investment Progress</h2>

      <div className="flex items-start">
        {steps.map((step, i) => {
          const prevCompleted = steps[i - 1]?.status === 'completed';
          const isCompleted = step.status === 'completed';
          const isCurrent = step.status === 'current';

          return (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div className="flex items-center w-full">
                {/* Left connector */}
                {i > 0
                  ? <div className={cn('flex-1 h-0.5', prevCompleted ? theme.accentBg : 'bg-foreground/15')} />
                  : <div className="flex-1" />}

                {/* Dot */}
                <div className={cn(
                  'w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0',
                  isCompleted
                    ? cn('border-transparent', theme.accentBg)
                    : isCurrent
                      ? 'bg-background border-green-500'
                      : 'bg-background border-foreground/20',
                )}>
                  {isCompleted && <RiCheckLine className="h-4 w-4 text-white" />}
                  {isCurrent && <div className="w-3 h-3 rounded-full bg-green-500" />}
                </div>

                {/* Right connector */}
                {i < steps.length - 1
                  ? <div className={cn('flex-1 h-0.5', isCompleted ? theme.accentBg : 'bg-foreground/15')} />
                  : <div className="flex-1" />}
              </div>

              {/* Labels */}
              <div className="mt-2 px-1 text-center">
                <p className="text-foreground/60 text-[11px] font-medium">{step.title}</p>
                {step.subtitle && (
                  <p className={cn('text-[10px] font-semibold', theme.accentText)}>{step.subtitle}</p>
                )}
                {step.date && (
                  <p className="text-foreground/40 text-[10px] mt-0.5">{step.date}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {infoText && (
        <div className={cn('mt-5 rounded-xl p-4 border', theme.lightBg, theme.borderLight)}>
          <p className="text-foreground/70 text-sm leading-relaxed">{infoText}</p>
          <button className={cn('text-sm font-semibold mt-2', theme.accentText)}>Learn More</button>
        </div>
      )}
    </div>
  );
}

// ─── Project Manager card ─────────────────────────────────────────────────────

function ProjectManagerCard({ inv, theme }: { inv: Investment; theme: ModelTheme }) {
  return (
    <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
      <p className="text-foreground/50 text-[11px] font-semibold mb-3 uppercase tracking-widest">
        Project Manager
      </p>
      <div className="flex items-center gap-3">
        {inv.projectManagerImageUrl ? (
          <img
            src={inv.projectManagerImageUrl}
            alt={inv.projectManagerName ?? 'PM'}
            className="w-12 h-12 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0', theme.accentBg)}>
            {(inv.projectManagerName ?? 'P')[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-semibold text-sm uppercase tracking-wide truncate">
            {inv.projectManagerName}
          </p>
          {inv.projectManagerContact && (
            <p className="text-foreground/50 text-xs mt-0.5">{inv.projectManagerContact}</p>
          )}
        </div>
        {inv.projectManagerContact && (
          <a
            href={`tel:${inv.projectManagerContact}`}
            className={cn('w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0', theme.accentBg)}
            aria-label="Call project manager"
          >
            <RiPhoneLine className="h-5 w-5" />
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Current Development Stage ────────────────────────────────────────────────

function DevelopmentStageSection({ inv, theme }: { inv: Investment; theme: ModelTheme }) {
  return (
    <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
      <h2 className="text-foreground font-bold text-sm mb-3">Current Development Stage</h2>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-foreground font-semibold text-sm">{inv.currentDevelopmentStageTitle}</p>
          {inv.currentDevelopmentStageDate && (
            <p className="text-foreground/50 text-xs mt-0.5">
              {formatDate(inv.currentDevelopmentStageDate, { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
        <RiArrowRightSLine className="h-5 w-5 text-foreground/30 shrink-0" />
      </div>
      <button className={cn('text-sm font-semibold mt-3', theme.accentText)}>
        View all development stages
      </button>
    </div>
  );
}

// ─── Investment Information ────────────────────────────────────────────────────

function InvestmentInfoSection({ inv }: { inv: Investment }) {
  const type = inv.type;

  // 2-col grid (label above, value below) for most models
  const gridItems = (() => {
    if (type === 'land_banking') {
      return [
        { label: 'Investment ID', value: inv.reference },
        { label: 'Number of Plots', value: String(inv.numberOfPlots ?? inv.unitsOwnedLabel) },
        { label: 'Investment Date', value: formatDate(inv.startedAt, { day: 'numeric', month: 'short', year: 'numeric' }) },
        { label: 'Plot Size', value: inv.plotSizeLabel ?? inv.plotSize ?? '—' },
        { label: 'Payment Plan', value: inv.paymentPlan ?? '—' },
        { label: 'Location', value: inv.location },
      ];
    }
    if (type === 'co_development' || type === 'save_to_own') {
      return [
        { label: 'Investment ID', value: inv.reference },
        { label: 'Payment Frequency', value: inv.paymentFrequency ?? '—' },
        { label: 'Investment Date', value: formatDate(inv.startedAt, { day: 'numeric', month: 'short', year: 'numeric' }) },
        {
          label: 'Next Payment',
          value: inv.nextPaymentDate
            ? formatDate(inv.nextPaymentDate, { day: 'numeric', month: 'short', year: 'numeric' })
            : '—',
        },
        { label: 'Payment Plan', value: inv.paymentPlan ?? '—' },
        { label: 'Remaining Installments', value: inv.remainingInstallmentsLabel ?? '—' },
      ];
    }
    if (type === 'fractional') {
      return [
        { label: 'Investment ID', value: inv.reference },
        { label: 'Shares Owned', value: inv.unitsOwnedLabel },
        { label: 'Investment Date', value: formatDate(inv.startedAt, { day: 'numeric', month: 'short', year: 'numeric' }) },
        { label: 'Payment Frequency', value: inv.paymentFrequency ?? '—' },
        { label: 'Payment Plan', value: inv.paymentPlan ?? '—' },
        { label: 'Remaining Installments', value: inv.remainingInstallmentsLabel ?? '—' },
      ];
    }
    return null;
  })();

  // Label | value rows for outright
  const rowItems = type === 'outright' ? [
    { label: 'Reference', value: inv.reference },
    { label: 'Units Owned', value: inv.unitsOwnedLabel },
    { label: 'Total Commitment', value: formatCurrency(inv.totalCommitment) },
    { label: 'Purchase Date', value: formatDate(inv.startedAt, { day: 'numeric', month: 'short', year: 'numeric' }) },
    {
      label: 'Last Updated',
      value: inv.lastUpdatedAt
        ? formatDate(inv.lastUpdatedAt, { day: 'numeric', month: 'short', year: 'numeric' })
        : '—',
    },
  ] : null;

  if (!gridItems && !rowItems) return null;

  const sectionTitle = type === 'outright' ? 'Purchase Information' : 'Investment Information';
  const showCalIcon = type === 'co_development' || type === 'save_to_own';

  return (
    <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-foreground font-bold text-sm">{sectionTitle}</h2>
        {showCalIcon && (
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <RiCalendarLine className="h-4 w-4 text-blue-400" />
          </div>
        )}
      </div>

      {/* 2-col grid */}
      {gridItems && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          {gridItems.map((item) => (
            <div key={item.label}>
              <p className="text-foreground/40 text-[11px]">{item.label}</p>
              <p className="text-foreground text-xs font-semibold mt-0.5 wrap-break-word">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Label | value rows */}
      {rowItems && (
        <div>
          {rowItems.map((item, i) => (
            <div
              key={item.label}
              className={cn(
                'flex items-start justify-between gap-4 py-3',
                i < rowItems.length - 1 && 'border-b border-foreground/8',
              )}
            >
              <span className="text-foreground/50 text-xs shrink-0">{item.label}</span>
              <span className="text-foreground text-xs font-semibold text-right wrap-break-word max-w-[60%]">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── About section ─────────────────────────────────────────────────────────────

function AboutSection({ inv }: { inv: Investment }) {
  const label = inv.aboutLabel
    ?? (inv.type === 'land_banking' ? 'About This Land' : 'About This Property');
  return (
    <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
      <h2 className="text-foreground font-bold text-sm mb-2">{label}</h2>
      <p className="text-foreground/60 text-sm leading-relaxed">{inv.description}</p>
    </div>
  );
}

// ─── Investment Documents ──────────────────────────────────────────────────────

function DocumentsSection({ inv }: { inv: Investment }) {
  const apiDocs = inv.documents ?? [];

  const downloadFile = async (fetcher: () => Promise<Blob>, filename: string) => {
    try {
      const blob = await fetcher();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download file');
    }
  };

  const DocRow = ({
    name,
    sub,
    onClick,
    href,
    last,
  }: {
    name: string;
    sub?: string;
    onClick?: () => void;
    href?: string;
    last?: boolean;
  }) => {
    const inner = (
      <>
        <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
          <RiFileTextLine className="h-4 w-4 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground text-sm font-semibold truncate">{name}</p>
          <p className="text-foreground/40 text-xs">{sub ?? 'PDF document'}</p>
        </div>
        <div className="flex items-center gap-1.5 text-accent shrink-0">
          <span className="text-xs font-semibold">View</span>
          <RiDownload2Line className="h-4 w-4" />
        </div>
      </>
    );

    const cls = cn(
      'flex items-center gap-3 px-4 py-3.5 w-full text-left hover:bg-foreground/5 transition-colors',
      !last && 'border-b border-foreground/8',
    );

    if (href) {
      return <a href={href} target="_blank" rel="noreferrer" className={cls}>{inner}</a>;
    }
    return <button onClick={onClick} className={cls}>{inner}</button>;
  };

  const fixedDocs = [
    {
      name: 'Payment Receipt',
      onClick: () => downloadFile(() => investmentsApi.getReceipt(inv.id), `receipt-${inv.reference}.pdf`),
    },
    {
      name: 'Certificate of Ownership',
      onClick: () => downloadFile(() => investmentsApi.getCertificate(inv.id), `certificate-${inv.reference}.pdf`),
    },
  ];

  const totalRows = apiDocs.length + fixedDocs.length;

  return (
    <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/10">
        <h2 className="text-foreground font-bold text-sm">Investment Documents</h2>
        <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <RiFileTextLine className="h-4 w-4 text-blue-400" />
        </div>
      </div>

      {apiDocs.map((doc, i) => (
        <DocRow
          key={doc.id ?? doc.name}
          name={doc.name}
          sub={doc.sizeLabel}
          href={doc.url}
          last={i === totalRows - 1}
        />
      ))}

      {fixedDocs.map(({ name, onClick }, i) => (
        <DocRow
          key={name}
          name={name}
          onClick={onClick}
          last={apiDocs.length + i === totalRows - 1}
        />
      ))}
    </div>
  );
}

// ─── Bottom action bar ─────────────────────────────────────────────────────────

function ActionBar({ inv, theme }: { inv: Investment; theme: ModelTheme }) {
  const navigate = useNavigate();
  const canResell = !['exited', 'pending_resale', 'pending'].includes(inv.status);
  const hasBuyBack = inv.type === 'land_banking';

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-30 bg-background/95 backdrop-blur-md border-t border-foreground/10 px-4 py-3 space-y-2">
      <div className="flex items-center gap-2 max-w-screen-sm mx-auto">
        <Button
          variant="outline"
          className="flex-1 h-12 rounded-xl font-semibold border-foreground/20 text-foreground/60"
          onClick={() => navigate(`/investor/portfolio/${inv.id}/payments`)}
        >
          My Payments
        </Button>
        {canResell && (
          <Button
            className={cn('flex-1 h-12 rounded-xl font-semibold text-white border-0', theme.accentBtn)}
            onClick={() => navigate('/investor/resales')}
          >
            Resell
          </Button>
        )}
      </div>
      {hasBuyBack && (
        <div className="max-w-screen-sm mx-auto">
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl font-semibold border-foreground/20 text-foreground"
            onClick={() => navigate('/investor/exits')}
          >
            Buy Back
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function InvestmentDetail() {
  const { investmentId } = useParams<{ investmentId: string }>();
  const { investment: inv, isLoading } = useInvestmentDetail(investmentId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!inv) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-foreground/40 text-sm">Investment not found.</p>
      </div>
    );
  }

  const theme = MODEL_THEME[inv.type] ?? MODEL_THEME.fractional;
  const hasPM = !!inv.projectManagerName;
  const pmAtBottom = inv.type === 'land_banking';
  const pmLabel = inv.type === 'land_banking'
    ? 'Have questions about this land?'
    : inv.type === 'outright'
      ? 'Have questions about this property?'
      : 'Have questions about this investment?';

  return (
    <div className="pb-32 space-y-4">
      {/* Header card */}
      <HeaderCard inv={inv} theme={theme} />

      {/* Financial card */}
      <FinancialCard inv={inv} theme={theme} />

      {/* Progress timeline (land_banking / fractional) */}
      {(inv.progressTimeline?.length ?? 0) > 0 && (
        <ProgressSection steps={inv.progressTimeline!} infoText={inv.progressInfoText} theme={theme} />
      )}

      {/* Project Manager — appears early for outright / co_dev / fractional */}
      {hasPM && !pmAtBottom && (
        <>
          <p className="text-foreground font-semibold text-sm">{pmLabel}</p>
          <ProjectManagerCard inv={inv} theme={theme} />
        </>
      )}

      {/* Current Development Stage */}
      {inv.currentDevelopmentStageTitle && (
        <DevelopmentStageSection inv={inv} theme={theme} />
      )}

      {/* Investment / Purchase Information */}
      <InvestmentInfoSection inv={inv} />

      {/* About section */}
      {inv.description && <AboutSection inv={inv} />}

      {/* Investment Documents */}
      <DocumentsSection inv={inv} />

      {/* Project Manager — appears at bottom for land_banking */}
      {hasPM && pmAtBottom && (
        <>
          <p className="text-foreground font-semibold text-sm">{pmLabel}</p>
          <ProjectManagerCard inv={inv} theme={theme} />
        </>
      )}

      {/* Fixed action bar */}
      <ActionBar inv={inv} theme={theme} />
    </div>
  );
}
