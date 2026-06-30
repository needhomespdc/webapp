import { Badge } from '@/components/ui/badge';
import type { InvestmentStatus, TransactionStatus, KYCStatus, ExitStatus, ResaleStatus } from '@/types';

type AnyStatus =
  | InvestmentStatus
  | TransactionStatus
  | KYCStatus
  | ExitStatus
  | ResaleStatus
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'pending'
  | 'approved'
  | 'paid';

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'error' | 'warning' | 'secondary' }> = {
  active: { label: 'Active', variant: 'success' },
  completed: { label: 'Completed', variant: 'success' },
  approved: { label: 'Approved', variant: 'success' },
  sold: { label: 'Sold', variant: 'success' },
  successful: { label: 'Successful', variant: 'success' },
  paid: { label: 'Paid', variant: 'success' },
  resolved: { label: 'Resolved', variant: 'success' },

  pending: { label: 'Pending', variant: 'warning' },
  in_progress: { label: 'In Progress', variant: 'warning' },
  pending_resale: { label: 'Pending Resale', variant: 'warning' },
  processing: { label: 'Processing', variant: 'warning' },
  not_started: { label: 'Not Started', variant: 'warning' },

  rejected: { label: 'Rejected', variant: 'error' },
  failed: { label: 'Failed', variant: 'error' },
  cancelled: { label: 'Cancelled', variant: 'error' },

  exited: { label: 'Exited', variant: 'secondary' },
  closed: { label: 'Closed', variant: 'secondary' },
  open: { label: 'Open', variant: 'default' },
  draft: { label: 'Draft', variant: 'secondary' },
  published: { label: 'Published', variant: 'success' },
  sold_out: { label: 'Sold Out', variant: 'secondary' },
};

interface StatusBadgeProps {
  status: AnyStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, variant: 'secondary' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
