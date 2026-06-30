import { useState } from 'react';
import { RiMoneyDollarCircleLine } from 'react-icons/ri';
import { useCommissionEntries } from '@/hooks/usePartner';
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

export default function Commissions() {
  const [page, setPage] = useState(1);
  const { entries, pagination, isLoading } = useCommissionEntries(page, 10);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Commissions</h1>
        <p className="text-white/50 text-sm mt-1">Track earnings from your referred investments.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : !entries.length ? (
        <EmptyState
          icon={<RiMoneyDollarCircleLine />}
          title="No commissions yet"
          description="Share your referral links to start earning commission."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-white font-medium">{entry.propertyTitle}</TableCell>
                    <TableCell>{formatPercent(entry.commissionRate)}</TableCell>
                    <TableCell className="text-green-400 font-semibold">
                      {formatCurrency(entry.commissionAmount)}
                    </TableCell>
                    <TableCell><StatusBadge status={entry.status} /></TableCell>
                    <TableCell>{formatDate(entry.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-white text-sm font-semibold flex-1 min-w-0 truncate">{entry.propertyTitle}</p>
                  <StatusBadge status={entry.status} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-white/50 text-xs">{formatDate(entry.createdAt)} · {formatPercent(entry.commissionRate)}</p>
                  <p className="text-green-400 text-sm font-bold">+{formatCurrency(entry.commissionAmount)}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-white/60 text-sm">{pagination.page} / {pagination.totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
