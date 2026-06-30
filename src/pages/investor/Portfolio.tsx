// import { useState } from 'react';
// import { Link } from 'react-router-dom';
// import { RiBriefcaseLine, RiArrowRightLine } from 'react-icons/ri';
// import { usePortfolioPerformance, useInvestmentList } from '@/hooks/useInvestment';
// import { formatCurrency, formatDate } from '@/lib/utils';
// import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
// import { StatusBadge } from '@/components/shared/StatusBadge';
// import { EmptyState } from '@/components/shared/EmptyState';
// import { Skeleton } from '@/components/ui/skeleton';
// import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
// import { Button } from '@/components/ui/button';
// import type { InvestmentStatus } from '@/types';

// const STATUS_TABS: { value: string; label: string }[] = [
//   { value: 'all', label: 'All' },
//   { value: 'active', label: 'Active' },
//   { value: 'completed', label: 'Completed' },
//   { value: 'exited', label: 'Exited' },
//   { value: 'resales', label: 'Resales' },
// ];

// export default function Portfolio() {
//   const [page, setPage] = useState(1);
//   const [tab, setTab] = useState('all');

//   const { performance: performanceData, isLoading: perfLoading } = usePortfolioPerformance('1y');
//   const { investments: allInvestments, pagination, isLoading } = useInvestmentList(page, 10);

//   const filtered =
//     tab === 'all'
//       ? allInvestments
//       : allInvestments.filter((inv) => inv.status === (tab as InvestmentStatus));

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-2xl font-bold text-white">Portfolio</h1>
//         <p className="text-white/50 text-sm mt-1">Track your investments and earnings.</p>
//       </div>

//       {/* Summary */}
//       <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
//         {perfLoading ? (
//           [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
//         ) : (
//           <>
//             <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
//               <p className="text-white/50 text-xs mb-1">Total Invested</p>
//               <CurrencyDisplay amount={performanceData?.totalInvested ?? 0} size="lg" className="text-white" />
//             </div>
//             <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
//               <p className="text-white/50 text-xs mb-1">Total Returns</p>
//               <CurrencyDisplay amount={performanceData?.totalReturns ?? 0} size="lg" className="text-green-400" />
//             </div>
//             <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
//               <p className="text-white/50 text-xs mb-1">Net Worth</p>
//               <CurrencyDisplay amount={performanceData?.netWorth ?? 0} size="lg" className="text-white" />
//             </div>
//             <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
//               <p className="text-white/50 text-xs mb-1">Active</p>
//               <p className="text-2xl font-bold text-white">{performanceData?.activeCount ?? 0}</p>
//             </div>
//           </>
//         )}
//       </div>

//       {/* Investments list */}
//       <Tabs value={tab} onValueChange={setTab}>
//         <TabsList>
//           {STATUS_TABS.map((t) => (
//             <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
//           ))}
//         </TabsList>

//         <TabsContent value={tab}>
//           {isLoading ? (
//             <div className="space-y-3 mt-4">
//               {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
//             </div>
//           ) : !filtered.length ? (
//             <EmptyState
//               icon={<RiBriefcaseLine />}
//               title="No investments yet"
//               description="Start investing in real estate to see your portfolio here."
//               action={
//                 <Link to="/investor/marketplace">
//                   <Button variant="outline" size="sm">Browse Marketplace</Button>
//                 </Link>
//               }
//             />
//           ) : (
//             <div className="space-y-3 mt-4">
//               {filtered.map((inv) => (
//                 <Link
//                   key={inv.id}
//                   to={`/investor/portfolio/${inv.id}`}
//                   className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all"
//                 >
//                   <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
//                     <RiBriefcaseLine className="text-accent h-6 w-6" />
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <p className="text-white font-semibold text-sm truncate">
//                       {inv.property?.title ?? 'Property'}
//                     </p>
//                     <p className="text-white/50 text-xs mt-0.5">
//                       {inv.quantity} unit{inv.quantity !== 1 ? 's' : ''} · {formatDate(inv.createdAt)}
//                     </p>
//                     <StatusBadge status={inv.status} />
//                   </div>
//                   <div className="text-right shrink-0">
//                     <p className="text-white text-sm font-bold">{formatCurrency(inv.totalAmount)}</p>
//                     <p className="text-white/40 text-xs mt-0.5">{formatCurrency(inv.pricePerUnit)}/unit</p>
//                     <RiArrowRightLine className="h-4 w-4 text-white/30 mt-1 ml-auto" />
//                   </div>
//                 </Link>
//               ))}
//             </div>
//           )}
//         </TabsContent>
//       </Tabs>

//       {/* Pagination */}
//       {pagination && pagination.totalPages > 1 && (
//         <div className="flex items-center justify-center gap-3">
//           <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
//             Previous
//           </Button>
//           <span className="text-white/60 text-sm">
//             {pagination.page} / {pagination.totalPages}
//           </span>
//           <Button
//             variant="outline"
//             size="sm"
//             disabled={page >= pagination.totalPages}
//             onClick={() => setPage((p) => p + 1)}
//           >
//             Next
//           </Button>
//         </div>
//       )}
//     </div>
//   );
// }



export default function Portfolio() {
  return (
    <div>Portfolio</div>
  )
}

