import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import type { TxFilterState, TransactionType, TransactionStatus } from '@/types';
import { EMPTY_TX_FILTERS } from '@/types';

const DATE_RANGES: { value: TxFilterState['dateRange']; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '3m', label: 'Last 3 Months' },
  { value: 'custom', label: 'Custom Range' },
];

const DIRECTIONS: { value: TxFilterState['direction']; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'credit', label: 'Money In' },
  { value: 'debit', label: 'Money Out' },
];

const STATUSES: { value: TxFilterState['status']; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'successful' as TransactionStatus, label: 'Completed' },
  { value: 'failed' as TransactionStatus, label: 'Failed' },
  { value: 'pending' as TransactionStatus, label: 'Pending' },
];

const TYPES: { value: TxFilterState['type']; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'payout' as TransactionType, label: 'Investment Return' },
  { value: 'deposit' as TransactionType, label: 'Wallet Top Up' },
  { value: 'commission' as TransactionType, label: 'Referral Bonus' },
  { value: 'investment' as TransactionType, label: 'Investment In' },
  { value: 'withdrawal' as TransactionType, label: 'Withdrawal' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: TxFilterState;
  onApply: (value: TxFilterState) => void;
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-full text-sm font-medium border transition-all',
        selected
          ? 'bg-accent text-white border-accent'
          : 'bg-foreground/5 text-foreground/70 border-foreground/10 hover:border-foreground/20'
      )}
    >
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-foreground font-semibold text-sm mb-3">{title}</h3>
      {children}
    </div>
  );
}

export function TransactionFilterSheet({ open, onOpenChange, value, onApply }: Props) {
  const [draft, setDraft] = useState<TxFilterState>(value);
  const isDesktop = useIsDesktop();
  const side = isDesktop ? 'right' : 'bottom';

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const handleApply = () => {
    onApply(draft);
    onOpenChange(false);
  };

  const handleClear = () => setDraft(EMPTY_TX_FILTERS);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn(
          'flex flex-col',
          side === 'bottom' ? 'max-h-[90vh] rounded-t-3xl' : 'sm:max-w-md'
        )}
      >
        <SheetHeader>
          <SheetTitle>Filter Transactions</SheetTitle>
          <p className="text-foreground/50 text-sm">
            Refine your transaction history using the options below.
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-6 mt-4 pb-4">
          {/* Date */}
          <Section title="Date">
            <div className="flex flex-wrap gap-2">
              {DATE_RANGES.map((r) => (
                <Chip
                  key={r.value}
                  selected={draft.dateRange === r.value}
                  onClick={() =>
                    setDraft((d) => ({ ...d, dateRange: r.value, dateFrom: '', dateTo: '' }))
                  }
                >
                  {r.label}
                </Chip>
              ))}
            </div>
            {draft.dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="space-y-1">
                  <label className="text-xs text-foreground/50">From</label>
                  <input
                    type="date"
                    value={draft.dateFrom}
                    onChange={(e) => setDraft((d) => ({ ...d, dateFrom: e.target.value }))}
                    className="w-full h-10 rounded-xl border border-foreground/20 bg-foreground/5 px-3 text-sm text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-foreground/50">To</label>
                  <input
                    type="date"
                    value={draft.dateTo}
                    onChange={(e) => setDraft((d) => ({ ...d, dateTo: e.target.value }))}
                    className="w-full h-10 rounded-xl border border-foreground/20 bg-foreground/5 px-3 text-sm text-foreground"
                  />
                </div>
              </div>
            )}
          </Section>

          {/* Direction */}
          <Section title="Money In / Money Out">
            <div className="flex flex-wrap gap-2">
              {DIRECTIONS.map((d) => (
                <Chip
                  key={d.value}
                  selected={draft.direction === d.value}
                  onClick={() => setDraft((prev) => ({ ...prev, direction: d.value }))}
                >
                  {d.label}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Status */}
          <Section title="Transaction Status">
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <Chip
                  key={String(s.value)}
                  selected={draft.status === s.value}
                  onClick={() => setDraft((prev) => ({ ...prev, status: s.value }))}
                >
                  {s.label}
                </Chip>
              ))}
            </div>
          </Section>

          {/* Type */}
          <Section title="Transaction Type">
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <Chip
                  key={String(t.value)}
                  selected={draft.type === t.value}
                  onClick={() => setDraft((prev) => ({ ...prev, type: t.value }))}
                >
                  {t.label}
                </Chip>
              ))}
            </div>
          </Section>
        </div>

        <div className="flex gap-3 pt-3 shrink-0 border-t border-foreground/10">
          <Button variant="outline" className="flex-1" onClick={handleClear}>
            Clear Filters
          </Button>
          <Button className="flex-1" onClick={handleApply}>
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
