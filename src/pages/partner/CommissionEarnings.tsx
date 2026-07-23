import { useState, useMemo, useEffect } from 'react';
import { RiArrowRightSLine, RiMoneyDollarCircleLine } from 'react-icons/ri';
import { HiBuildingOffice2 } from 'react-icons/hi2';
import { useCommissionWallet, useCommissionEntries } from '@/hooks/usePartner';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CommissionDetailSheet } from '@/components/partner/CommissionDetailSheet';
import type { CommissionEntry } from '@/types';

export default function CommissionEarnings() {
  const { wallet, isLoading: walletLoading } = useCommissionWallet();

  const [page, setPage] = useState(1);
  const [allEntries, setAllEntries] = useState<CommissionEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'earned' | 'payouts'>('all');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const { entries, pagination, isLoading: entriesLoading } = useCommissionEntries(page);

  useEffect(() => {
    if (!entriesLoading) {
      setAllEntries((prev) => {
        if (page === 1) return entries;
        const existingIds = new Set(prev.map((e) => e.id));
        const fresh = entries.filter((e) => !existingIds.has(e.id));
        return fresh.length ? [...prev, ...fresh] : prev;
      });
    }
  }, [entries]); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleEntries = useMemo(() => {
    if (activeTab === 'earned') return allEntries.filter((e) => e.type === 'earned');
    if (activeTab === 'payouts') return allEntries.filter((e) => e.type === 'payout');
    return allEntries;
  }, [allEntries, activeTab]);

  const totalEarned = wallet?.totalEarned ?? 0;
  const balance = wallet?.availableBalance ?? 0;
  const paidOut = wallet?.paidOut ?? 0;

  const hasNextPage = pagination ? page < pagination.totalPages : false;
  const isLoadingMore = entriesLoading && page > 1;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Earnings</h1>
        <p className="text-foreground/50 text-sm mt-1">
          Review commission totals, payouts, and transaction history.
        </p>
      </div>

      {/* ── Commission Overview card ─────────────────────────────────────────── */}
      <div className="bg-primary rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <RiMoneyDollarCircleLine className="h-5 w-5 text-white" />
          </div>
          <p className="text-white/70 font-medium">Commission Overview</p>
        </div>

        <div className="mb-4">
          <p className="text-white/50 text-xs mb-1">Total Earned</p>
          {walletLoading ? (
            <Skeleton className="h-9 w-44 bg-white/10" />
          ) : (
            <CurrencyDisplay amount={totalEarned} size="xl" className="text-white" />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-xl px-3 py-2">
            <p className="text-white/50 text-[10px]">Pending</p>
            <p className="text-white text-sm font-semibold mt-0.5">
              {walletLoading ? '...' : formatCurrency(balance)}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl px-3 py-2">
            <p className="text-white/50 text-[10px]">Paid Out</p>
            <p className="text-white text-sm font-semibold mt-0.5">
              {walletLoading ? '...' : formatCurrency(paidOut)}
            </p>
          </div>
        </div>
      </div>

      {/* ── History ──────────────────────────────────────────────────────────── */}
      <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-foreground/10">
          <h2 className="text-foreground font-semibold">History</h2>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-foreground/10">
          {([
            { value: 'all', label: 'All' },
            { value: 'earned', label: 'Earned' },
            { value: 'payouts', label: 'Payouts' },
          ] as const).map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                activeTab === tab.value
                  ? 'bg-accent text-white'
                  : 'text-foreground/50 hover:text-foreground/80'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-foreground/10">
          {entriesLoading && page === 1 ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : !visibleEntries.length ? (
            <div className="py-10">
              <EmptyState
                icon={<RiMoneyDollarCircleLine />}
                title={
                  activeTab === 'payouts'
                    ? 'No payouts yet'
                    : activeTab === 'earned'
                    ? 'No earned commissions yet'
                    : 'No commission history yet'
                }
                description="Share your referral links to start earning."
              />
            </div>
          ) : (
            <>
              {visibleEntries.map((entry) => (
                <CommissionRow key={entry.id} entry={entry} onClick={() => setSelectedEntryId(entry.id)} />
              ))}

              {hasNextPage && (
                <div className="p-4 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={isLoadingMore}
                    className="min-w-32"
                  >
                    {isLoadingMore ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <CommissionDetailSheet
        entryId={selectedEntryId}
        onClose={() => setSelectedEntryId(null)}
      />
    </div>
  );
}

function CommissionRow({ entry, onClick }: { entry: CommissionEntry; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-foreground/5 transition-colors text-left">
      {entry.propertyImageUrl ? (
        <img src={entry.propertyImageUrl} alt={entry.propertyTitle} className="w-10 h-10 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 text-accent">
          <HiBuildingOffice2 className="h-5 w-5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-foreground text-sm font-medium truncate">{entry.propertyTitle}</p>
        <p className="text-foreground/50 text-xs truncate mt-0.5">{entry.subtitle}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-green-400 text-sm font-semibold">+{formatCurrency(entry.amount)}</p>
        <p className="text-foreground/50 text-xs mt-0.5">{formatDate(entry.occurredAt)}</p>
      </div>
      <RiArrowRightSLine className="h-4 w-4 text-foreground/30 shrink-0" />
    </button>
  );
}
