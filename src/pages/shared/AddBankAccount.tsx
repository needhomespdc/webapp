import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  RiBankLine,
  RiQuestionLine,
  RiSearchLine,
  RiCheckLine,
  RiShieldCheckLine,
  RiArrowDownSLine,
  RiAddCircleLine,
  RiDeleteBinLine,
  RiStarLine,
} from 'react-icons/ri';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from '@/hooks/useToast';
import { walletApi } from '@/api/wallet.api';
import { queryKeys } from '@/lib/queryKeys';
import { ApiError } from '@/lib/fetchClient';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useBankAccounts, useRemoveBankAccount } from '@/hooks/useWallet';
import type { Bank } from '@/types';
import { cn } from '@/lib/utils';

export default function AddBankAccount() {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const [formOpen, setFormOpen] = useState(false);
  const { bankAccounts, isLoading } = useBankAccounts();
  const hasAccount = bankAccounts.length > 0;

  return (
    <div className="space-y-5 w-full min-w-0">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bank Account</h1>
        <p className="text-foreground/50 text-sm mt-1">
          Manage your linked bank account for withdrawals.
        </p>
      </div>

      {/* Accounts card */}
      <div className="bg-card rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : !hasAccount ? (
          <EmptyState />
        ) : (
          <>
            <div className="px-4 py-3 border-b border-border">
              <span className="text-xs font-semibold text-foreground/40 uppercase tracking-wider">
                Linked Account
              </span>
            </div>
            <div className="divide-y divide-border">
              {bankAccounts.map((b) => (
                <BankAccountRow
                  key={b.id}
                  bankAccountId={b.id}
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

      {/* CTA */}
      <div className="space-y-2">
        <Button
          onClick={() => setFormOpen(true)}
          disabled={hasAccount}
          className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl text-sm gap-2 disabled:opacity-50"
        >
          <RiAddCircleLine className="text-base" />
          Add New Bank Account
        </Button>
        {hasAccount && (
          <p className="text-xs text-center text-foreground/40">
            Remove your current account first to add a new one.
          </p>
        )}
      </div>

      {/* Security notice */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-foreground/40 pb-2">
        <RiShieldCheckLine className="shrink-0" />
        <span>Bank-level encryption. Your details are safe.</span>
      </div>

      {/* Floating help button */}
      <button className="fixed bottom-6 right-5 z-30 flex items-center gap-1.5 bg-accent text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg hover:bg-accent/90 transition-colors">
        <RiQuestionLine className="text-sm" />
        Help
      </button>

      {/* Form: bottom sheet on mobile, centered dialog on desktop */}
      {isMobile ? (
        <Sheet open={formOpen} onOpenChange={setFormOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl p-0 max-h-[92vh] overflow-y-auto">
            <AddBankForm onSuccess={() => setFormOpen(false)} />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="p-0 max-w-xl rounded-2xl overflow-hidden gap-0">
            <AddBankForm onSuccess={() => setFormOpen(false)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Empty state 

function EmptyState() {
  return (
    <div className="flex flex-col items-center text-center px-6 py-12 gap-3">
      <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center">
        <RiBankLine className="text-3xl text-accent/60" />
      </div>
      <p className="text-sm font-semibold text-foreground">No bank account linked</p>
      <p className="text-xs text-foreground/50 leading-relaxed max-w-[220px]">
        Link a bank account to start withdrawing funds from your wallet.
      </p>
    </div>
  );
}

// Bank account row

function BankAccountRow({
  bankAccountId,
  shortName,
  accountNumber,
  accountHolderName,
  isPrimary,
}: {
  bankAccountId: string;
  shortName: string;
  accountNumber: string;
  accountHolderName: string;
  isPrimary: boolean;
}) {
  const removeMutation = useRemoveBankAccount();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
          <RiBankLine className="text-xl text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{shortName}</p>
            {isPrimary && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full shrink-0">
                <RiStarLine className="text-[10px]" /> Primary
              </span>
            )}
          </div>
          <p className="text-xs text-foreground/50 mt-0.5">
            {accountNumber} · {accountHolderName}
          </p>
        </div>
        <button
          onClick={() => setConfirmOpen(true)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground/30 hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
        >
          <RiDeleteBinLine className="h-4 w-4" />
        </button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm rounded-2xl p-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
              <RiDeleteBinLine className="text-2xl text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Remove bank account?</h3>
              <p className="text-sm text-foreground/50 mt-1.5 leading-relaxed">
                <span className="font-medium text-foreground">{shortName}</span> ending in{' '}
                <span className="font-medium text-foreground">{accountNumber.slice(-4)}</span> will
                be unlinked from your wallet.
              </p>
            </div>
            <div className="flex gap-3 w-full pt-1">
              <Button
                variant="outline"
                className="flex-1 h-11 rounded-xl"
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white"
                disabled={removeMutation.isPending}
                onClick={() =>
                  removeMutation.mutate(bankAccountId, {
                    onSuccess: () => setConfirmOpen(false),
                    onError: () => toast.error('Failed to remove bank account'),
                  })
                }
              >
                {removeMutation.isPending ? 'Removing...' : 'Remove'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Add bank form
function AddBankForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const [accountNumber, setAccountNumber] = useState('');
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [accountName, setAccountName] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: banks = [], isLoading: loadingBanks } = useQuery({
    queryKey: queryKeys.wallet.banks,
    queryFn: () => walletApi.getBanks(),
    staleTime: 10 * 60 * 1000,
  });

  const filteredBanks = banks.filter((b) => {
    const q = bankSearch.toLowerCase();
    return b.name.toLowerCase().includes(q) || b.shortName.toLowerCase().includes(q);
  });

  useEffect(() => {
    if (accountNumber.length !== 10 || !selectedBank) {
      setAccountName('');
      return;
    }
    let cancelled = false;
    setIsResolving(true);
    setAccountName('');
    walletApi
      .resolveBank(selectedBank.code, accountNumber)
      .then((data) => {
        if (cancelled) return;
        setAccountName(data.accountName);
        if (!data.matchesProfile) toast.error('Account name does not match your profile');
      })
      .catch(() => {
        if (cancelled) return;
        toast.error('Could not verify account — check your details and try again');
      })
      .finally(() => { if (!cancelled) setIsResolving(false); });
    return () => { cancelled = true; };
  }, [accountNumber, selectedBank]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addBankMutation = useMutation({
    mutationFn: () =>
      walletApi.addBankAccount({
        shortName: selectedBank!.shortName,
        fullName: selectedBank!.fullName,
        accountNumber,
        accountHolderName: accountName,
        bankCode: selectedBank!.code,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.bankAccounts });
      toast.success('Bank account linked successfully');
      onSuccess();
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : 'Failed to link bank account'),
  });

  const canSubmit =
    accountNumber.length === 10 && selectedBank !== null && accountName !== '' && !isResolving;

  return (
    <div className="flex flex-col">
      <div className="px-6 pt-6">
        <SheetHeader>
          <SheetTitle className="text-foreground text-base font-semibold">Add Bank Account</SheetTitle>
          <SheetDescription className="text-foreground/50 text-sm mt-0.5">
            Enter your details to link a bank account.
          </SheetDescription>
        </SheetHeader>
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* Bank selector */}
        <div className="space-y-1.5" ref={dropdownRef}>
          <Label className="text-sm font-medium text-foreground/70">
            Bank
          </Label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              className={cn(
                'w-full h-11 flex items-center gap-2.5 px-3 border rounded-lg bg-background text-sm text-left transition-all',
                dropdownOpen
                  ? 'border-primary ring-2 ring-primary/15'
                  : 'border-border hover:border-foreground/30'
              )}
            >
              {selectedBank ? (
                <>
                  {selectedBank.logoUrl ? (
                    <img src={selectedBank.logoUrl} alt={selectedBank.shortName} className="w-5 h-5 rounded object-contain shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded bg-foreground/10 flex items-center justify-center shrink-0">
                      <RiBankLine className="text-xs text-foreground/40" />
                    </div>
                  )}
                  <span className="flex-1 text-foreground truncate">{selectedBank.name}</span>
                </>
              ) : (
                <>
                  <RiBankLine className="text-foreground/35 shrink-0" />
                  <span className="flex-1 text-foreground/40">
                    {loadingBanks ? 'Loading banks...' : 'Select your bank'}
                  </span>
                </>
              )}
              <RiArrowDownSLine className={cn('text-foreground/35 text-lg shrink-0 transition-transform', dropdownOpen && 'rotate-180')} />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-xl shadow-xl z-30 overflow-hidden">
                <div className="p-2 border-b border-border">
                  <div className="relative">
                    <RiSearchLine className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground/40 text-sm pointer-events-none" />
                    <Input className="pl-8 h-8 text-sm" placeholder="Search banks..." value={bankSearch} onChange={(e) => setBankSearch(e.target.value)} autoFocus />
                  </div>
                </div>
                <div className="max-h-44 overflow-y-auto">
                  {filteredBanks.length === 0 ? (
                    <p className="text-center text-sm text-foreground/40 py-5">No banks found</p>
                  ) : (
                    filteredBanks.map((bank) => (
                      <button
                        key={bank.code}
                        type="button"
                        onClick={() => { setSelectedBank(bank); setBankSearch(''); setDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-foreground/5 text-sm transition-colors"
                      >
                        {bank.logoUrl ? (
                          <img src={bank.logoUrl} alt={bank.shortName} className="w-6 h-6 rounded object-contain shrink-0" />
                        ) : (
                          <div className="w-6 h-6 rounded bg-foreground/10 flex items-center justify-center shrink-0">
                            <RiBankLine className="text-xs text-foreground/40" />
                          </div>
                        )}
                        <span className="flex-1 text-left text-foreground truncate">{bank.name}</span>
                        {selectedBank?.code === bank.code && <RiCheckLine className="text-primary text-base shrink-0" />}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Number */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-foreground/70">Account Number</Label>
          <div className="relative">
            <RiBankLine className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/35 text-base pointer-events-none" />
            <Input
              className="pl-9 h-11"
              placeholder="Enter 10-digit account number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              maxLength={10}
              inputMode="numeric"
            />
          </div>
        </div>

        {/* Account Name */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-foreground/70">Account Name</Label>
          <Input
            className={cn('h-11 bg-foreground/5 text-foreground/70 cursor-default', isResolving && 'animate-pulse')}
            placeholder={isResolving ? 'Verifying account...' : 'Auto-filled after account number + bank'}
            value={isResolving ? '' : accountName}
            readOnly
          />
          {accountName && !isResolving && (
            <p className="text-xs text-emerald-500 flex items-center gap-1 font-medium">
              <RiCheckLine /> Account verified
            </p>
          )}
        </div>
      </div>

      <div className="px-6 pb-6 pt-2 space-y-3">
        <Button
          className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl text-sm"
          onClick={() => addBankMutation.mutate()}
          disabled={!canSubmit || addBankMutation.isPending}
        >
          {addBankMutation.isPending ? 'Linking account...' : 'Link Bank Account'}
        </Button>
        <div className="flex items-center justify-center gap-1.5 text-xs text-foreground/40">
          <RiShieldCheckLine className="shrink-0" />
          <span>Your details are encrypted with bank-level security.</span>
        </div>
      </div>
    </div>
  );
}
