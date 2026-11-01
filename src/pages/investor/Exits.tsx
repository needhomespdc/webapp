import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiArrowRightSLine,
  RiInformationLine,
  RiLogoutCircleRLine,
  RiTimeLine,
  RiAddLine,
  RiBook2Line,
  RiBuildingLine,
} from 'react-icons/ri';
import { useEligibleExits, useExitList } from '@/hooks/useExits';
import { ExitDetailSheet } from '@/components/exits/ExitDetailSheet';
import { ExitInvestmentSheet } from '@/components/exits/ExitInvestmentSheet';
import { SelectInvestmentSheet } from '@/components/investment/SelectInvestmentSheet';
import { useInvestmentDetail } from '@/hooks/useInvestment';
import { formatCurrency, formatDate } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { ExitRequest } from '@/types';

// ─── Exit card ─────────────────────────────────────────────────────────────────

function ExitCard({ exit, onClick }: { exit: ExitRequest; onClick: () => void }) {
  const title = exit.propertyTitle || exit.title || 'Investment';
  const rawDate = exit.listedAt || exit.requestedAt;
  const date = exit.dateLabel || (rawDate ? formatDate(rawDate) : '—');
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-foreground/5 border border-foreground/10 rounded-2xl p-4 flex flex-col gap-3 cursor-pointer hover:border-foreground/20 transition-colors active:scale-[0.99]"
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-foreground/10">
          {exit.propertyImageUrl
            ? <img src={exit.propertyImageUrl} alt={title} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><RiBuildingLine className="h-6 w-6 text-foreground/30" /></div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-bold text-sm line-clamp-1">{title}</p>
          <p className="text-foreground/50 text-xs mt-0.5">{exit.location}</p>
        </div>
        <StatusBadge status={exit.status} label={exit.statusLabel} />
      </div>

      {/* 3-col grid — labels/values come from server */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-foreground/40">Date</p>
          <p className="text-foreground font-medium mt-0.5">{date}</p>
        </div>
        <div>
          <p className="text-foreground/40">Shares</p>
          <p className="text-foreground font-medium mt-0.5">{exit.sharesLabel}</p>
        </div>
        <div>
          <p className="text-foreground/40">{exit.amountLabel}</p>
          <p className={cn('font-semibold mt-0.5', exit.isAmountReceived ? 'text-green-400' : 'text-foreground')}>
            {formatCurrency(exit.amount)}
          </p>
        </div>
      </div>

      {/* Arrow */}
      <div className="flex justify-end">
        <div className="w-7 h-7 rounded-full border border-foreground/15 flex items-center justify-center text-foreground/30">
          <RiArrowRightSLine className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TAB_LABELS: Record<string, string> = { all: 'All Exits', pending: 'Pending', cancelled: 'Cancelled' };

const STATUS_ALIASES: Record<string, 'pending' | 'completed' | 'cancelled'> = {
  pending: 'pending',
  under_review: 'pending',
  in_review: 'pending',
  processing: 'pending',
  approved: 'pending',
  completed: 'completed',
  paid: 'completed',
  exited: 'completed',
  cancelled: 'cancelled',
  canceled: 'cancelled',
  rejected: 'cancelled',
  declined: 'cancelled',
};

function exitStatusKey(raw: string | undefined) {
  return STATUS_ALIASES[(raw ?? '').toLowerCase().replace(/[\s-]+/g, '_')];
}

export default function Exits() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedExitId, setSelectedExitId] = useState<string | null>(null);
  // New Exit Request: pick an investment, then the same exit modal as the investment page
  const [chosenId, setChosenId] = useState<string | null>(null);
  const { investment } = useInvestmentDetail(chosenId ?? undefined);
  const exitInv = chosenId && investment?.id === chosenId ? investment : null;
  const closeExitFlow = () => {
    setChosenId(null);
    setSheetOpen(false);
  };

  const { eligible, isLoading: eligibleLoading } = useEligibleExits();
  const { exits, summary, isLoading } = useExitList('history');

  // The API's summary often comes back empty and its statuses vary in case, so count from the
  // exits themselves and only trust the summary when it reports more
  const counted = { pending: 0, completed: 0, cancelled: 0 };
  exits.forEach((e) => {
    const key = exitStatusKey(e.status);
    if (key) counted[key] += 1;
  });
  const pendingCount = Math.max(summary.pendingCount ?? 0, counted.pending);
  const completedCount = Math.max(summary.completedCount ?? 0, counted.completed);
  const totalExits = pendingCount + completedCount;

  const filtered = tab === 'all' ? exits : exits.filter((e) => exitStatusKey(e.status) === tab);

  return (
    <div className="space-y-5 sm:pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/investor/exits-and-resales')}
          className="w-9 h-9 rounded-full bg-foreground/8 flex items-center justify-center text-foreground/60 hover:bg-foreground/15 transition-colors shrink-0"
        >
          <RiArrowLeftLine className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Exits</h1>
          <p className="text-foreground/50 text-xs mt-0.5">Request to exit your investment or view your exit history.</p>
        </div>
      </div>

      {/* CTA — inline on mobile */}
      <Button
        className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-semibold rounded-2xl sm:hidden"
        onClick={() => setSheetOpen(true)}
      >
        <RiAddLine className="h-5 w-5 mr-2" />
        New Exit Request
      </Button>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-foreground/5 border border-foreground/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
            <RiLogoutCircleRLine className="text-accent h-5 w-5" />
          </div>
          <div>
            <p className="text-foreground/50 text-xs">Total Exits</p>
            <p className="text-foreground font-bold text-xl leading-tight">{isLoading ? '—' : totalExits}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-foreground/5 border border-foreground/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
            <RiTimeLine className="text-blue-400 h-5 w-5" />
          </div>
          <div>
            <p className="text-foreground/50 text-xs">Pending Exits</p>
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
            <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}</div>
          ) : !filtered.length ? (
            <EmptyState icon={<RiBook2Line />} title="No exit requests" description="Your exit history will appear here." />
          ) : (
            <div className="space-y-3">
              {filtered.map((exit) => (
                <ExitCard key={exit.id} exit={exit} onClick={() => setSelectedExitId(exit.id)} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* About Exits */}
      <button className="w-full bg-accent/10 border border-accent/20 rounded-2xl p-4 flex items-center gap-3 text-left hover:bg-accent/15 transition-colors">
        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
          <RiInformationLine className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-semibold text-sm">About Exits</p>
          <p className="text-foreground/50 text-xs mt-0.5 leading-relaxed">
            Exit requests are subject to availability of buyers and company approval. Payouts are processed after a successful exit.
          </p>
        </div>
        <RiArrowRightLine className="text-foreground/30 h-5 w-5 shrink-0" />
      </button>

      {/* FAB — desktop only */}
      <button
        onClick={() => setSheetOpen(true)}
        className="hidden sm:flex fixed bottom-10 right-8 z-40 items-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold text-sm px-5 py-3.5 rounded-full shadow-lg shadow-accent/30 transition-all active:scale-95"
      >
        <RiAddLine className="h-5 w-5 shrink-0" />
        New Exit Request
      </button>

      {/* New Exit Request: select an investment, then the investment page's exit modal */}
      <SelectInvestmentSheet
        open={sheetOpen && !exitInv}
        onOpenChange={(v) => (v ? setSheetOpen(true) : closeExitFlow())}
        title="Exit Investment"
        description="Choose an investment that meets the exit eligibility requirements for its type."
        eligible={eligible}
        isLoading={eligibleLoading}
        emptyText="Investments become eligible for exit based on their type's rules."
        onContinue={setChosenId}
        continuing={!!chosenId && !exitInv}
      />
      {exitInv && (
        <ExitInvestmentSheet inv={exitInv} open onClose={closeExitFlow} onViewStatus={setSelectedExitId} />
      )}

      {/* Exit Detail sheet */}
      <ExitDetailSheet
        exitId={selectedExitId}
        onClose={() => setSelectedExitId(null)}
      />
    </div>
  );
}
