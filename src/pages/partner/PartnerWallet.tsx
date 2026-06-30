// import { useState } from 'react';
// import { RiBankLine } from 'react-icons/ri';
// import { useCommissionWallet, useRequestCommissionPayout } from '@/hooks/usePartner';
// import { useBankAccounts } from '@/hooks/useWallet';
// import { formatCurrency } from '@/lib/utils';
// import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
// import { EmptyState } from '@/components/shared/EmptyState';
// import { Card, CardContent } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from '@/components/ui/dialog';
// import { toast } from '@/hooks/useToast';
// import { ApiError } from '@/lib/fetchClient';

// export default function PartnerWallet() {
//   const { wallet, isLoading } = useCommissionWallet();
//   const { bankAccounts, isLoading: banksLoading } = useBankAccounts();
//   const payoutMutation = useRequestCommissionPayout();

//   const [payoutOpen, setPayoutOpen] = useState(false);
//   const [amount, setAmount] = useState('');
//   const [bankAccountId, setBankAccountId] = useState('');
//   const [pin, setPin] = useState('');

//   const primaryBank = bankAccounts.find((b) => b.isPrimary) ?? bankAccounts[0];

//   const handlePayout = () => {
//     const numAmount = parseFloat(amount);
//     if (!numAmount || numAmount <= 0) {
//       toast.error('Enter a valid amount');
//       return;
//     }
//     if (!bankAccountId) {
//       toast.error('Select a bank account');
//       return;
//     }
//     payoutMutation.mutate(
//       { amount: numAmount, bankAccountId, transactionPin: pin },
//       {
//         onSuccess: () => {
//           toast.success('Payout request submitted');
//           setPayoutOpen(false);
//           setAmount('');
//           setPin('');
//         },
//         onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Payout request failed'),
//       }
//     );
//   };

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-2xl font-bold text-white">Commission Wallet</h1>
//         <p className="text-white/50 text-sm mt-1">Withdraw your referral earnings to your bank account.</p>
//       </div>

//       <Card>
//         <CardContent className="p-6">
//           <p className="text-white/50 text-xs mb-1">Available Balance</p>
//           <CurrencyDisplay amount={wallet?.balance ?? 0} size="xl" className="text-white" />
//           <p className="text-white/40 text-xs mt-2">
//             Total earned: {formatCurrency(wallet?.totalEarned ?? 0)}
//           </p>
//           <Button
//             className="w-full mt-4"
//             onClick={() => setPayoutOpen(true)}
//             disabled={isLoading || !wallet?.balance}
//           >
//             Request Payout
//           </Button>
//         </CardContent>
//       </Card>

//       <div>
//         <h2 className="text-white font-semibold text-sm mb-3">Linked Bank Accounts</h2>
//         {banksLoading ? null : !bankAccounts.length ? (
//           <EmptyState
//             icon={<RiBankLine />}
//             title="No bank account linked"
//             description="Link a bank account from your profile to receive payouts."
//           />
//         ) : (
//           <div className="space-y-2">
//             {bankAccounts.map((b) => (
//               <div key={b.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
//                 <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
//                   <RiBankLine className="h-4 w-4" />
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-white text-sm font-medium">{b.shortName} — {b.accountNumber}</p>
//                   <p className="text-white/40 text-xs">{b.accountHolderName}</p>
//                 </div>
//                 {b.isPrimary && <span className="text-xs text-accent font-medium">Primary</span>}
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Request Payout</DialogTitle>
//             <DialogDescription>Withdraw commission earnings to your linked bank account.</DialogDescription>
//           </DialogHeader>
//           <div className="space-y-4">
//             <div className="space-y-2">
//               <Label>Amount</Label>
//               <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
//             </div>
//             <div className="space-y-2">
//               <Label>Bank Account</Label>
//               <select
//                 className="flex h-14 w-full rounded-xl bg-white/10 border border-white/10 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent"
//                 value={bankAccountId || primaryBank?.id || ''}
//                 onChange={(e) => setBankAccountId(e.target.value)}
//               >
//                 <option value="" disabled>Select bank account</option>
//                 {bankAccounts.map((b) => (
//                   <option key={b.id} value={b.id} className="bg-[#111]">
//                     {b.shortName} — {b.accountNumber}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <div className="space-y-2">
//               <Label>Transaction PIN</Label>
//               <Input
//                 type="password"
//                 maxLength={4}
//                 placeholder="Enter 4-digit PIN"
//                 value={pin}
//                 onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
//               />
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setPayoutOpen(false)}>Cancel</Button>
//             <Button onClick={handlePayout} disabled={payoutMutation.isPending || pin.length < 4}>
//               {payoutMutation.isPending ? 'Submitting...' : 'Request Payout'}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }



export default function PartnerWallet() {
  return (
    <div>PartnerWallet</div>
  )
}

