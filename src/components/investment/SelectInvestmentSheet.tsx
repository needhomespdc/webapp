import { useState } from 'react';
import { RiBuildingLine, RiExchangeLine, RiInformationLine, RiLockLine, RiMapPinLine } from 'react-icons/ri';
import { SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { formatCurrency, cn } from '@/lib/utils';
import type { EligibleInvestment } from '@/types';

/**
 * First step for actions started from a list page (Exit, Buy Back): pick an eligible investment,
 * then the page opens the same modal the investment's own page uses.
 * Styled like the Resell modal's Select Investment step (Figma, Oct 2026).
 */
export function SelectInvestmentSheet({
  open,
  onOpenChange,
  title,
  description,
  eligible,
  isLoading,
  emptyText,
  onContinue,
  continuing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  eligible: EligibleInvestment[];
  isLoading: boolean;
  emptyText: string;
  onContinue: (investmentId: string) => void;
  /** True while the chosen investment's details load */
  continuing?: boolean;
}) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const close = (v: boolean) => {
    if (!v) setSelectedId(null);
    onOpenChange(v);
  };

  const body = (
    <>
      <div className="px-12 py-5 shrink-0">
        <DialogTitle className="text-center text-base font-bold">{title}</DialogTitle>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6 space-y-3">
        <div>
          <h2 className="text-foreground font-bold text-2xl">Select Investment</h2>
          <p className="text-foreground/50 text-sm mt-1">{description}</p>
        </div>
        {isLoading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-36 w-full rounded-3xl" />)
        ) : !eligible.length ? (
          <EmptyState icon={<RiExchangeLine />} title="No eligible investments" description={emptyText} />
        ) : (
          eligible.map((inv) => {
            const selected = selectedId === inv.investmentId;
            return (
              <div
                key={inv.investmentId}
                onClick={inv.isEligible ? () => setSelectedId(inv.investmentId) : undefined}
                className={cn(
                  'bg-card border rounded-3xl p-3 transition-colors',
                  inv.isEligible ? 'cursor-pointer' : 'opacity-60 cursor-default',
                  selected ? 'border-accent bg-accent/5' : 'border-foreground/5',
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                    {inv.propertyImageUrl ? (
                      <img src={inv.propertyImageUrl} alt={inv.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-accent/10 flex items-center justify-center">
                        <RiBuildingLine className="h-6 w-6 text-accent" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-bold text-base leading-tight line-clamp-2">{inv.title}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-foreground/50 text-sm">
                      <RiMapPinLine className="h-4 w-4 shrink-0" />
                      <span className="truncate">{inv.location}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-3 bg-foreground/5 rounded-2xl px-3 py-2.5">
                  {[
                    { label: 'Ownership', value: inv.quantityLabel?.toLowerCase() ?? String(inv.quantityOwned) },
                    { label: 'Type', value: inv.investmentTypeLabel },
                    { label: 'Invested', value: formatCurrency(inv.investedAmount) },
                    { label: 'Current value', value: formatCurrency(inv.currentValue), cls: 'text-green-600 dark:text-green-400' },
                  ].map(({ label, value, cls }, i) => (
                    <div key={label} className={cn('min-w-0', i === 0 && 'border-r border-foreground/10')}>
                      <p className="text-foreground/50 text-xs truncate">{label}</p>
                      <p className={cn('text-xs sm:text-sm mt-1 truncate', cls ?? 'text-foreground')}>{value}</p>
                    </div>
                  ))}
                </div>
                {!inv.isEligible && inv.ineligibilityReason && (
                  <div className="mt-3 flex items-start gap-2 bg-foreground/5 rounded-xl px-3 py-2">
                    <RiInformationLine className="h-3.5 w-3.5 text-foreground/40 mt-0.5 shrink-0" />
                    <p className="text-foreground/50 text-[11px] leading-relaxed">{inv.ineligibilityReason}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="bg-card px-4 pt-4 pb-5 shrink-0 space-y-3">
        <Button
          className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-semibold rounded-2xl text-base"
          disabled={!selectedId || continuing}
          onClick={() => selectedId && onContinue(selectedId)}
        >
          {continuing ? 'Loading…' : 'Continue'}
        </Button>
        <p className="text-center text-foreground/50 text-sm flex items-center justify-center gap-2">
          <RiLockLine className="h-4 w-4" />
          Your information is secure and protected.
        </p>
      </div>
    </>
  );

  // Same shell as the other investment sheets: centred modal on desktop, bottom sheet on mobile
  return (
    <Dialog open={open} onOpenChange={close}>
      {isMobile ? (
        <SheetContent side="bottom" className="p-0 flex flex-col overflow-hidden gap-0 bg-background h-[92vh] rounded-t-3xl">
          {body}
        </SheetContent>
      ) : (
        <DialogContent className="p-0 flex flex-col overflow-hidden gap-0 bg-background max-w-[480px] h-[90vh] rounded-3xl">
          {body}
        </DialogContent>
      )}
    </Dialog>
  );
}
