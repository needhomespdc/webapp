import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { RiArrowRightSLine, RiCheckLine } from 'react-icons/ri';
import { useInvestmentPayments } from '@/hooks/useInvestment';
import { investmentsApi } from '@/api/investments.api';
import { toast } from '@/hooks/useToast';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import type { Investment, InvestmentProgressStep } from '@/types';
import { DetailHeader } from '../DetailHeader';
import { ProgressRing } from '../ProgressRing';

// Save-to-own investment detail (Figma, Oct 2026). Property facts come from the frozen
// snapshot, whose shape the API docs don't pin down, so every read falls back gracefully.

type Dict = Record<string, unknown>;
const snapshotOf = (inv: Investment) => (inv.snapshot ?? {}) as Dict;
const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined);
const numOrStr = (v: unknown) => (typeof v === 'number' ? String(v) : str(v));
const shortDate = (d?: string | null) => (d ? formatDate(d, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const longDate = (d?: string | null) => (d ? formatDate(d, { day: 'numeric', month: 'long', year: 'numeric' }) : '—');
const isPaid = (status: string) => ['paid', 'completed'].includes(status.toLowerCase());
const CARD = 'bg-card border border-foreground/5 rounded-3xl';
const slugOf = (inv: Investment) => str(snapshotOf(inv).slug) ?? str(snapshotOf(inv).propertySlug);

// ─── Header ───────────────────────────────────────────────────────────────────

export function SaveToOwnHeader({ inv, statusChip }: { inv: Investment; statusChip: React.ReactNode }) {
  const snap = snapshotOf(inv);
  return (
    <DetailHeader
      inv={inv}
      statusChip={statusChip}
      propertyType={str(snap.propertyTypeLabel) ?? str(snap.propertyType)}
      slug={slugOf(inv)}
      stats={[
        { label: 'Your Ownership', value: inv.unitsOwnedLabel },
        { label: 'Amount Paid', value: `${Math.round(inv.progressPercent)}%` },
        { label: 'Payment Start Date', value: shortDate(inv.startedAt) },
        { label: 'Payment Completion Date', value: shortDate(inv.maturityDate) },
      ]}
      bgClass="bg-blue-700"
      linkClass="text-blue-700"
    />
  );
}

// ─── Overview + property details ──────────────────────────────────────────────

function Grid({ rows }: { rows: { label: string; value: React.ReactNode }[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-6">
      {rows.map(({ label, value }, i) => (
        <div key={label} className={cn('py-3 min-w-0', i < rows.length - 2 && 'border-b border-foreground/10')}>
          <p className="text-foreground/50 text-sm">{label}</p>
          <div className="text-foreground text-sm mt-1 wrap-break-word">{value}</div>
        </div>
      ))}
    </div>
  );
}

export function SaveToOwnOverview({ inv }: { inv: Investment }) {
  const { paymentEntries } = useInvestmentPayments(inv.id);
  const first = paymentEntries[0];
  const daysLeft = inv.maturityDate
    ? Math.ceil((new Date(inv.maturityDate).getTime() - Date.now()) / 86_400_000)
    : null;
  const snap = snapshotOf(inv);
  const slug = slugOf(inv);

  return (
    <div className={cn(CARD, 'p-4 space-y-6')}>
      <div>
        <h2 className="text-foreground font-bold text-base mb-1">Investment Overview</h2>
        <Grid
          rows={[
            { label: 'First payment', value: first ? formatCurrency(first.amount) : '—' },
            { label: 'Payment Plan', value: inv.paymentPlan ?? '—' },
            { label: 'Payment Started Date', value: longDate(inv.startedAt) },
            {
              label: 'Target Date',
              value: (
                <>
                  {longDate(inv.maturityDate)}
                  {daysLeft != null && daysLeft > 0 && (
                    <p className="text-orange-500 mt-1">({daysLeft} days left)</p>
                  )}
                </>
              ),
            },
            { label: 'Frequency', value: inv.paymentFrequency ?? '—' },
            { label: 'Next Payment', value: longDate(inv.nextPaymentDate) },
          ]}
        />
      </div>

      <div>
        <div className="flex items-center justify-between gap-3 mb-1">
          <h2 className="text-foreground font-bold text-base">Property Details</h2>
          {slug && (
            <Link
              to={`/investor/marketplace/${slug}`}
              className="flex items-center gap-1 text-orange-600 dark:text-orange-400 text-sm font-medium"
            >
              View Property <RiArrowRightSLine className="h-4 w-4" />
            </Link>
          )}
        </div>
        <Grid
          rows={[
            { label: 'Property Type', value: str(snap.propertyTypeLabel) ?? str(snap.propertyType) ?? inv.typeLabel },
            { label: 'Bedrooms', value: numOrStr(snap.bedrooms) ?? '—' },
            { label: 'Location', value: str(snap.address) ?? inv.location },
            {
              label: 'Total Units',
              value: numOrStr(snap.totalUnits ?? snap.inventoryTotal)
                ? `${numOrStr(snap.totalUnits ?? snap.inventoryTotal)} Units`
                : '—',
            },
          ]}
        />
      </div>
    </div>
  );
}

// ─── Progress ─────────────────────────────────────────────────────────────────

/** The API's timeline when it has one, else the five design stages derived from the percent paid */
function progressSteps(inv: Investment): InvestmentProgressStep[] {
  if ((inv.progressTimeline?.length ?? 0) >= 2) return inv.progressTimeline!;
  const p = inv.progressPercent;
  const done = p >= 100;
  const milestone = (n: number): InvestmentProgressStep => ({
    title: `${n}% milestone`,
    status: p >= n ? 'completed' : 'upcoming',
    subtitle: p >= n ? 'Completed' : 'Upcoming',
  });
  return [
    { title: 'Start saving', status: 'completed', date: shortDate(inv.startedAt) },
    { title: 'Keep saving', status: done ? 'completed' : 'current', subtitle: done ? 'Completed' : 'In Progress' },
    milestone(50),
    milestone(75),
    { ...milestone(100), date: done ? undefined : shortDate(inv.maturityDate) },
  ];
}

export function SaveToOwnProgress({ inv }: { inv: Investment }) {
  const steps = progressSteps(inv);
  return (
    <div className={cn(CARD, 'p-4')}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-foreground font-bold text-base">Save to Own Progress</h2>
        <span className="text-orange-500 text-sm font-medium">{inv.progressPercent.toFixed(2)}%</span>
      </div>
      <div className="flex justify-center py-6">
        <ProgressRing percent={inv.progressPercent} size="lg" caption="Owned" />
      </div>

      <div className="flex items-center px-[6%]">
        {steps.map((step, i) => {
          const completed = step.status === 'completed';
          const current = step.status === 'current';
          return (
            <Fragment key={step.title}>
              <div
                className={cn(
                  'w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0',
                  completed
                    ? 'bg-green-600 border-green-600'
                    : current
                      ? 'bg-green-100 border-green-600 dark:bg-green-500/15'
                      : 'bg-background border-foreground/15',
                )}
              >
                {completed && <RiCheckLine className="h-4 w-4 text-white" />}
                {current && <div className="w-2.5 h-2.5 rounded-sm bg-green-600" />}
              </div>
              {i < steps.length - 1 && (
                <div className={cn('flex-1 h-0.5', completed ? 'bg-green-600' : 'bg-foreground/10')} />
              )}
            </Fragment>
          );
        })}
      </div>
      <div className="grid mt-2 pb-4 border-b border-foreground/10" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((step) => (
          <div key={step.title} className="text-center px-0.5 min-w-0">
            <p className="text-foreground text-[11px] sm:text-xs font-medium">{step.title}</p>
            <p className="text-foreground/50 text-[10px] sm:text-[11px] mt-1">{step.date ?? step.subtitle ?? ''}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-3xl p-4 bg-orange-100 dark:bg-orange-500/15">
        <p className="text-foreground text-sm leading-relaxed">
          {inv.progressInfoText ??
            'Keep saving to reach 100% ownership. Once complete, the property will be transferred to your name.'}
        </p>
        <button className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-sm font-medium mt-3">
          How It Works <RiArrowRightSLine className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Sidebar: totals and recent payments ──────────────────────────────────────

export function SaveToOwnTotals({ inv, onPayments }: { inv: Investment; onPayments: () => void }) {
  return (
    <div className={cn(CARD, 'p-4')}>
      <p className="text-foreground/50 text-sm">Total Paid</p>
      <p className="text-foreground font-bold text-xl mt-1 pb-3 border-b border-foreground/10">
        {formatCurrency(inv.totalInvested)}
      </p>
      <p className="text-foreground/50 text-sm mt-3">Current value</p>
      <p className="text-foreground font-bold text-xl mt-1">{formatCurrency(inv.currentValue)}</p>
      <button
        onClick={onPayments}
        className="flex items-center gap-2 mt-4 bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 text-sm font-medium px-3 py-2 rounded-xl"
      >
        View payment history <RiArrowRightSLine className="h-4 w-4" />
      </button>
    </div>
  );
}

export function SaveToOwnPaymentHistory({ inv, onViewAll }: { inv: Investment; onViewAll: () => void }) {
  const { paymentEntries } = useInvestmentPayments(inv.id);
  const paid = paymentEntries.filter((e) => isPaid(e.status)).slice(-2).reverse();

  const downloadReceipt = async () => {
    try {
      const blob = await investmentsApi.getReceipt(inv.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${inv.reference}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download receipt');
    }
  };

  return (
    <div className={cn(CARD, 'px-4 pt-4')}>
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-foreground/10">
        <h2 className="text-foreground font-bold text-sm">Payment History</h2>
        <button onClick={onViewAll} className="text-orange-500 text-sm font-medium">
          View All
        </button>
      </div>
      {paid.length === 0 ? (
        <p className="text-foreground/50 text-sm text-center py-6">No payments yet</p>
      ) : (
        paid.map((e, i) => (
          <div key={e.id} className="flex items-start justify-between gap-3 py-3 border-b border-foreground/10 last:border-0">
            <div className="min-w-0">
              <p className="text-foreground font-bold text-sm">
                {e.label ?? (e as { title?: string }).title ?? (i === paid.length - 1 ? 'Initial Payment' : 'Payment')}
              </p>
              <p className="text-foreground font-bold text-sm mt-1">{formatCurrency(e.amount)}</p>
              {e.paidAt && <p className="text-foreground/50 text-sm mt-1">{shortDate(e.paidAt)}</p>}
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className="text-xs px-4 py-1 rounded-full text-green-600 bg-green-500/15 dark:text-green-400">Paid</span>
              <button onClick={downloadReceipt} className="text-accent text-sm font-semibold">
                View Receipt
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
