import { useState } from 'react';
import { RiExchangeLine } from 'react-icons/ri';
import { useEligibleResales, useMyResales, useCreateResale, useCancelResale, useDeleteResale } from '@/hooks/useResales';
import { formatCurrency, formatDate } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export default function Resales() {
  const [tab, setTab] = useState('eligible');
  const { eligible, isLoading: eligibleLoading } = useEligibleResales();
  const { resales, isLoading: mineLoading } = useMyResales();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Resale Marketplace</h1>
        <p className="text-white/50 text-sm mt-1">List your investment units for resale to other investors.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="eligible">Eligible</TabsTrigger>
          <TabsTrigger value="mine">My Listings</TabsTrigger>
        </TabsList>

        <TabsContent value="eligible">
          {eligibleLoading ? (
            <div className="space-y-3 mt-4">{[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
          ) : !eligible.length ? (
            <EmptyState icon={<RiExchangeLine />} title="No eligible investments" description="Investments become eligible for resale after a minimum holding period." />
          ) : (
            <div className="space-y-3 mt-4">
              {eligible.map((inv) => <EligibleResaleRow key={inv.id} investment={inv} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mine">
          {mineLoading ? (
            <div className="space-y-3 mt-4">{[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
          ) : !resales.length ? (
            <EmptyState icon={<RiExchangeLine />} title="No resale listings yet" />
          ) : (
            <div className="space-y-3 mt-4">
              {resales.map((listing) => (
                <div key={listing.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-white text-sm font-semibold truncate">
                      {listing.investment?.property?.title ?? 'Investment'}
                    </p>
                    <StatusBadge status={listing.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div>
                      <p className="text-white/40">Quantity</p>
                      <p className="text-white">{listing.quantity} units</p>
                    </div>
                    <div>
                      <p className="text-white/40">Price Range</p>
                      <p className="text-white">{formatCurrency(listing.minPricePerUnit)} - {formatCurrency(listing.maxPricePerUnit)}</p>
                    </div>
                    <div>
                      <p className="text-white/40">Listed</p>
                      <p className="text-white">{formatDate(listing.createdAt)}</p>
                    </div>
                  </div>
                  {listing.rejectionReason && (
                    <p className="text-red-400 text-xs mt-2">{listing.rejectionReason}</p>
                  )}
                  {listing.status === 'pending' && <ResaleListingActions resaleListingId={listing.id} />}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EligibleResaleRow({ investment }: { investment: Investment }) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [agreed, setAgreed] = useState(false);
  const createMutation = useCreateResale();

  const handleSubmit = () => {
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    if (!min || !max || min > max) {
      toast.error('Enter a valid price range');
      return;
    }
    if (!agreed) {
      toast.error('Please accept the resale terms');
      return;
    }
    createMutation.mutate(
      { investmentId: investment.id, quantity, minPricePerUnit: min, maxPricePerUnit: max, termsAccepted: true },
      {
        onSuccess: () => {
          toast.success('Resale listing created');
          setOpen(false);
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to create listing'),
      }
    );
  };

  return (
    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{investment.property?.title ?? 'Investment'}</p>
        <p className="text-white/50 text-xs mt-0.5">
          {investment.quantity} unit{investment.quantity !== 1 ? 's' : ''} · {formatCurrency(investment.totalAmount)}
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>List for Resale</Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>List for Resale</DialogTitle>
            <DialogDescription>Set the quantity and price range buyers will see.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Quantity (max {investment.quantity})</Label>
              <Input type="number" min={1} max={investment.quantity} value={quantity} onChange={(e) => setQuantity(Math.min(investment.quantity, Math.max(1, parseInt(e.target.value) || 1)))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Min Price/Unit</Label>
                <Input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Max Price/Unit</Label>
                <Input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
              </div>
            </div>
            <label className="flex items-start gap-2 text-sm text-white/70 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1" />
              I understand and accept the resale terms.
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Listing'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ResaleListingActions({ resaleListingId }: { resaleListingId: string }) {
  const cancelMutation = useCancelResale();
  const deleteMutation = useDeleteResale();

  return (
    <div className="flex gap-2 mt-3">
      <Button
        variant="outline"
        size="sm"
        className="flex-1 border-amber-500/30 text-amber-400"
        onClick={() => cancelMutation.mutate(resaleListingId, { onError: () => toast.error('Failed to cancel listing') })}
        disabled={cancelMutation.isPending}
      >
        Cancel
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="flex-1 border-red-500/30 text-red-400"
        onClick={() => deleteMutation.mutate(resaleListingId, { onError: () => toast.error('Failed to delete listing') })}
        disabled={deleteMutation.isPending}
      >
        Delete
      </Button>
    </div>
  );
}
