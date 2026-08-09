import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RiFingerprint2Line,
  RiEyeLine,
  RiEyeOffLine,
  RiShieldCheckLine,
} from 'react-icons/ri';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { walletApi } from '@/api/wallet.api';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from '@/hooks/useToast';
import { ApiError } from '@/lib/fetchClient';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

// ─── Single PIN field ─────────────────────────────────────────────────────────

function PinField({
  label,
  value,
  onChange,
  show,
  onToggleShow,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-foreground/50 uppercase tracking-wide">{label}</p>
      <div className="bg-foreground/5 rounded-xl px-4 h-13 flex items-center gap-3">
        <RiFingerprint2Line className="text-accent/60 text-xl shrink-0" />
        <input
          type={show ? 'text' : 'password'}
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder={placeholder}
          autoComplete="off"
          className="flex-1 bg-transparent text-foreground text-base outline-none placeholder:text-foreground/25 tracking-[0.5em] min-w-0 py-3.5"
        />
        <button
          type="button"
          onClick={onToggleShow}
          tabIndex={-1}
          className="shrink-0 text-foreground/30 hover:text-foreground/60 transition-colors p-1"
        >
          {show ? <RiEyeOffLine className="text-lg" /> : <RiEyeLine className="text-lg" />}
        </button>
      </div>
    </div>
  );
}

// ─── Modal / Sheet ────────────────────────────────────────────────────────────

interface PinSetModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: 'set' | 'change';
}

export function PinSetModal({ open, onOpenChange, mode }: PinSetModalProps) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const queryClient = useQueryClient();

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      walletApi.setPin(mode === 'change' ? { pin: newPin, currentPin } : { pin: newPin }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.pinStatus });
      toast.success(mode === 'set' ? 'Transaction PIN set!' : 'Transaction PIN updated!');
      handleClose(false);
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : 'Failed to save PIN'),
  });

  const pinsMatch = newPin === confirmPin;
  const canSubmit =
    (mode === 'set' || currentPin.length === 4) &&
    newPin.length === 4 &&
    confirmPin.length === 4 &&
    pinsMatch &&
    !mutation.isPending;

  const handleClose = (v: boolean) => {
    if (!v) {
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    }
    onOpenChange(v);
  };

  const content = (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-foreground/8 shrink-0">
        <SheetHeader>
          <SheetTitle className="text-base font-semibold text-foreground text-left">
            {mode === 'set' ? 'Set Transaction PIN' : 'Update Transaction PIN'}
          </SheetTitle>
        </SheetHeader>
        <p className="text-xs text-foreground/40 mt-0.5">
          {mode === 'set'
            ? 'Create a 4-digit PIN to authorize wallet transactions.'
            : 'Enter your current PIN, then choose a new one.'}
        </p>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-6">
        {/* Icon */}
        <div className="flex justify-center mb-7">
          <div className="w-20 h-20 rounded-full bg-accent/15 flex items-center justify-center">
            <RiFingerprint2Line className="text-accent h-10 w-10" />
          </div>
        </div>

        <div className={cn('space-y-4', mode === 'change' ? 'mb-2' : '')}>
          {mode === 'change' && (
            <PinField
              label="Current PIN"
              value={currentPin}
              onChange={setCurrentPin}
              show={showCurrent}
              onToggleShow={() => setShowCurrent((v) => !v)}
              placeholder="• • • •"
            />
          )}

          <PinField
            label={mode === 'set' ? 'Create PIN' : 'New PIN'}
            value={newPin}
            onChange={setNewPin}
            show={showNew}
            onToggleShow={() => setShowNew((v) => !v)}
            placeholder="• • • •"
          />

          <PinField
            label="Confirm PIN"
            value={confirmPin}
            onChange={setConfirmPin}
            show={showConfirm}
            onToggleShow={() => setShowConfirm((v) => !v)}
            placeholder="• • • •"
          />
        </div>

        {confirmPin.length === 4 && !pinsMatch && (
          <p className="text-red-500 text-xs mt-3">PINs do not match. Please re-enter.</p>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-foreground/8 shrink-0 space-y-3">
        <Button
          className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl"
          onClick={() => mutation.mutate()}
          disabled={!canSubmit}
        >
          {mutation.isPending
            ? 'Saving…'
            : mode === 'set'
            ? 'Set Transaction PIN'
            : 'Update Transaction PIN'}
        </Button>
        <div className="flex items-center justify-center gap-1.5 text-xs text-foreground/35">
          <RiShieldCheckLine />
          <span>Your PIN is encrypted and never stored in plain text</span>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl p-0 h-[88vh] flex flex-col overflow-hidden"
        >
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="p-0 max-w-sm rounded-2xl overflow-hidden gap-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="sr-only">
          <DialogTitle>
            {mode === 'set' ? 'Set Transaction PIN' : 'Update Transaction PIN'}
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
