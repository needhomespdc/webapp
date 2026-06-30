import { useState } from 'react';
import { RiCustomerService2Line, RiAddLine, RiSendPlaneFill } from 'react-icons/ri';
import {
  useSupportTickets,
  useSupportTicket,
  useCreateSupportTicket,
  useReplyToTicket,
  useCloseTicket,
} from '@/hooks/useSupport';
import { formatDate } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/useToast';
import { ApiError } from '@/lib/fetchClient';
import { cn } from '@/lib/utils';

export default function Support() {
  const { tickets, isLoading } = useSupportTickets();
  const [newOpen, setNewOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

  const createMutation = useCreateSupportTicket();

  const handleCreate = () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in both subject and message');
      return;
    }
    createMutation.mutate(
      { subject, message },
      {
        onSuccess: () => {
          toast.success('Support ticket created');
          setNewOpen(false);
          setSubject('');
          setMessage('');
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : 'Failed to create ticket');
        },
      }
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Support</h1>
          <p className="text-white/50 text-sm mt-1">Get help with your account or investments.</p>
        </div>
        <Button size="sm" onClick={() => setNewOpen(true)}>
          <RiAddLine className="h-4 w-4" />
          New Ticket
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
        </div>
      ) : !tickets.length ? (
        <EmptyState
          icon={<RiCustomerService2Line />}
          title="No support tickets"
          description="Need help? Create a ticket and our team will respond shortly."
          action={<Button size="sm" onClick={() => setNewOpen(true)}>Create Ticket</Button>}
        />
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTicketId(t.id)}
              className="w-full text-left flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <RiCustomerService2Line className="text-accent h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{t.subject}</p>
                <p className="text-white/40 text-xs mt-0.5">{formatDate(t.createdAt)}</p>
              </div>
              <StatusBadge status={t.status} />
            </button>
          ))}
        </div>
      )}

      {/* New ticket dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Support Ticket</DialogTitle>
            <DialogDescription>Describe your issue and we'll get back to you.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Payment issue" />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <textarea
                className="flex w-full min-h-28 rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                placeholder="Describe your issue in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Submitting...' : 'Submit Ticket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket detail dialog */}
      <TicketDetailDialog ticketId={activeTicketId} onClose={() => setActiveTicketId(null)} />
    </div>
  );
}

function TicketDetailDialog({ ticketId, onClose }: { ticketId: string | null; onClose: () => void }) {
  const { ticket, isLoading } = useSupportTicket(ticketId ?? undefined);
  const [reply, setReply] = useState('');
  const replyMutation = useReplyToTicket(ticketId ?? '');
  const closeMutation = useCloseTicket(ticketId ?? '');

  const handleReply = () => {
    if (!reply.trim()) return;
    replyMutation.mutate(
      { message: reply },
      {
        onSuccess: () => setReply(''),
        onError: () => toast.error('Failed to send reply'),
      }
    );
  };

  return (
    <Dialog open={!!ticketId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        {isLoading || !ticket ? (
          <div className="py-8 text-center text-white/50 text-sm">Loading...</div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between gap-2">
                <DialogTitle>{ticket.subject}</DialogTitle>
                <StatusBadge status={ticket.status} />
              </div>
            </DialogHeader>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {ticket.messages.map((m) => (
                <div
                  key={m.id}
                  className={cn('max-w-[85%] rounded-2xl p-3', m.sender === 'user' ? 'bg-accent/15 ml-auto' : 'bg-white/10')}
                >
                  <p className="text-white text-sm">{m.message}</p>
                  <p className="text-white/40 text-xs mt-1">{formatDate(m.createdAt)}</p>
                </div>
              ))}
            </div>

            {ticket.status !== 'closed' && (
              <div className="flex gap-2 mt-4">
                <Input
                  placeholder="Type a reply..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                />
                <Button size="icon" onClick={handleReply} disabled={replyMutation.isPending}>
                  <RiSendPlaneFill className="h-4 w-4" />
                </Button>
              </div>
            )}

            <DialogFooter>
              {ticket.status !== 'closed' && (
                <Button variant="outline" onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending}>
                  Close Ticket
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
