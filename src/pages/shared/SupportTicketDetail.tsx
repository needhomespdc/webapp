import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  RiArrowLeftLine,
  RiSendPlaneFill,
  RiCloseLine,
  RiImageLine,
} from 'react-icons/ri';
import { useSupportTicket, useCloseTicket } from '@/hooks/useSupport';
import { useSupportChat } from '@/hooks/useSupportChat';
import { formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import type { SupportMessage } from '@/api/support.api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return formatDate(dateStr, { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── NeedHomes avatar ─────────────────────────────────────────────────────────

function SupportAvatar({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-7' : 'w-10 h-10';
  const iconDim = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  return (
    <div
      className={cn('rounded-full flex items-center justify-center shrink-0 overflow-hidden', dim)}
      style={{ backgroundColor: '#362319' }}
    >
      <img
        src="/public/logo/logo-hero-white.png"
        alt="NH"
        className={`${iconDim} object-contain`}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SupportTicketDetail() {
  const { ticketId = '' } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const roleBase = location.pathname.startsWith('/partner') ? '/partner' : '/investor';

  const [input, setInput] = useState('');
  const [closeOpen, setCloseOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { ticket } = useSupportTicket(ticketId);
  const { messages, isLoadingMessages, send, isSending } = useSupportChat(ticketId || null);
  const closeTicketMutation = useCloseTicket(ticketId);

  const isTicketOpen = ticket?.status === 'open' || ticket?.status === 'in_progress';
  const isTicketClosed = ticket?.status === 'closed' || ticket?.status === 'resolved';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;
    send(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCloseTicket = () => {
    closeTicketMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('Conversation closed');
        setCloseOpen(false);
        navigate(`${roleBase}/support/tickets`);
      },
      onError: () => toast.error('Failed to close conversation'),
    });
  };

  // Group messages by date
  const groupedMessages: { dateKey: string; dateLabel: string; msgs: SupportMessage[] }[] = [];
  for (const msg of messages) {
    const key = new Date(msg.createdAt).toDateString();
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.dateKey === key) {
      last.msgs.push(msg);
    } else {
      groupedMessages.push({ dateKey: key, dateLabel: getDateLabel(msg.createdAt), msgs: [msg] });
    }
  }

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-6rem)] bg-background md:border md:border-foreground/10 md:rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-3 py-3 border-b border-foreground/10 bg-background shrink-0">
          <button
            onClick={() => navigate(`${roleBase}/support/tickets`)}
            className="text-foreground/50 hover:text-foreground transition-colors shrink-0"
          >
            <RiArrowLeftLine className="h-5 w-5" />
          </button>
          <SupportAvatar />
          <div className="flex-1 min-w-0">
            <img
              src="/assets/logo/needhomes-logo.svg"
              alt="NeedHomes"
              className="h-4 w-auto max-w-30"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            <p className="text-foreground/40 text-xs mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              Online · Typically replies in minutes
            </p>
          </div>
          {isTicketOpen && (
            <button
              onClick={() => setCloseOpen(true)}
              title="Close conversation"
              className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors self-end"
            >
              <RiCloseLine className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
          {isLoadingMessages ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className={cn('flex gap-2', i % 2 === 0 ? 'justify-end' : 'justify-start')}>
                  {i % 2 !== 0 && <Skeleton className="w-7 h-7 rounded-full shrink-0 mt-auto" />}
                  <Skeleton className={cn('h-12 rounded-2xl', i % 2 === 0 ? 'w-40' : 'w-52')} />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-6">
              <p className="text-foreground font-semibold text-sm">Hi there! Welcome to NeedHomes Support.</p>
              <p className="text-foreground/40 text-xs">
                How can we help you today? Send us a message to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {groupedMessages.map(({ dateKey, dateLabel, msgs }) => (
                <div key={dateKey}>
                  <div className="flex items-center justify-center py-3">
                    <span className="text-xs text-foreground/40 bg-foreground/8 px-3 py-1 rounded-full">
                      {dateLabel}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {msgs.map((msg, idx) => {
                      const isUser = msg.sender === 'user';
                      const isLastInRun = idx === msgs.length - 1 || msgs[idx + 1]?.sender !== msg.sender;
                      const isFirstInRun = idx === 0 || msgs[idx - 1]?.sender !== msg.sender;
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            'flex items-end gap-2',
                            isUser ? 'justify-end' : 'justify-start',
                            isFirstInRun ? 'mt-3' : 'mt-0.5'
                          )}
                        >
                          {!isUser && (
                            <div className="w-7 shrink-0 mb-0.5">
                              {isLastInRun ? <SupportAvatar size="sm" /> : <div className="w-7" />}
                            </div>
                          )}
                          <div className={cn(
                            'max-w-[75%] px-4 py-2.5',
                            isUser
                              ? 'bg-accent text-white rounded-t-2xl rounded-bl-2xl rounded-br-sm'
                              : 'bg-foreground/10 text-foreground rounded-t-2xl rounded-br-2xl rounded-bl-sm'
                          )}>
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                            <p className={cn('text-[10px] mt-1', isUser ? 'text-white/60 text-right' : 'text-foreground/40')}>
                              {new Date(msg.createdAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="px-3 py-3 border-t border-foreground/10 bg-background shrink-0">
          {isTicketClosed ? (
            <p className="text-center text-xs text-foreground/40 py-1">This conversation has been closed.</p>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toast.error('Attachment coming soon')}
                className="w-10 h-10 rounded-full bg-foreground/8 flex items-center justify-center text-foreground/50 hover:bg-foreground/15 hover:text-foreground/80 transition-colors shrink-0"
              >
                <RiImageLine className="h-5 w-5" />
              </button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message…"
                disabled={isSending}
                className="flex-1 rounded-full bg-foreground/8 border-foreground/10 px-5 h-10"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || isSending}
                className="w-11 h-11 rounded-full bg-accent flex items-center justify-center text-white shrink-0 transition-opacity disabled:opacity-40 hover:bg-accent/90"
              >
                <RiSendPlaneFill className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Close Ticket Confirmation */}
      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End this conversation?</DialogTitle>
            <DialogDescription>
              This will close the support ticket. You can start a new conversation anytime if you need further help.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setCloseOpen(false)}
              className="flex-1"
              disabled={closeTicketMutation.isPending}
            >
              Keep Chatting
            </Button>
            <Button
              onClick={handleCloseTicket}
              disabled={closeTicketMutation.isPending}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white border-0"
            >
              {closeTicketMutation.isPending ? 'Closing…' : 'End Chat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
