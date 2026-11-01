import { RiArrowRightSLine, RiInformationLine } from 'react-icons/ri';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import type { Investment, InvestmentPayout } from '@/types';
import { DetailHeader } from '../DetailHeader';
import { ProgressRing } from '../ProgressRing';

// Fractional ownership investment detail (Figma, Oct 2026).
// Field paths checked against a live GET /api/investments/:id response (Nov 2026):
// most live in fractionalSummary or the frozen property snapshot (snapshot.config).

type Dict = Record<string, unknown>;
const summaryOf = (inv: Investment) => (inv.fractionalSummary ?? {}) as Dict;
const snapshotOf = (inv: Investment) => (inv.snapshot ?? {}) as Dict;
const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

const shortDate = (d?: string | null) => (d ? formatDate(d, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
// "August 4, 2026" as on the Investment Information design
const longDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—';
const configOf = (inv: Investment) => (snapshotOf(inv).config ?? {}) as Dict;
/** "rental_yield" → "Rental yield" (raw enum; the API sends no label for it) */
const humanize = (v: unknown) => {
  const s = str(v)?.toLowerCase().replace(/_/g, ' ');
  return s ? s[0].toUpperCase() + s.slice(1) : undefined;
};
/** "FULL_PAYMENT" → "Full Payment" */
const titleCase = (v: unknown) => humanize(v)?.replace(/\b\w/g, (c) => c.toUpperCase());

const slotsOwned = (inv: Investment) => inv.quantity ?? 1;
const slotsLabel = (n: number) => `${n} Slot${n !== 1 ? 's' : ''}`;

/** Ownership share in percent: slots owned over the property's total shares (the API sends no percent) */
function ownershipPercent(inv: Investment): number | undefined {
  const total = num(configOf(inv).totalShares) ?? inv.inventoryTotal;
  return total ? Math.round((slotsOwned(inv) / total) * 1000) / 10 : undefined;
}

function monthsBetween(a?: string, b?: string | null): string | undefined {
  if (!a || !b) return undefined;
  const months = Math.round((new Date(b).getTime() - new Date(a).getTime()) / (30.44 * 86_400_000));
  return months > 0 ? `${months} month${months !== 1 ? 's' : ''}` : undefined;
}

// ─── Header ───────────────────────────────────────────────────────────────────

export function FractionalHeader({ inv, statusChip }: { inv: Investment; statusChip: React.ReactNode }) {
  const fs = summaryOf(inv);
  const snap = snapshotOf(inv);
  // Property kind (Apartment, Land…) as on the property details page
  const propertyType = inv.propertyKindLabel;
  // Slots still left to buy on the property
  const slotsAvailable = inv.inventoryAvailable;
  const slug = str(snap.propertySlug);
  const start = str(fs.investmentWindowStart) ?? inv.startedAt;
  const end = str(fs.investmentDurationEnd) ?? inv.maturityDate;

  const stats = [
    {
      label: 'Slots Available',
      value: slotsAvailable != null ? slotsLabel(slotsAvailable) : '—',
      sub: slotsAvailable && slug ? 'Tap to buy more' : undefined,
      to: slotsAvailable && slug ? `/investor/marketplace/${slug}` : undefined,
    },
    { label: 'Investment Start Date', value: shortDate(start) },
    { label: 'Investment Duration', value: monthsBetween(start, end) ?? '—' },
    { label: 'Next Payout', value: shortDate(str(fs.nextPayoutDate)) },
  ];

  return (
    <DetailHeader
      inv={inv}
      statusChip={statusChip}
      propertyType={propertyType}
      slug={slug}
      stats={stats}
      bgClass="bg-violet-700"
      linkClass="text-violet-700"
    />
  );
}

// ─── Investment information ───────────────────────────────────────────────────

export function FractionalInfo({ inv }: { inv: Investment }) {
  const fs = summaryOf(inv);
  const snap = snapshotOf(inv);
  const returnPct = num(fs.expectedReturnPercent);
  const rows: [string, string][] = [
    ['Investment ID', inv.reference],
    ['Investment Phase', str(fs.investmentPhaseLabel) ?? '—'],
    ['Return Type', humanize(snap.returnType) ?? '—'],
    ['Holding Period', longDate(str(fs.holdingPeriodEnd))],
    ['Payout Frequency', str(fs.payoutCycleLabel) ?? '—'],
    ['Next Payout', longDate(str(fs.nextPayoutDate))],
    ['Payment Plan', titleCase(configOf(inv).paymentOption) ?? '—'],
    ['Slots Purchased', slotsLabel(slotsOwned(inv))],
    ['Investment End', longDate(str(fs.investmentDurationEnd) ?? inv.maturityDate)],
    ['Returns', returnPct != null ? `${returnPct}%` : '—'],
  ];

  return (
    <div className="bg-card border border-foreground/5 rounded-3xl p-4">
      <h2 className="text-foreground font-bold text-base mb-2">Investment Information</h2>
      <div className="grid grid-cols-2 gap-x-6">
        {rows.map(([label, value], i) => (
          <div
            key={label}
            className={cn('py-3 min-w-0', i < rows.length - 2 && 'border-b border-foreground/10')}
          >
            <p className="text-foreground/50 text-sm">{label}</p>
            <p className="text-foreground text-sm mt-1 wrap-break-word">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Recent payouts ───────────────────────────────────────────────────────────

export function RecentPayouts({ inv, onViewAll }: { inv: Investment; onViewAll: () => void }) {
  const payouts = [...(inv.payouts ?? [])]
    .filter((p: InvestmentPayout) => ['paid', 'completed', 'successful'].includes(p.status?.toLowerCase()))
    .sort((a, b) => new Date(b.paidAt ?? 0).getTime() - new Date(a.paidAt ?? 0).getTime());

  return (
    <div className="bg-card border border-foreground/5 rounded-3xl p-4">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h2 className="text-foreground font-bold text-base">Recent Payouts</h2>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-violet-700 dark:text-violet-300 text-sm font-medium"
        >
          View all payouts <RiArrowRightSLine className="h-4 w-4" />
        </button>
      </div>
      {payouts.length === 0 ? (
        <p className="text-foreground/50 text-sm text-center py-6">No payouts yet</p>
      ) : (
        payouts.slice(0, 5).map((p) => (
          <div
            key={p.id}
            className="flex items-start justify-between gap-3 py-3 border-b border-foreground/10 last:border-0"
          >
            <div className="min-w-0">
              <p className="text-foreground font-bold text-sm">{p.title ?? 'Payment'}</p>
              <p className="text-foreground/50 text-sm mt-1">
                {p.paidAt
                  ? `${formatDate(p.paidAt, { day: 'numeric', month: 'short', year: 'numeric' })} ${new Date(p.paidAt)
                      .toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' })
                      .replace(' ', '')
                      .toLowerCase()}`
                  : '—'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <p className="text-green-600 dark:text-green-400 font-bold text-sm">+ {formatCurrency(p.amount)}</p>
              {p.receiptUrl && (
                <a href={p.receiptUrl} target="_blank" rel="noreferrer" className="text-accent text-sm font-semibold">
                  View Receipt
                </a>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Sidebar: totals and ownership ────────────────────────────────────────────

export function FractionalSummaryCards({ inv }: { inv: Investment }) {
  const slots = slotsOwned(inv);
  const appreciation = inv.currentValue - inv.totalInvested;
  const appreciationPct = inv.totalInvested > 0 ? (appreciation / inv.totalInvested) * 100 : 0;
  const pct = ownershipPercent(inv);
  const up = appreciation >= 0;

  return (
    <div className="space-y-4">
      <div className="bg-card border border-foreground/5 rounded-3xl p-4">
        <p className="text-foreground/50 text-sm">Total Invested</p>
        <p className="text-foreground font-bold text-lg mt-1 truncate">{formatCurrency(inv.totalInvested)}</p>
        <p className="text-foreground/50 text-sm mt-1 pb-3 border-b border-foreground/10">
          Avg. Price per slot: {formatCurrency(inv.totalInvested / Math.max(slots, 1))}
        </p>
        <p className="text-foreground/50 text-sm mt-3">Est. Appreciation</p>
        <p
          className={cn(
            'text-base mt-1',
            up ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
          )}
        >
          {formatCurrency(appreciation)} ({up ? '' : '-'}
          {Math.abs(appreciationPct).toFixed(appreciationPct % 1 ? 1 : 0)}%)
        </p>
      </div>

      <div className="bg-card border border-foreground/5 rounded-3xl p-4">
        <div className="flex items-center gap-2">
          <p className="text-foreground font-bold text-base">Your Ownership</p>
          <RiInformationLine className="h-5 w-5 text-orange-500" aria-hidden />
        </div>
        <div className="flex items-center justify-between gap-3 mt-3">
          <div>
            <p className="text-foreground font-bold text-lg">{slotsLabel(slots)}</p>
            {pct != null && <p className="text-foreground/50 text-sm mt-2">{pct}% Ownership</p>}
          </div>
          {/* Always shown (boss's call, Nov 2026); 0% until a share can be worked out */}
          <ProgressRing percent={pct ?? 0} />
        </div>
      </div>
    </div>
  );
}
