import { useState } from 'react';
import { RiLogoutCircleLine } from 'react-icons/ri';
import { useEligibleExits, useExitList, useCreateExit, useCancelExit } from '@/hooks/useExits';
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/useToast';
import { ApiError } from '@/lib/fetchClient';
import type { Investment } from '@/types';

export default function Exits() {
  const [tab, setTab] = useState('eligible');
  const { eligible, isLoading: eligibleLoading } = useEligibleExits();
  const { exits, isLoading: historyLoading } = useExitList('history');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Early Exits</h1>
        <p className="text-foreground/50 text-sm mt-1">Exit an investment before maturity, subject to a penalty.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="eligible">Eligible</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="eligible">
          {eligibleLoading ? (
            <div className="space-y-3 mt-4">{[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
          ) : !eligible.length ? (
            <EmptyState icon={<RiLogoutCircleLine />} title="No eligible investments" description="Investments become eligible for exit after a minimum holding period." />
          ) : (
            <div className="space-y-3 mt-4">
              {eligible.map((inv) => <EligibleExitRow key={inv.id} investment={inv} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          {historyLoading ? (
            <div className="space-y-3 mt-4">{[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
          ) : !exits.length ? (
            <EmptyState icon={<RiLogoutCircleLine />} title="No exit requests yet" />
          ) : (
            <div className="space-y-3 mt-4">
              {exits.map((exit) => (
                <div key={exit.id} className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-foreground text-sm font-semibold truncate">
                      {exit.investment?.property?.title ?? 'Investment'}
                    </p>
                    <StatusBadge status={exit.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div>
                      <p className="text-foreground/40">Principal</p>
                      <p className="text-foreground">{formatCurrency(exit.principalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-foreground/40">Penalty ({formatPercent(exit.penaltyPercent)})</p>
                      <p className="text-red-400">-{formatCurrency(exit.penaltyAmount)}</p>
                    </div>
                    <div>
                      <p className="text-foreground/40">Final Payout</p>
                      <p className="text-green-400 font-semibold">{formatCurrency(exit.finalPayout)}</p>
                    </div>
                    <div>
                      <p className="text-foreground/40">Requested</p>
                      <p className="text-foreground">{formatDate(exit.createdAt)}</p>
                    </div>
                  </div>
                  {exit.rejectionReason && (
                    <p className="text-red-400 text-xs mt-2">{exit.rejectionReason}</p>
                  )}
                  {exit.status === 'pending' && <CancelExitButton exitId={exit.id} />}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EligibleExitRow({ investment }: { investment: Investment }) {
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const createMutation = useCreateExit();

  const handleSubmit = () => {
    if (!agreed) {
      toast.error('Please accept the exit terms');
      return;
    }
    createMutation.mutate(
      { investmentId: investment.id, termsAccepted: true },
      {
        onSuccess: () => {
          toast.success('Exit request submitted');
          setOpen(false);
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to submit exit request'),
      }
    );
  };

  return (
    <div className="flex items-center gap-3 bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
      <div className="flex-1 min-w-0">
        <p className="text-foreground text-sm font-semibold truncate">{investment.property?.title ?? 'Investment'}</p>
        <p className="text-foreground/50 text-xs mt-0.5">
          {investment.quantity} unit{investment.quantity !== 1 ? 's' : ''} · {formatCurrency(investment.totalAmount)}
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Exit</Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Early Exit</DialogTitle>
            <DialogDescription>
              Exiting early may incur a penalty deducted from your principal. The exact penalty and final payout will be calculated by our team and shown before any funds are disbursed.
            </DialogDescription>
          </DialogHeader>
          <label className="flex items-start gap-2 text-sm text-foreground/70 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1" />
            I understand and accept the early exit terms.
          </label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Submitting...' : 'Submit Exit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CancelExitButton({ exitId }: { exitId: string }) {
  const cancelMutation = useCancelExit();
  return (
    <Button
      variant="outline"
      size="sm"
      className="mt-3 w-full border-red-500/30 text-red-400"
      onClick={() => cancelMutation.mutate(exitId, { onError: () => toast.error('Failed to cancel exit request') })}
      disabled={cancelMutation.isPending}
    >
      Cancel Request
    </Button>
  );
}
