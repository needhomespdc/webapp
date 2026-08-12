import { useNavigate, useLocation } from 'react-router-dom';
import {
  RiCustomerService2Line,
  RiAddLine,
  RiArrowLeftLine,
  RiChat1Line,
} from 'react-icons/ri';
import { useSupportTickets } from '@/hooks/useSupport';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { SupportTicket } from '@/api/support.api';

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr, { day: 'numeric', month: 'short' });
}

function TicketCard({ ticket, onClick }: { ticket: SupportTicket; onClick: () => void }) {
  const isOpen = ticket.status === 'open' || ticket.status === 'in_progress';
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-foreground/5 border border-foreground/10 rounded-2xl p-4 hover:border-foreground/20 transition-colors active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', isOpen ? 'bg-accent/15' : 'bg-foreground/8')}>
          <RiChat1Line className={cn('h-5 w-5', isOpen ? 'text-accent' : 'text-foreground/40')} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-foreground font-semibold text-sm truncate">{ticket.subject}</p>
            <div className="flex items-center gap-1.5 shrink-0">
              {ticket.unreadCount > 0 && (
                <span className="min-w-[18px] h-[18px] rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center px-1">
                  {ticket.unreadCount}
                </span>
              )}
              <span className="text-foreground/40 text-[11px]">{relativeTime(ticket.lastMessageAt)}</span>
            </div>
          </div>
          {ticket.lastMessagePreview && (
            <p className="text-foreground/50 text-xs mt-0.5 line-clamp-1 leading-relaxed">{ticket.lastMessagePreview}</p>
          )}
          <div className="flex items-center justify-between mt-2">
            <StatusBadge status={ticket.status} />
            <p className="text-foreground/30 text-[11px]">{ticket.reference}</p>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function SupportTickets() {
  const navigate = useNavigate();
  const location = useLocation();
  const roleBase = location.pathname.startsWith('/partner') ? '/partner' : '/investor';
  const { tickets, isLoading } = useSupportTickets();

  const sorted = [...tickets].sort(
    (a, b) =>
      new Date(b.lastMessageAt ?? b.id).getTime() - new Date(a.lastMessageAt ?? a.id).getTime()
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`${roleBase}/support`)}
          className="w-9 h-9 rounded-full bg-foreground/8 flex items-center justify-center text-foreground/60 hover:bg-foreground/15 transition-colors shrink-0"
        >
          <RiArrowLeftLine className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground">Support Chat</h1>
          <p className="text-foreground/50 text-xs mt-0.5">Chat with our support team.</p>
        </div>
        <button
          onClick={() => navigate(`${roleBase}/support/tickets/new`)}
          className="flex items-center gap-1.5 bg-accent hover:bg-accent/90 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors shrink-0"
        >
          <RiAddLine className="h-3.5 w-3.5" />
          New Chat
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
      ) : !sorted.length ? (
        <EmptyState
          icon={<RiCustomerService2Line />}
          title="No conversations yet"
          description="Start a new chat and our team will respond shortly."
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => navigate(`${roleBase}/support/tickets/${ticket.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
