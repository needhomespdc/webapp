import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  RiAddLine,
  RiArrowLeftLine,
  RiArrowRightSLine,
  RiBook2Line,
  RiBuildingLine,
  RiInformationLine,
  RiStoreLine,
  RiTimeLine,
} from 'react-icons/ri';
import { useEligibleResales, useMyResales } from '@/hooks/useResales';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ResaleDetailSheet } from '@/components/resales/ResaleDetailSheet';
import { CreateResaleSheet } from '@/components/resales/CreateResaleSheet';
import type { ResaleListing } from '@/types';

// ─── Listing card (same layout as the Exits page) ─────────────────────────────

function ResaleCard({ listing, onClick }: { listing: ResaleListing; onClick: () => void }) {
  const title = listing.propertyTitle || listing.investment?.title || 'Investment';
  // Location under the title, as on the Exits list (GET /resales/me sends propertyLocation)
  const location = listing.propertyLocation ?? listing.investment?.location;
  const imageUrl = listing.propertyImageUrl || listing.investment?.propertyImageUrl || null;
  const price =
    listing.minPricePerUnit === listing.maxPricePerUnit
      ? formatCurrency(listing.minPricePerUnit)
      : `${formatCurrency(listing.minPricePerUnit)} – ${formatCurrency(listing.maxPricePerUnit)}`;

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-foreground/5 border border-foreground/10 rounded-2xl p-4 flex flex-col gap-3 cursor-pointer hover:border-foreground/20 transition-colors active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-foreground/10">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <RiBuildingLine className="h-6 w-6 text-foreground/30" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-bold text-sm line-clamp-1">{title}</p>
          {location && <p className="text-foreground/50 text-xs mt-0.5">{location}</p>}
        </div>
        <StatusBadge status={listing.status} label={listing.statusLabel} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-foreground/40">Date Listed</p>
          <p className="text-foreground font-medium mt-0.5">{formatDate(listing.listedAt || listing.createdAt)}</p>
        </div>
        <div>
          <p className="text-foreground/40">Quantity</p>
          <p className="text-foreground font-medium mt-0.5">
            {listing.quantity} unit{listing.quantity !== 1 ? 's' : ''}
          </p>
        </div>
        <div>
          <p className="text-foreground/40">Price</p>
          <p className="text-foreground font-semibold mt-0.5">{price}</p>
        </div>
      </div>

      {listing.rejectionReason && (
        <p className="text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2">{listing.rejectionReason}</p>
      )}

      <div className="flex justify-end">
        <div className="w-7 h-7 rounded-full border border-foreground/15 flex items-center justify-center text-foreground/30">
          <RiArrowRightSLine className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TAB_LABELS: Record<string, string> = { all: 'All', pending: 'Pending', live: 'Live', sold: 'Sold' };

const STATUS_ALIASES: Record<string, 'pending' | 'live' | 'sold'> = {
  pending: 'pending',
  pending_review: 'pending',
  under_review: 'pending',
  in_review: 'pending',
  submitted: 'pending',
  approved: 'live',
  active: 'live',
  live: 'live',
  listed: 'live',
  sold: 'sold',
  completed: 'sold',
};

function resaleStatusKey(raw: string | undefined) {
  return STATUS_ALIASES[(raw ?? '').toLowerCase().replace(/[\s-]+/g, '_')];
}

export default function Resales() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  // Arriving from an investment's Resell button (?resell=<investmentId>) opens the modal on that investment
  const [searchParams, setSearchParams] = useSearchParams();
  const resellId = searchParams.get('resell');
  const [createOpen, setCreateOpen] = useState(!!resellId);
  const [selectedResaleId, setSelectedResaleId] = useState<string | null>(null);

  const handleCreateOpenChange = (open: boolean) => {
    setCreateOpen(open);
    if (!open && resellId) setSearchParams({}, { replace: true });
  };

  const { eligible, isLoading: eligibleLoading } = useEligibleResales();
  const { resales, summary, isLoading } = useMyResales();

  // The API's summary often comes back empty and its statuses vary (PENDING, under_review, active…),
  // so count from the listings themselves and only trust the summary when it reports more
  const counted = { pending: 0, live: 0, sold: 0 };
  resales.forEach((r) => {
    const key = resaleStatusKey(r.status);
    if (key) counted[key] += 1;
  });
  const pendingCount = Math.max(summary.pendingCount ?? 0, counted.pending);
  const liveCount = Math.max(summary.liveCount ?? 0, counted.live);
  const totalListings = pendingCount + liveCount;

  const filtered = tab === 'all' ? resales : resales.filter((r) => resaleStatusKey(r.status) === tab);

  return (
    <div className="space-y-5 sm:pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/investor/portfolio')}
          className="w-9 h-9 rounded-full bg-foreground/8 flex items-center justify-center text-foreground/60 hover:bg-foreground/15 transition-colors shrink-0"
        >
          <RiArrowLeftLine className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Property Resales</h1>
          <p className="text-foreground/50 text-xs mt-0.5">List your holdings for resale and track your listing status.</p>
        </div>
      </div>

      {/* CTA — inline on mobile */}
      <Button
        className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-semibold rounded-2xl sm:hidden"
        onClick={() => setCreateOpen(true)}
      >
        <RiAddLine className="h-5 w-5 mr-2" />
        Resell my investment
      </Button>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-foreground/5 border border-foreground/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
            <RiStoreLine className="text-accent h-5 w-5" />
          </div>
          <div>
            <p className="text-foreground/50 text-xs">Total Listings</p>
            <p className="text-foreground font-bold text-xl leading-tight">{isLoading ? '—' : totalListings}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-foreground/5 border border-foreground/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
            <RiTimeLine className="text-blue-400 h-5 w-5" />
          </div>
          <div>
            <p className="text-foreground/50 text-xs">Pending Review</p>
            <p className="text-foreground font-bold text-xl leading-tight">{isLoading ? '—' : pendingCount}</p>
          </div>
        </div>
      </div>

      {/* Tabs — underline style */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full bg-transparent border-0 p-0 rounded-none gap-0 flex border-b border-foreground/10">
          {Object.entries(TAB_LABELS).map(([t, label]) => (
            <TabsTrigger
              key={t}
              value={t}
              className={cn(
                'flex-1 rounded-none pb-2.5 pt-1 px-2 bg-transparent shadow-none border-b-2 border-transparent -mb-px',
                'data-[state=active]:border-accent data-[state=active]:text-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none',
                'text-foreground/40 text-sm font-medium',
              )}
            >
              {label}
              {t === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent text-white text-[9px] font-bold">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))}
            </div>
          ) : !filtered.length ? (
            <EmptyState
              icon={<RiBook2Line />}
              title="No resale listings yet"
              description="When you list a property for resale, your listings will show here."
            />
          ) : (
            <div className="space-y-3">
              {filtered.map((listing) => (
                <ResaleCard key={listing.id} listing={listing} onClick={() => setSelectedResaleId(listing.id)} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* About Resales */}
      <div className="w-full bg-accent/10 border border-accent/20 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
          <RiInformationLine className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-semibold text-sm">About Resales</p>
          <p className="text-foreground/50 text-xs mt-0.5 leading-relaxed">
            You can resell active investments that haven't been claimed or handed over. Once sold, the proceeds go to
            your wallet; resale depends on market demand and may take time.
          </p>
        </div>
      </div>

      {/* FAB — desktop only */}
      <button
        onClick={() => setCreateOpen(true)}
        className="hidden sm:flex fixed bottom-10 right-8 z-40 items-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold text-sm px-5 py-3.5 rounded-full shadow-lg shadow-accent/30 transition-all active:scale-95"
      >
        <RiAddLine className="h-5 w-5 shrink-0" />
        Resell my investment
      </button>

      <CreateResaleSheet
        open={createOpen}
        onOpenChange={handleCreateOpenChange}
        preselectedId={resellId}
        eligible={eligible}
        eligibleLoading={eligibleLoading}
      />
      <ResaleDetailSheet resaleId={selectedResaleId} onClose={() => setSelectedResaleId(null)} />
    </div>
  );
}
