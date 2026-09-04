import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiArrowRightLine,
  RiArrowUpLine,
  RiBankLine,
  RiCustomerServiceLine,
  RiEyeLine,
  RiEyeOffLine,
  RiInformationLine,
  RiMoneyDollarCircleLine,
  RiShieldCheckLine,
  RiWallet3Line,
} from 'react-icons/ri';
import { HiBuildingOffice2 } from 'react-icons/hi2';
import { useCommissionWallet, useCommissionEntries } from '@/hooks/usePartner';
import { useBankAccounts } from '@/hooks/useWallet';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { CommissionDetailSheet } from '@/components/partner/CommissionDetailSheet';
import { CommissionPayoutSheet } from '@/components/partner/CommissionPayoutSheet';
import type { BankAccount, CommissionEntry } from '@/types';

const DEFAULT_MIN_PAYOUT = 50_000;

export default function CommissionWallet() {
  const navigate = useNavigate();
  const { wallet, isLoading: walletLoading } = useCommissionWallet();
  const { bankAccounts, isLoading: banksLoading } = useBankAccounts();
  const { entries, isLoading: entriesLoading } = useCommissionEntries(1, 5);

  const [showBalance, setShowBalance] = useState(true);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  // ── Shared blocks ────────────────────────────────────────────────────────────

  const balanceCard = (
    <div className="bg-primary rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <p className="text-white/60 text-xs">Wallet Balance</p>
        <button
          onClick={() => setShowBalance((v) => !v)}
          className="text-white/40 hover:text-white/70 transition-colors"
        >
          {showBalance ? <RiEyeLine className="h-3.5 w-3.5" /> : <RiEyeOffLine className="h-3.5 w-3.5" />}
        </button>
      </div>

      {walletLoading ? (
        <Skeleton className="h-9 w-44 bg-white/10 mb-4" />
      ) : showBalance ? (
        <div className="mb-4">
          <CurrencyDisplay amount={wallet?.availableBalance ?? 0} size="xl" className="text-white" />
        </div>
      ) : (
        <p className="text-3xl font-bold text-white/30 tracking-widest mb-4">••••••</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/10 rounded-xl px-3 py-2">
          <p className="text-white/50 text-[10px]">Pending</p>
          <p className="text-white text-sm font-semibold mt-0.5">
            {walletLoading ? '...' : showBalance ? formatCurrency(wallet?.pendingCommissions ?? 0) : '••••••'}
          </p>
        </div>
        <div className="bg-white/10 rounded-xl px-3 py-2">
          <p className="text-white/50 text-[10px]">Total Earned</p>
          <p className="text-white text-sm font-semibold mt-0.5">
            {walletLoading ? '...' : showBalance ? formatCurrency(wallet?.totalEarned ?? 0) : '••••••'}
          </p>
        </div>
      </div>
    </div>
  );

  const payoutAccountBlock = (
    <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
      {banksLoading ? (
        <div className="p-4"><Skeleton className="h-5 w-48" /></div>
      ) : !bankAccounts.length ? (
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 text-accent">
            <RiBankLine className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground text-sm font-medium">Payout Account</p>
            <p className="text-foreground/50 text-xs mt-0.5">No bank account linked yet</p>
          </div>
          <button
            onClick={() => navigate('/partner/add-bank-account')}
            className="text-accent text-sm font-semibold hover:opacity-70 transition-opacity flex items-center gap-1 shrink-0"
          >
            Add <RiArrowRightLine className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/10">
            <h2 className="text-foreground font-semibold text-sm">Payout Accounts</h2>
          </div>
          <div className="divide-y divide-foreground/10">
            {bankAccounts.map((b: BankAccount) => (
              <BankAccountRow
                key={b.id}
                shortName={b.shortName}
                accountNumber={b.accountNumber}
                accountHolderName={b.accountHolderName}
                isPrimary={b.isPrimary}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );

  const minPayoutNotice = (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
      <RiShieldCheckLine className="h-4 w-4 text-amber-500 shrink-0" />
      <p className="text-amber-500 text-sm font-medium">
        Minimum payout amount: {formatCurrency(wallet?.minimumPayout ?? DEFAULT_MIN_PAYOUT)}
        {wallet?.payoutFeePercent ? ` · ${wallet.payoutFeePercent}% processing fee` : ''}
      </p>
    </div>
  );

  const recentActivity = (
    <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/10">
        <h2 className="text-foreground font-semibold">Recent Activity</h2>
        <button
          onClick={() => navigate('/partner/commission-earnings')}
          className="text-accent text-sm font-medium hover:underline"
        >
          View All
        </button>
      </div>
      <div className="divide-y divide-foreground/10">
        {entriesLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : !entries.length ? (
          <div className="py-10">
            <EmptyState
              icon={<RiWallet3Line />}
              title="No recent activity"
              description="Your recent commission earnings will appear here."
            />
          </div>
        ) : (
          entries.map((entry: CommissionEntry) => (
            <button
              key={entry.id}
              onClick={() => setSelectedEntryId(entry.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-foreground/5 transition-colors text-left flex-wrap"
            >
              {entry.propertyImageUrl ? (
                <img
                  src={entry.propertyImageUrl}
                  alt={entry.propertyTitle}
                  className="w-10 h-10 rounded-xl object-cover shrink-0"
                />
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
              <RiArrowRightLine className="h-4 w-4 text-foreground/30 shrink-0" />
            </button>
          ))
        )}
      </div>
    </div>
  );

  const walletSummary = (
    <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-foreground/10">
        <h2 className="text-foreground font-semibold text-sm">Wallet Summary</h2>
      </div>
      <div className="divide-y divide-foreground/10">
        {[
          { label: 'Wallet Balance', value: formatCurrency(wallet?.availableBalance ?? 0) },
          { label: 'Total Earned', value: formatCurrency(wallet?.totalEarned ?? 0) },
          { label: 'Total Withdrawn', value: formatCurrency(wallet?.paidOut ?? 0) },
          { label: 'Pending Balance', value: formatCurrency(wallet?.pendingCommissions ?? 0) },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-4 py-3">
            <p className="text-foreground/50 text-sm">{label}</p>
            <p className="text-foreground text-sm font-semibold">
              {walletLoading ? <Skeleton className="h-4 w-20 inline-block" /> : value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const howItWorks = (
    <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <RiInformationLine className="h-4 w-4 text-accent shrink-0" />
        <h2 className="text-foreground font-semibold text-sm">How it works</h2>
      </div>
      <ul className="space-y-2.5">
        {[
          'Earn commission when clients invest in properties through your referral.',
          'Earnings are added to your wallet after each successful investment.',
          'Request a payout anytime once you meet the minimum payout amount.',
          'Payments are processed within 1–3 business days.',
        ].map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-foreground/60 text-xs leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1.5" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );

  const needHelp = (
    <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 text-accent">
        <RiCustomerServiceLine className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-foreground text-sm font-semibold">Need Help?</p>
        <p className="text-foreground/50 text-xs mt-0.5">Chat with our support team</p>
        <button
          onClick={() => navigate('/partner/support')}
          className="text-accent text-xs font-semibold mt-2 flex items-center gap-1 hover:opacity-70 transition-opacity"
        >
          Start a chat <RiArrowRightLine className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 w-full min-w-0">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Commission Wallet</h1>
        <p className="text-foreground/50 text-sm mt-1">
          Track commission balances, request payouts, and review earnings.
        </p>
      </div>

      {/* ── Mobile layout (< lg) ───────────────────────────────────────────────── */}
      <div className="lg:hidden space-y-4">
        {balanceCard}

        {/* Action buttons — old style: one card with vertical divider */}
        <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-foreground/10">
            <button
              onClick={() => setPayoutOpen(true)}
              className="flex flex-col items-center gap-2 py-5 hover:bg-foreground/5 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                <RiArrowUpLine className="h-6 w-6 text-white" />
              </div>
              <div className="text-center">
                <p className="text-foreground text-sm font-semibold">Request Payout</p>
                <p className="text-foreground/40 text-xs">Withdraw commissions</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/partner/commission-earnings')}
              className="flex flex-col items-center gap-2 py-5 hover:bg-foreground/5 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center">
                <RiMoneyDollarCircleLine className="h-6 w-6 text-white" />
              </div>
              <div className="text-center">
                <p className="text-foreground text-sm font-semibold">Commission History</p>
                <p className="text-foreground/40 text-xs">View all earnings</p>
              </div>
            </button>
          </div>
        </div>

        {payoutAccountBlock}
        {minPayoutNotice}
        {walletSummary}
        {recentActivity}
        {needHelp}
      </div>

      {/* ── Desktop layout (≥ lg): two-column sidebar ─────────────────────────── */}
      <div className="hidden lg:grid grid-cols-[1fr_300px] gap-5 items-start">

        {/* Left column */}
        <div className="space-y-4">
          {balanceCard}
          {payoutAccountBlock}
          {minPayoutNotice}
          {recentActivity}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Quick action cards */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPayoutOpen(true)}
              className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-accent/40 hover:bg-accent/5 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center group-hover:bg-accent/25 transition-colors">
                <RiArrowUpLine className="h-6 w-6 text-accent" />
              </div>
              <p className="text-foreground text-xs font-semibold text-center">Request Payout</p>
              <p className="text-foreground/40 text-[10px] text-center leading-snug">Withdraw commissions</p>
            </button>
            <button
              onClick={() => navigate('/partner/commission-earnings')}
              className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center group-hover:bg-emerald-500/25 transition-colors">
                <RiMoneyDollarCircleLine className="h-6 w-6 text-emerald-500" />
              </div>
              <p className="text-foreground text-xs font-semibold text-center">Commission History</p>
              <p className="text-foreground/40 text-[10px] text-center leading-snug">View all earnings</p>
            </button>
          </div>

          {walletSummary}
          {howItWorks}
          {needHelp}
        </div>
      </div>

      <CommissionPayoutSheet
        open={payoutOpen}
        onOpenChange={setPayoutOpen}
        bankAccounts={bankAccounts}
        availableBalance={wallet?.availableBalance ?? 0}
        minimumPayout={wallet?.minimumPayout ?? DEFAULT_MIN_PAYOUT}
        payoutFeePercent={wallet?.payoutFeePercent}
      />

      <CommissionDetailSheet
        entryId={selectedEntryId}
        onClose={() => setSelectedEntryId(null)}
      />
    </div>
  );
}


function BankAccountRow({
  shortName,
  accountNumber,
  accountHolderName,
  isPrimary,
}: {
  shortName: string;
  accountNumber: string;
  accountHolderName: string;
  isPrimary: boolean;
}) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
      <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
        <RiBankLine className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="flex items-center gap-2 flex-wrap">
          <p className="text-foreground text-sm font-medium min-w-0 flex items-center gap-1">
            <span className="truncate">{shortName}</span>
            <span className="shrink-0 hidden sm:inline">— {accountNumber}</span>
          </p>
          {isPrimary && (
            <span className="text-xs bg-emerald-700/10 p-1 rounded-xl text-emerald-700 font-medium shrink-0">Primary</span>
          )}
        </span>
        <p className="text-foreground/40 text-xs">{accountHolderName}</p>
      </div>
      <button
        className="p-1.5 text-accent transition-colors flex cursor-pointer items-center"
        onClick={() => navigate('/partner/add-bank-account')}
      >
        <span className="text-xs font-medium">Manage</span>
        <RiArrowRightLine className="h-4 w-4" />
      </button>
    </div>
  );
}
