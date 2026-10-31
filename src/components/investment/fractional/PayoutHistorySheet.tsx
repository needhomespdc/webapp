import { RiBuildingLine, RiHistoryLine, RiMapPinLine } from 'react-icons/ri';
import { SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import type { Investment } from '@/types';
import { MODEL_BADGE } from '../modelBadge';

const CARD = 'bg-card border border-foreground/5 rounded-3xl';
const MONTH = 30.44 * 86_400_000;

interface Props {
  inv: Investment;
  isOpen: boolean;
  onClose: () => void;
}

/** Fractional payout history (Figma, Oct 2026): summary card, totals, every paid payout. */
export function PayoutHistorySheet({ inv, isOpen, onClose }: Props) {
  const isMobile = useMediaQuery('(max-width: 639px)');

  const payouts = (inv.payouts ?? [])
    .filter((p) => ['paid', 'completed', 'successful'].includes(p.status?.toLowerCase()))
    .sort((a, b) => new Date(b.paidAt ?? 0).getTime() - new Date(a.paidAt ?? 0).getTime());

  const total = payouts.reduce((sum, p) => sum + p.amount, 0);
  // Average per month since the investment started (at least one month)
  const months = Math.max(1, Math.round((Date.now() - new Date(inv.startedAt).getTime()) / MONTH));
  const avgMonthly = payouts.length ? total / months : 0;
  const slots = inv.quantity ?? (parseInt(inv.unitsOwnedLabel ?? '', 10) || 1);

  const body = (
    <>
      <div className="px-12 py-5 shrink-0">
        <DialogTitle className="text-center text-base font-bold">Payout History</DialogTitle>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
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
                  MODEL_BADGE[inv.type] ?? 'bg-foreground/10 text-foreground/70',
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
            {[
              { label: 'Ownership', value: `${slots} Slot${slots !== 1 ? 's' : ''}`, align: 'text-left' },
              { label: 'Total Invested', value: formatCurrency(inv.totalInvested), align: 'text-center' },
              {
                label: 'Investment Date',
                value: formatDate(inv.startedAt, { day: 'numeric', month: 'long', year: 'numeric' }),
                align: 'text-right',
              },
            ].map(({ label, value, align }) => (
              <div key={label} className={cn('px-3 min-w-0', align)}>
                <p className="text-foreground/50 text-xs truncate">{label}</p>
                <p className="text-foreground font-bold text-sm mt-1 truncate">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={cn(CARD, 'p-4')}>
          <h2 className="text-foreground font-bold text-sm pb-3 border-b border-foreground/10">Payout Summary</h2>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="min-w-0">
              <p className="text-foreground/50 text-xs">Total Received</p>
              <p className="text-green-600 dark:text-green-400 font-bold text-sm mt-1 truncate">
                + {formatCurrency(total)}
              </p>
            </div>
            <div className="min-w-0 text-center">
              <p className="text-foreground/50 text-xs">Payouts Received</p>
              <p className="text-foreground font-bold text-sm mt-1">{payouts.length}</p>
            </div>
            <div className="min-w-0 text-right">
              <p className="text-foreground/50 text-xs">Avg. Monthly</p>
              <p className="text-foreground font-bold text-sm mt-1 truncate">{formatCurrency(avgMonthly)}</p>
            </div>
          </div>
        </div>

        <div className={cn(CARD, 'px-4 pt-4')}>
          <h2 className="text-foreground font-bold text-sm pb-3 border-b border-foreground/10">All Payouts</h2>
          {payouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <RiHistoryLine className="h-12 w-12 text-foreground/15" />
              <p className="text-foreground/50 text-sm">No payouts recorded yet.</p>
            </div>
          ) : (
            payouts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 py-3.5 border-b border-foreground/10 last:border-0"
              >
                <span className="text-foreground/50 text-sm">
                  {p.paidAt ? formatDate(p.paidAt, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </span>
                <span className="text-green-600 dark:text-green-400 font-bold text-sm">+ {formatCurrency(p.amount)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );

  // Same shell as the other investment sheets: centred modal on desktop, bottom sheet on mobile
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {isMobile ? (
        <SheetContent side="bottom" className="p-0 flex flex-col overflow-hidden gap-0 bg-background h-[88vh] rounded-t-3xl">
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
