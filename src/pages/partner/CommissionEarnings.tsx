import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiArrowRightSLine,
  RiMoneyDollarCircleLine,
  RiArrowUpLine,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiArrowDownLine,
  RiWallet3Line,
} from 'react-icons/ri';
import { HiBuildingOffice2 } from 'react-icons/hi2';
import { useCommissionWallet, useCommissionEntries } from '@/hooks/usePartner';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CommissionDetailSheet } from '@/components/partner/CommissionDetailSheet';
import type { CommissionEntry } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  completed:  { label: 'Completed',  cls: 'bg-green-500/15 text-green-400'  },
  pending:    { label: 'Pending',    cls: 'bg-amber-500/15 text-amber-400'  },
  processing: { label: 'Processing', cls: 'bg-blue-500/15 text-blue-400'    },
  failed:     { label: 'Failed',     cls: 'bg-red-500/15 text-red-400'      },
};

export default function CommissionEarnings() {
  const navigate = useNavigate();
  const { wallet, isLoading: walletLoading } = useCommissionWallet();

  const [page, setPage] = useState(1);
  const [allEntries, setAllEntries] = useState<CommissionEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'earned' | 'payouts'>('all');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<CommissionEntry | undefined>(undefined);

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

  const totalEarned        = wallet?.totalEarned ?? 0;
  const availableBalance   = wallet?.availableBalance ?? 0;
  const pendingCommissions = wallet?.pendingCommissions ?? 0;
  const paidOut            = wallet?.paidOut ?? 0;
  const minimumPayout      = wallet?.minimumPayout ?? 0;
  const canWithdraw        = availableBalance >= minimumPayout && minimumPayout > 0;

  const hasNextPage   = pagination ? page < pagination.totalPages : false;
  const isLoadingMore = entriesLoading && page > 1;

  const STATS = [
    {
      icon: RiMoneyDollarCircleLine,
      label: 'Total Earned',
      value: totalEarned,
      iconBg: 'bg-accent/15',
      iconCls: 'text-accent',
    },
    {
      icon: RiCheckboxCircleLine,
      label: 'Available',
      value: availableBalance,
      iconBg: 'bg-green-500/15',
      iconCls: 'text-green-400',
    },
    {
      icon: RiTimeLine,
      label: 'Pending',
      value: pendingCommissions,
      iconBg: 'bg-amber-500/15',
      iconCls: 'text-amber-400',
    },
    {
      icon: RiArrowUpLine,
      label: 'Paid Out',
      value: paidOut,
      iconBg: 'bg-foreground/8',
      iconCls: 'text-foreground/50',
    },
  ] as const;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Earnings</h1>
        <p className="text-foreground/50 text-sm mt-1">
          Review commission totals, payouts, and transaction history.
        </p>
      </div>

      {/* ── 4 stat tiles ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATS.map(({ icon: Icon, label, value, iconBg, iconCls }) => (
          <div
            key={label}
            className="bg-foreground/5 border border-foreground/10 rounded-2xl px-4 py-4 flex items-center gap-3"
          >
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
              <Icon className={cn('h-5 w-5', iconCls)} />
            </div>
            <div className="min-w-0">
              <p className="text-foreground/45 text-[11px] leading-none mb-1">{label}</p>
              {walletLoading ? (
                <div className="h-4 w-16 bg-foreground/10 rounded animate-pulse" />
              ) : (
                <p className="text-foreground font-bold text-sm leading-tight truncate">
                  {formatCurrency(value)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Withdraw CTA ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 bg-foreground/5 border border-foreground/10 rounded-2xl px-4 py-4">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
          <RiWallet3Line className="h-5 w-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground text-sm font-semibold">
            {canWithdraw ? `${formatCurrency(availableBalance)} available` : 'Commission Wallet'}
          </p>
          <p className="text-foreground/45 text-xs mt-0.5">
            {canWithdraw
              ? 'Ready to withdraw to your bank account'
              : minimumPayout > 0 && !walletLoading
                ? `Min. withdrawal: ${formatCurrency(minimumPayout)}`
                : 'Manage your commission payouts'}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => navigate('/partner/wallet')}
          className={cn(
            'shrink-0 rounded-xl font-semibold text-xs h-9 px-4',
            canWithdraw
              ? 'bg-accent hover:bg-accent/90 text-white'
              : 'bg-foreground/8 text-foreground/50 hover:bg-foreground/12'
          )}
        >
          {canWithdraw ? 'Withdraw' : 'Go to Wallet'}
        </Button>
      </div>

      {/* ── History + Summary ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5 items-start">

        {/* History */}
        <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
          <div className="px-4 py-3.5 border-b border-foreground/10 flex items-center justify-between">
            <h2 className="text-foreground font-semibold text-sm">Transaction History</h2>
            <span className="text-foreground/40 text-xs">{allEntries.length} entries</span>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-foreground/10">
            {([
              { value: 'all',     label: 'All'     },
              { value: 'earned',  label: 'Earned'  },
              { value: 'payouts', label: 'Payouts' },
            ] as const).map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-xs font-semibold transition-colors',
                  activeTab === tab.value
                    ? 'bg-accent text-white'
                    : 'bg-foreground/5 text-foreground/50 hover:text-foreground/80 hover:bg-foreground/10'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-foreground/8">
            {entriesLoading && page === 1 ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-17 w-full rounded-xl" />)}
              </div>
            ) : !visibleEntries.length ? (
              <div className="py-12">
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
                  <CommissionRow
                    key={entry.id}
                    entry={entry}
                    onClick={() => { setSelectedEntryId(entry.id); setSelectedEntry(entry); }}
                  />
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

        {/* Earnings Summary — desktop sidebar */}
        <div className="hidden lg:block">
          <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-foreground/10">
              <h2 className="text-foreground font-semibold text-sm">Summary</h2>
            </div>
            <div className="divide-y divide-foreground/8">
              {[
                { label: 'Total Earned',   value: totalEarned,        cls: 'text-foreground font-semibold' },
                { label: 'Available',      value: availableBalance,   cls: 'text-green-400 font-semibold'  },
                { label: 'Pending',        value: pendingCommissions, cls: 'text-amber-400 font-semibold'  },
                { label: 'Total Paid Out', value: paidOut,            cls: 'text-foreground/60'            },
              ].map(({ label, value, cls }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3.5">
                  <span className="text-foreground/50 text-xs">{label}</span>
                  {walletLoading ? (
                    <div className="h-3.5 w-20 bg-foreground/10 rounded animate-pulse" />
                  ) : (
                    <span className={cn('text-sm', cls)}>{formatCurrency(value)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <CommissionDetailSheet
        entryId={selectedEntryId}
        initialEntry={selectedEntry}
        onClose={() => { setSelectedEntryId(null); setSelectedEntry(undefined); }}
      />
    </div>
  );
}

function CommissionRow({ entry, onClick }: { entry: CommissionEntry; onClick: () => void }) {
  const isPayout  = entry.type === 'payout';
  const statusCfg = STATUS_CONFIG[entry.status] ?? { label: entry.status, cls: 'bg-foreground/10 text-foreground/60' };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-foreground/5 transition-colors text-left"
    >
      {entry.propertyImageUrl ? (
        <img
          src={entry.propertyImageUrl}
          alt={entry.propertyTitle}
          className="w-11 h-11 rounded-xl object-cover shrink-0"
        />
      ) : (
        <div className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
          isPayout ? 'bg-red-500/10' : 'bg-accent/10'
        )}>
          {isPayout
            ? <RiArrowDownLine className="h-5 w-5 text-red-400" />
            : <HiBuildingOffice2 className="h-5 w-5 text-accent" />
          }
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-foreground text-sm font-medium truncate leading-tight">
          {entry.propertyTitle}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusCfg.cls)}>
            {statusCfg.label}
          </span>
          <span className="text-foreground/35 text-[10px]">{formatDate(entry.occurredAt)}</span>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className={cn('text-sm font-semibold', isPayout ? 'text-red-400' : 'text-green-400')}>
          {isPayout ? '-' : '+'}{formatCurrency(entry.amount)}
        </p>
        <p className="text-foreground/35 text-[10px] mt-0.5 capitalize">{entry.type}</p>
      </div>

      <RiArrowRightSLine className="h-4 w-4 text-foreground/25 shrink-0" />
    </button>
  );
}
