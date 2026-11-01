import { Fragment, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PaymentsSheet } from '@/components/investment/PaymentsSheet';
import { PerformanceSheet } from '@/components/investment/PerformanceSheet';
import { MilestonesSheet } from '@/components/investment/MilestonesSheet';
import { BuyBackSheet } from '@/components/buybacks/BuyBackSheet';
import {
  FractionalHeader,
  FractionalInfo,
  FractionalSummaryCards,
  RecentPayouts,
} from '@/components/investment/fractional/FractionalDetail';
import {
  SaveToOwnHeader,
  SaveToOwnOverview,
  SaveToOwnPaymentHistory,
  SaveToOwnProgress,
  SaveToOwnTotals,
} from '@/components/investment/saveToOwn/SaveToOwnDetail';
import { PayoutHistorySheet } from '@/components/investment/fractional/PayoutHistorySheet';
import { DetailHeader, investmentImage } from '@/components/investment/DetailHeader';
import { ExitInvestmentSheet } from '@/components/exits/ExitInvestmentSheet';
import { ExitDetailSheet } from '@/components/exits/ExitDetailSheet';
import { BuyBackDetailSheet } from '@/components/buybacks/BuyBackDetailSheet';
import {
  RiMapPinLine,
  RiCheckLine,
  RiPhoneLine,
  RiFileTextLine,
  RiDownload2Line,
  RiArrowRightSLine,
  RiFileLine,
  RiInformationLine,
  RiBuildingLine,
  RiArrowUpSFill,
  RiArrowDownSFill,
} from 'react-icons/ri';
import { useInvestmentDetail } from '@/hooks/useInvestment';
import { useEligibleResales } from '@/hooks/useResales';
import { investmentsApi } from '@/api/investments.api';
import { formatCurrency, formatDate, whatsappLink, openFileInNewTab } from '@/lib/utils';
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
    headerBg: 'bg-orange-700',
    accentBg: 'bg-orange-500',
    accentBtn: 'bg-orange-600 hover:bg-orange-700',
    accentText: 'text-orange-400',
    lightBg: 'bg-orange-500/10',
    borderLight: 'border-orange-500/20',
  },
  outright: {
    headerBg: 'bg-amber-700',
    accentBg: 'bg-amber-500',
    accentBtn: 'bg-amber-500 hover:bg-amber-600',
    accentText: 'text-amber-400',
    lightBg: 'bg-amber-500/10',
    borderLight: 'border-amber-500/20',
  },
  co_development: {
    headerBg: 'bg-emerald-700',
    accentBg: 'bg-emerald-500',
    accentBtn: 'bg-emerald-600 hover:bg-emerald-700',
    accentText: 'text-emerald-400',
    lightBg: 'bg-emerald-500/10',
    borderLight: 'border-emerald-500/20',
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

// Co-development, land banking and outright don't send currentValueChangePercent:
// work it out from current value vs. amount invested. Other types keep the API's figure.
function valueChangePercent(inv: Investment): number {
  if (inv.type === 'co_development' || inv.type === 'land_banking' || inv.type === 'outright') {
    return inv.totalInvested > 0 ? ((inv.currentValue - inv.totalInvested) / inv.totalInvested) * 100 : 0;
  }
  return inv.currentValueChangePercent ?? 0;
}

// Link back to the listing, as fractional and save-to-own already have (DetailHeader).
// The slug lives on the frozen property snapshot as `propertySlug`.
const PROPERTY_LINK_TEXT: Partial<Record<InvestmentModelType, string>> = {
  land_banking: 'text-orange-700',
  outright: 'text-amber-700',
  co_development: 'text-emerald-700',
};

function PropertyLink({ inv }: { inv: Investment }) {
  const snap = (inv.snapshot ?? {}) as Record<string, unknown>;
  const slug = [snap.slug, snap.propertySlug].find((v): v is string => typeof v === 'string' && !!v);
  if (!slug) return null;
  return (
    <Link
      to={`/investor/marketplace/${slug}`}
      className={cn(
        'inline-block mt-4 bg-white font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-white/90 transition-colors',
        PROPERTY_LINK_TEXT[inv.type] ?? 'text-foreground',
      )}
    >
      View Property details
    </Link>
  );
}

function HeaderCard({ inv, theme }: { inv: Investment; theme: ModelTheme }) {
  const type = inv.type;

  const image = investmentImage(inv);
  const Thumbnail = () =>
    image ? (
      <img src={image} alt={inv.title} className="w-20 h-20 rounded-xl object-cover shrink-0" />
    ) : (
      <div className="w-20 h-20 rounded-xl bg-white/10 shrink-0 flex items-center justify-center">
        <RiBuildingLine className="h-8 w-8 text-white/30" />
      </div>
    );

  // Co-Development (Figma, Nov 2026): shared header, thumbnail + 3-col grid of five stats
  if (type === 'co_development') {
    const snap = (inv.snapshot ?? {}) as Record<string, unknown>;
    const config = (snap.config ?? {}) as Record<string, unknown>;
    const pick = (...vals: unknown[]) => vals.find((v): v is string => typeof v === 'string' && !!v);
    const date = (d?: string | null) => (d ? formatDate(d, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
    const stats = [
      { label: 'Project Progress', value: inv.progressLabel },
      { label: 'Project End Date', value: date(inv.projectEndDate ?? pick(config.projectEndDate, snap.projectEndDate)) },
      { label: 'Project Start Date', value: date(pick(config.projectStartDate, snap.projectStartDate)) },
      { label: 'Project Duration', value: pick(config.projectDuration) ?? '—' },
      { label: 'Units', value: inv.unitsOwnedLabel },
    ];

    return (
      <DetailHeader
        inv={inv}
        statusChip={<StatusChip status={inv.status} label={inv.statusLabel} />}
        propertyType={inv.propertyKindLabel}
        slug={pick(snap.slug, snap.propertySlug)}
        stats={stats}
        bgClass={theme.headerBg}
        linkClass="text-emerald-700"
        statsGridClass="grid-cols-2 sm:grid-cols-3"
      />
    );
  }

  // Land Banking (Figma, Nov 2026): shared header, four stats
  if (type === 'land_banking') {
    const snap = (inv.snapshot ?? {}) as Record<string, unknown>;
    return (
      <DetailHeader
        inv={inv}
        statusChip={<StatusChip status={inv.status} label={inv.statusLabel} />}
        propertyType={inv.propertyKindLabel}
        slug={typeof snap.propertySlug === 'string' ? snap.propertySlug : undefined}
        stats={[
          { label: 'Reservation Period', value: inv.reservationPeriodLabel ?? '—' },
          { label: 'Your Ownership', value: inv.unitsOwnedLabel },
          // Plot Size hidden until the backend stores it (not on the property or investment, Nov 2026)
          // { label: 'Plot Size', value: '—' },
          {
            label: 'Maturity Date',
            value: inv.reservationEndsAt
              ? formatDate(inv.reservationEndsAt, { day: 'numeric', month: 'short', year: 'numeric' })
              : '—',
          },
        ]}
        bgClass={theme.headerBg}
        linkClass="text-orange-700"
        statsGridClass="grid-cols-2 sm:grid-cols-3"
      />
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
              {inv.propertyKindLabel && <ModelBadge>{inv.propertyKindLabel}</ModelBadge>}
              <StatusChip status={inv.status} label={inv.statusLabel} />
            </div>
            <div className="flex items-center gap-1 mt-1.5 text-white/60 text-xs">
              <RiMapPinLine className="h-3 w-3 shrink-0" />
              {inv.location}
            </div>
            <p className="text-white/80 text-xs font-semibold mt-1.5">{inv.progressLabel}</p>
          </div>
        </div>
        <PropertyLink inv={inv} />
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

// Co-development, land banking + outright (Figma, Nov 2026): amount paid over Current Value, then a tinted performance button
function ValueCard({
  inv,
  topLabel,
  topValue,
  note,
  perfLabel,
  onPerfOpen,
}: {
  inv: Investment;
  topLabel: string;
  topValue: number;
  note?: string | null;
  perfLabel: string;
  onPerfOpen: () => void;
}) {
  const changePercent = valueChangePercent(inv);
  const up = changePercent >= 0;
  const Arrow = up ? RiArrowUpSFill : RiArrowDownSFill;

  return (
    <div className="bg-card border border-foreground/5 rounded-3xl p-4">
      <p className="text-foreground/50 text-sm">{topLabel}</p>
      <p className="text-foreground font-bold text-lg mt-1 pb-3 border-b border-foreground/10 truncate">
        {formatCurrency(topValue)}
      </p>
      <p className="text-foreground/50 text-sm mt-3">Current value</p>
      <div className="flex items-center gap-3 mt-1 min-w-0">
        <p className="text-foreground font-bold text-lg truncate">{formatCurrency(inv.currentValue)}</p>
        <span
          className={cn(
            'flex items-center text-sm shrink-0',
            up ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
          )}
        >
          <Arrow className="h-6 w-6 -mr-0.5" aria-hidden />
          {Math.abs(changePercent).toFixed(changePercent % 1 ? 1 : 0)}%
        </span>
      </div>
      {note && <p className="text-foreground/50 text-sm mt-2">{note}</p>}
      <button
        onClick={onPerfOpen}
        className="flex items-center gap-3 mt-4 bg-accent/10 hover:bg-accent/15 text-accent text-sm font-medium px-4 py-3 rounded-xl transition-colors"
      >
        {perfLabel} <RiArrowRightSLine className="h-5 w-5" />
      </button>
    </div>
  );
}

function FinancialCard({ inv, theme, onPerfOpen }: { inv: Investment; theme: ModelTheme; onPerfOpen: () => void }) {
  const type = inv.type;
  if (type === 'co_development' || type === 'land_banking') {
    return (
      <ValueCard
        inv={inv}
        topLabel="Total Invested"
        topValue={inv.totalInvested}
        note={type === 'land_banking' ? 'Excluding management fees' : 'excluding management fees'}
        perfLabel={type === 'land_banking' ? 'View land performance' : 'View investment performance'}
        onPerfOpen={onPerfOpen}
      />
    );
  }
  if (type === 'outright') {
    return (
      <ValueCard
        inv={inv}
        topLabel="Total Paid"
        topValue={inv.totalCommitment}
        note={inv.currentValueNote}
        perfLabel="View property performance"
        onPerfOpen={onPerfOpen}
      />
    );
  }
  const changePercent = valueChangePercent(inv);
  const isPositive = changePercent >= 0;

  let leftLabel: string;
  let leftValue: number;
  let rightLabel: string;
  let rightValue: number;
  let perfLink: string;
  let showLeftChange = false;

  if (type === 'fractional') {
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
    <div className="bg-white dark:bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
      <div className="flex items-start gap-4">
        {/* Left */}
        <div className="flex-1 min-w-0">
          <p className="text-foreground/50 text-xs flex items-center gap-1">
            {leftLabel} <RiInformationLine className="h-3 w-3 shrink-0" />
          </p>
          <p className="text-foreground font-bold text-xl xl:text-base mt-1 leading-tight truncate">{formatCurrency(leftValue)}</p>
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
          <p className="text-foreground font-bold text-xl xl:text-base mt-1 leading-tight truncate">{formatCurrency(rightValue)}</p>
        </div>
      </div>

      <button
        onClick={onPerfOpen}
        className={cn('w-full text-center text-sm font-semibold mt-3 pt-3 border-t border-foreground/10', theme.accentText)}
      >
        {perfLink}
      </button>
    </div>
  );
}

// ─── Investment Progress (Land Banking / Fractional) ─────────────────────────
// Oct 2026 design: first label left, middle centred, last right; green track; mint note card

function ProgressSection({
  steps,
  infoText,
  onDocuments,
}: {
  steps: InvestmentProgressStep[];
  infoText?: string | null;
  onDocuments: () => void;
}) {
  const last = steps.length - 1;
  return (
    <div className="bg-card border border-foreground/5 rounded-3xl p-4">
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 className="text-foreground font-bold text-base">Investment Progress</h2>
        <button
          onClick={onDocuments}
          aria-label="View investment documents"
          className="w-9 h-9 -mr-2 rounded-full flex items-center justify-center text-foreground hover:bg-foreground/10 transition-colors"
        >
          <RiFileLine className="h-5 w-5" />
        </button>
      </div>

      {/* Track */}
      <div className="flex items-center">
        {steps.map((step, i) => {
          const isCompleted = step.status === 'completed';
          const isCurrent = step.status === 'current';
          return (
            <Fragment key={i}>
              <div
                className={cn(
                  'w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0',
                  isCompleted
                    ? 'bg-green-600 border-green-600'
                    : isCurrent
                      ? 'bg-green-100 border-green-600 dark:bg-green-500/15'
                      : 'bg-background border-foreground/15'
                )}
              >
                {isCompleted && <RiCheckLine className="h-4 w-4 text-white" />}
                {isCurrent && <div className="w-2.5 h-2.5 rounded-sm bg-green-600" />}
              </div>
              {i < last && (
                <div className={cn('flex-1 h-0.5 mx-1', isCompleted ? 'bg-green-600' : 'bg-foreground/10')} />
              )}
            </Fragment>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex justify-between gap-2 mt-3 pb-4 border-b border-foreground/10">
        {steps.map((step, i) => (
          <div
            key={i}
            className={cn('min-w-0 flex-1', i === 0 ? 'text-left' : i === last ? 'text-right' : 'text-center')}
          >
            <p className="text-foreground font-bold text-sm">{step.title}</p>
            <p className="text-foreground/50 text-xs mt-1">
              {step.date ?? step.subtitle ?? (step.status === 'current' ? 'In Progress' : '')}
            </p>
          </div>
        ))}
      </div>

      {infoText && (
        <div className="mt-4 rounded-3xl p-4 bg-emerald-100 dark:bg-emerald-500/15">
          <p className="text-foreground text-sm leading-relaxed">{infoText}</p>
        </div>
      )}
    </div>
  );
}

// ─── Project Manager card ─────────────────────────────────────────────────────

function ProjectManagerCard({ inv, theme }: { inv: Investment; theme: ModelTheme }) {
  return (
    <div className="bg-white dark:bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
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
          <>
            <a
              href={whatsappLink(inv.projectManagerContact)}
              target="_blank"
              rel="noreferrer"
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity"
              aria-label="WhatsApp project manager"
            >
              <img src="/resources/whatsapp.png" alt="" className="h-9 w-9" />
            </a>
            <a
              href={`tel:${inv.projectManagerContact}`}
              className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0', theme.accentBg)}
              aria-label="Call project manager"
            >
              <RiPhoneLine className="h-4 w-4" />
            </a>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Current Development Stage ────────────────────────────────────────────────

type StageRow = { title: string; date?: string | null };

// Current stage (isCurrentStage) + the one after it, from the investment's milestones (co-development)
function developmentStageRows(inv: Investment): StageRow[] {
  const ms = [...(inv.milestones ?? [])].sort((a, b) => a.stepNumber - b.stepNumber);
  const idx = ms.findIndex((m) => m.isCurrentStage);
  return idx >= 0 ? ms.slice(idx, idx + 2).map((m) => ({ title: m.title, date: m.targetDate })) : [];
}

function DevelopmentStageSection({ inv, theme, onOpen }: { inv: Investment; theme: ModelTheme; onOpen: () => void }) {
  const rows = developmentStageRows(inv);
  if (!rows.length) return null;

  return (
    <div className="bg-white dark:bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
      <h2 className="text-foreground font-bold text-sm mb-1">Current Development Stage</h2>
      {rows.map((row, i) => (
        <button
          key={`${row.title}-${i}`}
          onClick={onOpen}
          className="w-full flex items-center justify-between gap-3 py-3 border-b border-foreground/10 text-left"
        >
          <div className="min-w-0">
            <p className="text-foreground font-semibold text-sm">{row.title}</p>
            {row.date && (
              <p className="text-foreground/50 text-xs mt-0.5">
                {formatDate(row.date, { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
          <RiArrowRightSLine className="h-5 w-5 text-foreground/30 shrink-0" />
        </button>
      ))}
      <button onClick={onOpen} className={cn('text-sm font-semibold mt-3', theme.accentText)}>
        View all development stages
      </button>
    </div>
  );
}

// ─── Investment Information ────────────────────────────────────────────────────

type ApiPayment = { dueDate: string; status: string; paidAt?: string | null };

// "August 4, 2026", as on the land banking and outright designs
const usLongDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';

/**
 * Land banking progress (Figma, Nov 2026): Payment → Holding Period → Maturity.
 * The API sends no progressTimeline, so it's read off the payments schedule and reservationEndsAt.
 */
function landBankingProgress(inv: Investment): { steps: InvestmentProgressStep[]; infoText: string } {
  const payments = (inv as unknown as { payments?: ApiPayment[] }).payments ?? [];
  const allPaid = payments.every((p) => p.status === 'paid');
  const lastPaidAt = payments
    .map((p) => p.paidAt)
    .filter((d): d is string => !!d)
    .sort()
    .pop();
  const maturity = inv.reservationEndsAt;
  const matured = !!maturity && new Date(maturity).getTime() <= Date.now();

  const steps: InvestmentProgressStep[] = [
    allPaid
      ? { title: 'Payment', status: 'completed', date: usLongDate(lastPaidAt ?? inv.startedAt) }
      : { title: 'Payment', status: 'current', subtitle: 'In Progress' },
    {
      title: 'Holding Period',
      status: matured ? 'completed' : allPaid ? 'current' : 'upcoming',
      subtitle: matured ? 'Completed' : allPaid ? 'In Progress' : 'Upcoming',
    },
    {
      title: 'Maturity',
      status: matured ? 'completed' : 'upcoming',
      date: maturity ? usLongDate(maturity) : null,
      subtitle: 'Upcoming',
    },
  ];

  const infoText = !allPaid
    ? 'Complete your payments to start the holding period.'
    : matured
      ? 'Your land has reached maturity.'
      : 'You are in the holding period. Your land asset is appreciating in value over time';

  return { steps, infoText };
}

// Co-development + land banking: derived from the payments schedule and checkout snapshot
function paymentInfo(inv: Investment) {
  const payments = (inv as unknown as { payments?: ApiPayment[] }).payments ?? [];
  const unpaid = payments
    .filter((p) => p.status !== 'paid')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const checkout = (inv.snapshot as { checkout?: { initialPayment: number; totalCommitment: number } } | null | undefined)
    ?.checkout;
  const isFullPayment = checkout ? checkout.initialPayment >= checkout.totalCommitment : null;

  return {
    nextPaymentDate: unpaid[0]?.dueDate ?? null,
    paymentPlan: isFullPayment == null ? null : isFullPayment ? 'Full Payment' : 'Installments',
    remainingInstallments: isFullPayment === false ? String(unpaid.length) : null,
  };
}

function InvestmentInfoSection({ inv }: { inv: Investment }) {
  const type = inv.type;

  // Land banking + co-development (Figma, Nov 2026): roomier 2-col grid with row dividers.
  // Everything is read off the payments schedule and checkout snapshot; field paths checked
  // against live responses for both types (Nov 2026).
  if (type === 'land_banking' || type === 'co_development') {
    const pay = paymentInfo(inv);
    const frequency = (inv.snapshot as { checkout?: { paymentFrequency?: string } } | null | undefined)?.checkout
      ?.paymentFrequency;
    const frequencyLabel = frequency ? frequency[0].toUpperCase() + frequency.slice(1) : '—';
    const payments = (inv as unknown as { payments?: ApiPayment[] }).payments ?? [];
    const fullyPaid = payments.length > 0 && payments.every((p) => p.status === 'paid');
    const nextPayment = fullyPaid ? 'Fully paid' : usLongDate(pay.nextPaymentDate);
    const rows =
      type === 'land_banking'
        ? [
            { label: 'Investment ID', value: inv.reference },
            { label: 'Number of Plots', value: inv.unitsOwnedLabel },
            { label: 'Investment Date', value: usLongDate(inv.startedAt) },
            // Plot Size hidden until the backend stores it (not on the property or investment, Nov 2026)
            // { label: 'Plot Size', value: '—' },
            { label: 'Payment Plan', value: pay.paymentPlan ?? '—' },
            { label: 'Payment Frequency', value: frequencyLabel },
            { label: 'Next Payment', value: nextPayment },
          ]
        : [
            { label: 'Investment ID', value: inv.reference },
            { label: 'Slots Purchased', value: inv.unitsOwnedLabel },
            { label: 'Investment Date', value: usLongDate(inv.startedAt) },
            { label: 'Payment Plan', value: pay.paymentPlan ?? '—' },
            { label: 'Payment Frequency', value: frequencyLabel },
            { label: 'Next Payment', value: nextPayment },
            { label: 'Remaining Installments', value: pay.remainingInstallments ?? '—' },
          ];
    // No divider under the last row (one item when the count is odd, two when even)
    const lastRowStart = rows.length - (rows.length % 2 || 2);
    return (
      <div className="bg-card border border-foreground/5 rounded-3xl p-4">
        <h2 className="text-foreground font-bold text-base mb-2">Investment Information</h2>
        <div className="grid grid-cols-2 gap-x-6">
          {rows.map(({ label, value }, i) => (
            <div key={label} className={cn('py-3 min-w-0', i < lastRowStart && 'border-b border-foreground/10')}>
              <p className="text-foreground/50 text-sm">{label}</p>
              <p className="text-foreground text-sm mt-1 wrap-break-word">{value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Label | value rows for outright (fractional and save-to-own render their own cards)
  const rowItems = type === 'outright' ? [
    { label: 'Reference', value: inv.reference },
    { label: 'Units Owned', value: inv.unitsOwnedLabel },
    { label: 'Purchase Price', value: formatCurrency(inv.totalCommitment) },
    // "August 4, 2026" as on the outright design
    {
      label: 'Purchase Date',
      value: new Date(inv.startedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    },
  ] : null;

  if (!rowItems) return null;

  return (
    <div className="bg-white dark:bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-foreground font-bold text-sm">Purchase Information</h2>
      </div>
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
    </div>
  );
}

// ─── About section ─────────────────────────────────────────────────────────────

function AboutSection({ inv }: { inv: Investment }) {
  const label = inv.aboutLabel
    ?? (inv.type === 'land_banking' ? 'About This Land' : 'About This Property');
  return (
    <div className="bg-white dark:bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
      <h2 className="text-foreground font-bold text-sm mb-2">{label}</h2>
      <p className="text-foreground/60 text-sm leading-relaxed">{inv.description}</p>
    </div>
  );
}

// ─── Investment Documents ──────────────────────────────────────────────────────

function DocumentsSection({ inv }: { inv: Investment }) {
  const apiDocs = inv.documents ?? [];

  // "View" opens the PDF in a new tab rather than downloading it
  const downloadFile = async (fetcher: () => Promise<Blob>, filename: string) => {
    try {
      await openFileInNewTab(fetcher, filename);
    } catch {
      toast.error('Failed to open file');
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
    <div className="bg-white dark:bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
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

function ActionBar({
  inv,
  theme,
  onPaymentsOpen,
  onBuyBack,
  onExit,
  onSaveNow,
}: {
  inv: Investment;
  theme: ModelTheme;
  onPaymentsOpen: () => void;
  onBuyBack: () => void;
  onExit: () => void;
  onSaveNow: () => void;
}) {
  const navigate = useNavigate();
  // Exit and buy back stay off once the holding is exited, pending or already listed
  const canAct = !['exited', 'pending_resale', 'pending'].includes(inv.status);
  const hasBuyBack = inv.type === 'land_banking';
  // Resell follows the backend's eligibility list (GET /resales/eligible), checked before the tap
  const { eligible, isLoading: eligibleLoading } = useEligibleResales();
  const resale = eligible.find((e) => e.investmentId === inv.id);

  // Save-to-own (Oct 2026 design): Save Now plus an outline Exit
  if (inv.type === 'save_to_own') {
    return (
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-30 bg-background/95 backdrop-blur-md border-t border-foreground/10 px-4 py-3">
        <div className="flex items-center gap-2 max-w-screen-sm mx-auto">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-xl font-semibold border-accent text-accent bg-transparent hover:bg-accent/10 hover:text-accent"
            disabled={!canAct}
            onClick={onExit}
          >
            Exit
          </Button>
          <Button
            className="flex-1 h-12 rounded-xl font-semibold text-white border-0 bg-accent hover:bg-accent/90"
            onClick={onSaveNow}
          >
            Save Now
          </Button>
        </div>
      </div>
    );
  }

  // Fractional (Oct 2026 design): no payments or resale, just Exit; payouts open from the page
  if (inv.type === 'fractional') {
    return (
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-30 bg-background/95 backdrop-blur-md border-t border-foreground/10 px-4 py-3">
        <div className="max-w-screen-sm mx-auto">
          <Button
            className="w-full h-12 rounded-xl font-semibold text-white border-0 bg-accent hover:bg-accent/90"
            disabled={!canAct}
            onClick={onExit}
          >
            Exit Investment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-30 bg-background/95 backdrop-blur-md border-t border-foreground/10 px-4 py-3 space-y-2">
      <div className="flex items-center gap-2 max-w-screen-sm mx-auto">
        <Button
          variant="outline"
          // Grey My Payments button on every footer (boss's call, Nov 2026)
          className="flex-1 h-12 rounded-xl font-semibold border-0 bg-foreground/10 text-foreground hover:bg-foreground/15 hover:text-foreground"
          onClick={onPaymentsOpen}
        >
          My Payments
        </Button>
        <Button
          className={cn('flex-1 h-12 rounded-xl font-semibold text-white border-0', theme.accentBtn)}
          disabled={!resale?.isEligible}
          onClick={() => navigate(`/investor/resales?resell=${inv.id}`)}
        >
          {eligibleLoading ? 'Checking…' : 'Resell'}
        </Button>
      </div>
      {hasBuyBack && (
        <div className="max-w-screen-sm mx-auto">
          <Button
            variant="outline"
            disabled={!canAct}
            onClick={onBuyBack}
            className="w-full h-12 rounded-xl font-semibold border-accent text-accent bg-transparent hover:bg-accent/10 hover:text-accent"
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
  const [openSheet, setOpenSheet] = useState<'payments' | 'performance' | 'milestones' | 'buyback' | 'payouts' | 'exit' | 'save' | null>(null);
  const [exitId, setExitId] = useState<string | null>(null);
  const [buybackId, setBuybackId] = useState<string | null>(null);

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
  const isFractional = inv.type === 'fractional';
  const isSaveToOwn = inv.type === 'save_to_own';
  const hasPM = !!inv.projectManagerName;
  const pmAtBottom = inv.type === 'land_banking';
  const pmLabel = inv.type === 'land_banking'
    ? 'Have questions about this land?'
    : inv.type === 'outright'
      ? 'Have questions about this property?'
      : 'Have questions about this investment?';

  return (
    <div className="pb-32 space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs">
        <Link to="/investor/portfolio" className="text-foreground/40 hover:text-foreground transition-colors">
          My Portfolio
        </Link>
        <RiArrowRightSLine className="h-3.5 w-3.5 text-foreground/30" />
        <span className="text-foreground/70 font-medium truncate">{inv.title}</span>
      </div>

      {/* Header card — full width on all breakpoints */}
      {isFractional ? (
        <FractionalHeader inv={inv} statusChip={<StatusChip status={inv.status} label={inv.statusLabel} />} />
      ) : isSaveToOwn ? (
        <SaveToOwnHeader inv={inv} statusChip={<StatusChip status={inv.status} label={inv.statusLabel} />} />
      ) : (
        <HeaderCard inv={inv} theme={theme} />
      )}

      {/* Financial card — mobile only; desktop version is in the sidebar */}
      <div className="xl:hidden">
        {isFractional ? (
          <FractionalSummaryCards inv={inv} />
        ) : isSaveToOwn ? (
          <SaveToOwnTotals inv={inv} onPayments={() => setOpenSheet('payments')} />
        ) : (
          <FinancialCard inv={inv} theme={theme} onPerfOpen={() => setOpenSheet('performance')} />
        )}
      </div>

      {/* Two-column layout: main content + sticky sidebar on xl (2fr / 1fr) */}
      <div className="flex flex-col xl:grid xl:grid-cols-[2fr_1fr] gap-4 items-start">

        {/* ── Main column ── */}
        <div className="w-full xl:flex-1 min-w-0 space-y-4">

          {/* Project Manager — mobile, early (non-land-banking) */}
          {hasPM && !pmAtBottom && (
            <div className="xl:hidden space-y-2">
              <p className="text-foreground font-semibold text-sm">{pmLabel}</p>
              <ProjectManagerCard inv={inv} theme={theme} />
            </div>
          )}

          {/* Development Stage — mobile only */}
          {developmentStageRows(inv).length > 0 && (
            <div className="xl:hidden">
              <DevelopmentStageSection inv={inv} theme={theme} onOpen={() => setOpenSheet('milestones')} />
            </div>
          )}

          {/* Investment / Purchase Information */}
          {isFractional ? (
            <>
              <FractionalInfo inv={inv} />
              <RecentPayouts inv={inv} onViewAll={() => setOpenSheet('payouts')} />
            </>
          ) : isSaveToOwn ? (
            <>
              <SaveToOwnOverview inv={inv} />
              <SaveToOwnProgress inv={inv} />
              <div className="xl:hidden">
                <SaveToOwnPaymentHistory inv={inv} onViewAll={() => setOpenSheet('payments')} />
              </div>
            </>
          ) : (
            <InvestmentInfoSection inv={inv} />
          )}

          {/* Development Stage — desktop, under Investment Information */}
          {developmentStageRows(inv).length > 0 && (
            <div className="hidden xl:block">
              <DevelopmentStageSection inv={inv} theme={theme} onOpen={() => setOpenSheet('milestones')} />
            </div>
          )}

          {/* Progress timeline, under Investment Information: land banking builds its own */}
          {inv.type === 'land_banking' ? (
            (() => {
              const { steps, infoText } = landBankingProgress(inv);
              return (
                <ProgressSection
                  steps={steps}
                  infoText={inv.progressInfoText ?? infoText}
                  onDocuments={() =>
                    document.getElementById('investment-documents')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                />
              );
            })()
          ) : !isSaveToOwn && (inv.progressTimeline?.length ?? 0) > 0 && (
            <ProgressSection
              steps={inv.progressTimeline!}
              infoText={inv.progressInfoText}
              onDocuments={() =>
                document.getElementById('investment-documents')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            />
          )}

          {/* About section */}
          {inv.description && <AboutSection inv={inv} />}

          {/* Investment Documents */}
          <div id="investment-documents" className="scroll-mt-20">
            <DocumentsSection inv={inv} />
          </div>

          {/* Project Manager — mobile, bottom (land_banking) */}
          {hasPM && pmAtBottom && (
            <div className="xl:hidden space-y-2">
              <p className="text-foreground font-semibold text-sm">{pmLabel}</p>
              <ProjectManagerCard inv={inv} theme={theme} />
            </div>
          )}
        </div>

        {/* ── Sidebar — desktop only ── */}
        <div className="hidden xl:flex min-w-0 flex-col gap-4 sticky top-20">
          {isFractional ? (
            <FractionalSummaryCards inv={inv} />
          ) : isSaveToOwn ? (
            <SaveToOwnTotals inv={inv} onPayments={() => setOpenSheet('payments')} />
          ) : (
            <FinancialCard inv={inv} theme={theme} onPerfOpen={() => setOpenSheet('performance')} />
          )}

          {hasPM && (
            <div className="space-y-2">
              <p className="text-foreground font-semibold text-sm">{pmLabel}</p>
              <ProjectManagerCard inv={inv} theme={theme} />
            </div>
          )}
          {isSaveToOwn && (
            <SaveToOwnPaymentHistory inv={inv} onViewAll={() => setOpenSheet('payments')} />
          )}
        </div>
      </div>

      {/* Fixed action bar */}
      <ActionBar
        inv={inv}
        theme={theme}
        onPaymentsOpen={() => setOpenSheet('payments')}
        onBuyBack={() => setOpenSheet('buyback')}
        onExit={() => setOpenSheet('exit')}
        onSaveNow={() => setOpenSheet('save')}
      />

      {/* Sheets */}
      <PaymentsSheet
        inv={inv}
        isOpen={openSheet === 'payments' || openSheet === 'save'}
        startPaying={openSheet === 'save'}
        onClose={() => setOpenSheet(null)}
      />
      <PerformanceSheet inv={inv} isOpen={openSheet === 'performance'} onClose={() => setOpenSheet(null)} />
      <MilestonesSheet inv={inv} isOpen={openSheet === 'milestones'} onClose={() => setOpenSheet(null)} />
      {inv.type === 'land_banking' && (
        <BuyBackSheet
          inv={inv}
          open={openSheet === 'buyback'}
          onClose={() => setOpenSheet(null)}
          onViewStatus={setBuybackId}
        />
      )}
      <BuyBackDetailSheet buybackId={buybackId} onClose={() => setBuybackId(null)} />
      {isFractional && (
        <PayoutHistorySheet inv={inv} isOpen={openSheet === 'payouts'} onClose={() => setOpenSheet(null)} />
      )}
      {(isFractional || isSaveToOwn) && (
        <ExitInvestmentSheet
          inv={inv}
          open={openSheet === 'exit'}
          onClose={() => setOpenSheet(null)}
          onViewStatus={setExitId}
        />
      )}
      <ExitDetailSheet exitId={exitId} onClose={() => setExitId(null)} />
    </div>
  );
}
