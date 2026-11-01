import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiAddLine,
  RiArrowLeftLine,
  RiArrowRightSLine,
  RiBook2Line,
  RiBuildingLine,
  RiExchangeDollarLine,
  RiInformationLine,
  RiTimeLine,
} from 'react-icons/ri';
import { useEligibleBuybacks, useMyBuybacks } from '@/hooks/useBuybacks';
import { useInvestmentDetail } from '@/hooks/useInvestment';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SelectInvestmentSheet } from '@/components/investment/SelectInvestmentSheet';
import { BuyBackSheet } from '@/components/buybacks/BuyBackSheet';
import { BuyBackDetailSheet } from '@/components/buybacks/BuyBackDetailSheet';
import { buybackAmounts, buybackStatusKey, type StatusKey } from '@/components/buybacks/buyback';
import type { BuybackDetail } from '@/api/buybacks.api';

// Buy back requests, laid out like the Exits page

const BADGE: Record<StatusKey, { label: string; cls: string }> = {
  pending: { label: 'Under review', cls: 'bg-amber-500' },
  approved: { label: 'Approved', cls: 'bg-green-500' },
  rejected: { label: 'Rejected', cls: 'bg-red-500' },
  cancelled: { label: 'Cancelled', cls: 'bg-foreground/40' },
};

function BuybackCard({ b, onClick }: { b: BuybackDetail; onClick: () => void }) {
  const key = buybackStatusKey(b.status);
  const badge = key
    ? { ...BADGE[key], label: b.statusLabel || BADGE[key].label }
    : { label: b.statusLabel ?? b.status, cls: 'bg-foreground/40' };
  const qty = b.quantity ?? 1;
  const location = (b as { location?: string }).location;
  const title = b.propertyTitle || b.title || 'Buy back request';
  const date = b.listedAt || b.requestedAt || b.createdAt;

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-foreground/5 border border-foreground/10 rounded-2xl p-4 flex flex-col gap-3 cursor-pointer hover:border-foreground/20 transition-colors active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-foreground/10">
          {b.propertyImageUrl ? (
            <img src={b.propertyImageUrl} alt={title} className="w-full h-full object-cover" />
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
        <span className={cn('text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0', badge.cls)}>
          {badge.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-foreground/40">Date</p>
          <p className="text-foreground font-medium mt-0.5">{date ? formatDate(date) : '—'}</p>
        </div>
        <div>
          <p className="text-foreground/40">Quantity</p>
          <p className="text-foreground font-medium mt-0.5">{b.quantityLabel ?? `${qty} plot${qty !== 1 ? 's' : ''}`}</p>
        </div>
        <div>
          <p className="text-foreground/40">Amount to be paid</p>
          <p className="text-foreground font-semibold mt-0.5">{formatCurrency(buybackAmounts(b).net)}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <div className="w-7 h-7 rounded-full border border-foreground/15 flex items-center justify-center text-foreground/30">
          <RiArrowRightSLine className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

const TAB_LABELS: Record<string, string> = { all: 'All', pending: 'Under review', approved: 'Approved', rejected: 'Rejected' };

export default function Buybacks() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectOpen, setSelectOpen] = useState(false);
  // New request: pick an investment, then the same buy back modal as the investment page
  const [chosenId, setChosenId] = useState<string | null>(null);
  const { investment } = useInvestmentDetail(chosenId ?? undefined);
  const buybackInv = chosenId && investment?.id === chosenId ? investment : null;
  const closeFlow = () => {
    setChosenId(null);
    setSelectOpen(false);
  };

  const { buybacks, isLoading } = useMyBuybacks();
  const { eligible, isLoading: eligibleLoading } = useEligibleBuybacks();

  const pendingCount = buybacks.filter((b) => buybackStatusKey(b.status) === 'pending').length;
  const filtered = tab === 'all' ? buybacks : buybacks.filter((b) => buybackStatusKey(b.status) === tab);

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
          <h1 className="text-xl font-bold text-foreground">Buy Backs</h1>
          <p className="text-foreground/50 text-xs mt-0.5">Request a buy back on your land or view your buy back history.</p>
        </div>
      </div>

      {/* CTA — inline on mobile */}
      <Button
        className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-semibold rounded-2xl sm:hidden"
        onClick={() => setSelectOpen(true)}
      >
        <RiAddLine className="h-5 w-5 mr-2" />
        Request a Buy Back
      </Button>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-foreground/5 border border-foreground/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
            <RiExchangeDollarLine className="text-accent h-5 w-5" />
          </div>
          <div>
            <p className="text-foreground/50 text-xs">Total Requests</p>
            <p className="text-foreground font-bold text-xl leading-tight">{isLoading ? '—' : buybacks.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-foreground/5 border border-foreground/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
            <RiTimeLine className="text-blue-400 h-5 w-5" />
          </div>
          <div>
            <p className="text-foreground/50 text-xs">Under Review</p>
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
              title="No buy back requests"
              description="Your buy back requests will appear here."
            />
          ) : (
            <div className="space-y-3">
              {filtered.map((b) => (
                <BuybackCard key={b.id} b={b} onClick={() => setSelectedId(b.id)} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* About Buy Backs */}
      <div className="w-full bg-accent/10 border border-accent/20 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
          <RiInformationLine className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-semibold text-sm">About Buy Backs</p>
          <p className="text-foreground/50 text-xs mt-0.5 leading-relaxed">
            The NeedHomes team will contact you to agree on the buy back price. A processing fee is deducted, and the
            agreed amount is paid within 48 hours of approval.
          </p>
        </div>
      </div>

      {/* FAB — desktop only */}
      <button
        onClick={() => setSelectOpen(true)}
        className="hidden sm:flex fixed bottom-10 right-8 z-40 items-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold text-sm px-5 py-3.5 rounded-full shadow-lg shadow-accent/30 transition-all active:scale-95"
      >
        <RiAddLine className="h-5 w-5 shrink-0" />
        Request a Buy Back
      </button>

      <SelectInvestmentSheet
        open={selectOpen && !buybackInv}
        onOpenChange={(v) => (v ? setSelectOpen(true) : closeFlow())}
        title="Buy Back"
        description="Choose a land banking investment that's eligible for a buy back."
        eligible={eligible}
        isLoading={eligibleLoading}
        emptyText="Land banking investments become eligible for buy back once fully paid."
        onContinue={setChosenId}
        continuing={!!chosenId && !buybackInv}
      />
      {buybackInv && <BuyBackSheet inv={buybackInv} open onClose={closeFlow} onViewStatus={setSelectedId} />}
      <BuyBackDetailSheet buybackId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
