// import { useParams, useNavigate, Link } from 'react-router-dom';
// import { RiArrowLeftLine, RiCheckLine, RiFileDownloadLine, RiAwardLine } from 'react-icons/ri';
// import { useInvestmentDetail } from '@/hooks/useInvestment';
// import { investmentsApi } from '@/api/investments.api';
// import { formatCurrency, formatDate } from '@/lib/utils';
// import { StatusBadge } from '@/components/shared/StatusBadge';
// import { Loader } from '@/components/shared/Loader';
// import { Button } from '@/components/ui/button';
// import { toast } from '@/hooks/useToast';

// export default function InvestmentDetail() {
//   const { investmentId } = useParams<{ investmentId: string }>();
//   const navigate = useNavigate();
//   const { investment, isLoading } = useInvestmentDetail(investmentId);

//   const downloadFile = async (fetcher: () => Promise<Blob>, filename: string) => {
//     try {
//       const blob = await fetcher();
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = filename;
//       a.click();
//       URL.revokeObjectURL(url);
//     } catch {
//       toast.error('Failed to download file');
//     }
//   };

//   if (isLoading) return <Loader fullPage />;
//   if (!investment) return null;

//   return (
//     <div className="space-y-6">
//       <button
//         onClick={() => navigate(-1)}
//         className="flex items-center gap-2 text-foreground/60 hover:text-foreground text-sm transition-colors"
//       >
//         <RiArrowLeftLine className="h-4 w-4" />
//         Back to Portfolio
//       </button>

//       <div className="flex items-start justify-between gap-3">
//         <div>
//           <h1 className="text-xl font-bold text-foreground">{investment.property?.title ?? 'Investment'}</h1>
//           <p className="text-foreground/50 text-sm mt-1">{investment.property?.location}</p>
//         </div>
//         <StatusBadge status={investment.status} />
//       </div>

//       {/* Summary */}
//       <div className="grid grid-cols-2 gap-3">
//         <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
//           <p className="text-foreground/50 text-xs mb-1">Total Invested</p>
//           <p className="text-foreground text-lg font-bold">{formatCurrency(investment.totalAmount)}</p>
//         </div>
//         <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
//           <p className="text-foreground/50 text-xs mb-1">Units Held</p>
//           <p className="text-foreground text-lg font-bold">{investment.quantity}</p>
//         </div>
//         <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
//           <p className="text-foreground/50 text-xs mb-1">Price per Unit</p>
//           <p className="text-foreground text-lg font-bold">{formatCurrency(investment.pricePerUnit)}</p>
//         </div>
//         <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
//           <p className="text-foreground/50 text-xs mb-1">Invested On</p>
//           <p className="text-foreground text-lg font-bold">{formatDate(investment.createdAt)}</p>
//         </div>
//       </div>

//       {/* Milestones */}
//       {investment.milestones && investment.milestones.length > 0 && (
//         <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
//           <h2 className="text-foreground font-semibold text-sm mb-3">Progress Timeline</h2>
//           <div className="space-y-3">
//             {investment.milestones.map((ms) => (
//               <div key={ms.milestoneId} className="flex items-start gap-3">
//                 <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
//                   ms.status === 'completed'
//                     ? 'bg-green-600/20 text-green-400'
//                     : ms.status === 'in_progress'
//                     ? 'bg-accent/20 text-accent'
//                     : 'bg-foreground/10 text-foreground/40'
//                 }`}>
//                   {ms.status === 'completed' ? <RiCheckLine className="h-3.5 w-3.5" /> : <span className="w-2 h-2 rounded-full bg-current" />}
//                 </div>
//                 <div>
//                   <p className="text-foreground text-sm font-medium">{ms.title}</p>
//                   {ms.completedAt && <p className="text-foreground/40 text-xs mt-0.5">{formatDate(ms.completedAt)}</p>}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Handover details */}
//       {investment.handoverDetails?.handoverDate && (
//         <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
//           <h2 className="text-foreground font-semibold text-sm mb-2">Handover Details</h2>
//           <p className="text-foreground/70 text-sm">Date: {formatDate(investment.handoverDetails.handoverDate)}</p>
//           {investment.handoverDetails.notes && (
//             <p className="text-foreground/50 text-sm mt-1">{investment.handoverDetails.notes}</p>
//           )}
//         </div>
//       )}

//       {/* Documents */}
//       <div className="grid grid-cols-2 gap-3">
//         <Button
//           variant="outline"
//           onClick={() => downloadFile(() => investmentsApi.getReceipt(investment.id), `receipt-${investment.id}.pdf`)}
//         >
//           <RiFileDownloadLine className="h-4 w-4" />
//           Receipt
//         </Button>
//         <Button
//           variant="outline"
//           onClick={() => downloadFile(() => investmentsApi.getCertificate(investment.id), `certificate-${investment.id}.pdf`)}
//         >
//           <RiAwardLine className="h-4 w-4" />
//           Certificate
//         </Button>
//       </div>

//       {/* Quick links */}
//       <div className="flex gap-3">
//         <Link to="/investor/exits" className="flex-1">
//           <Button variant="outline" className="w-full">Request Exit</Button>
//         </Link>
//         <Link to="/investor/resales" className="flex-1">
//           <Button variant="outline" className="w-full">List for Resale</Button>
//         </Link>
//       </div>
//     </div>
//   );
// }

export default function InvestmentDetail() {
  return (
    <div>InvestmentDetail</div>
  )
}
