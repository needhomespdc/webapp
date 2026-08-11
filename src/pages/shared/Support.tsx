import { useState, useRef, useEffect } from 'react';
import {
  RiCustomerService2Line,
  RiQuestionnaireLine,
  RiBookOpenLine,
  RiPhoneLine,
  RiMailLine,
  RiArrowRightLine,
  RiArrowLeftLine,
  RiSendPlaneFill,
  RiImageLine,
} from 'react-icons/ri';
import { useChatAdmin } from '@/hooks/useChatAdmin';
import { formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
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

function toDateKey(dateStr: string) {
  return new Date(dateStr).toDateString();
}

// ─── NeedHomes avatar ─────────────────────────────────────────────────────────

function SupportAvatar({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-7' : 'w-10 h-10';
  const iconDim = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  return (
    <div
      className={cn(
        'rounded-full bg-accent flex items-center justify-center shrink-0 overflow-hidden',
        dim
      )}
    >
      <img
        src="/assets/logo/needhomes-icon.svg"
        alt="NH"
        className={iconDim}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
    </div>
  );
}

// ─── Chat view ────────────────────────────────────────────────────────────────

function ChatView({ onBack }: { onBack: () => void }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, send, isSending } = useChatAdmin();

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

  // Group messages by calendar date for separators
  const groupedMessages: { dateKey: string; dateLabel: string; msgs: SupportMessage[] }[] = [];
  for (const msg of messages) {
    const key = toDateKey(msg.createdAt);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.dateKey === key) {
      last.msgs.push(msg);
    } else {
      groupedMessages.push({
        dateKey: key,
        dateLabel: getDateLabel(msg.createdAt),
        msgs: [msg],
      });
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-background md:border md:border-foreground/10 md:rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-3 border-b border-foreground/10 bg-background shrink-0">
        <button
          onClick={onBack}
          className="text-foreground/50 hover:text-foreground transition-colors shrink-0"
        >
          <RiArrowLeftLine className="h-5 w-5" />
        </button>
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 overflow-hidden">
          <img
            src="/public/logo/needhomes-logo.png"
            alt="NeedHomes"
            className="w-8 h-auto object-contain"
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-foreground text-sm font-semibold leading-tight">NeedHomes Support</p>
          <p className="text-foreground/40 text-xs mt-0.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
            Online · Typically replies in minutes
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn('flex gap-2', i % 2 === 0 ? 'justify-end' : 'justify-start')}
              >
                {i % 2 !== 0 && (
                  <Skeleton className="w-7 h-7 rounded-full shrink-0 mt-auto" />
                )}
                <Skeleton
                  className={cn('h-12 rounded-2xl', i % 2 === 0 ? 'w-40' : 'w-52')}
                />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
            <div>
              <p className="text-foreground font-semibold text-sm">
                Hi there! Welcome to NeedHomes Support.
              </p>
              <p className="text-foreground/40 text-xs mt-1">
                How can we help you today? Send us a message to get started.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {groupedMessages.map(({ dateKey, dateLabel, msgs }) => (
              <div key={dateKey}>
                {/* Date separator */}
                <div className="flex items-center justify-center py-3">
                  <span className="text-xs text-foreground/40 bg-foreground/8 px-3 py-1 rounded-full">
                    {dateLabel}
                  </span>
                </div>

                {/* Messages in this date group */}
                <div className="space-y-0.5">
                  {msgs.map((msg, idx) => {
                    const isUser = msg.sender === 'user';
                    const isLastInRun =
                      idx === msgs.length - 1 || msgs[idx + 1]?.sender !== msg.sender;
                    const isFirstInRun =
                      idx === 0 || msgs[idx - 1]?.sender !== msg.sender;

                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          'flex items-end gap-2',
                          isUser ? 'justify-end' : 'justify-start',
                          isFirstInRun ? 'mt-3' : 'mt-0.5'
                        )}
                      >
                        {/* Support avatar — only on last bubble in a run */}
                        {!isUser && (
                          <div className="w-7 shrink-0 mb-0.5">
                            {isLastInRun ? (
                              <SupportAvatar size="sm" />
                            ) : (
                              <div className="w-7" />
                            )}
                          </div>
                        )}

                        <div
                          className={cn(
                            'max-w-[75%] px-4 py-2.5',
                            isUser
                              ? 'bg-accent text-white rounded-t-2xl rounded-bl-2xl rounded-br-sm'
                              : 'bg-foreground/10 text-foreground rounded-t-2xl rounded-br-2xl rounded-bl-sm'
                          )}
                        >
                          <p className="text-sm leading-relaxed">{msg.message}</p>
                          <p
                            className={cn(
                              'text-[10px] mt-1',
                              isUser ? 'text-white/60 text-right' : 'text-foreground/40'
                            )}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString('en-NG', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
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
      </div>
    </div>
  );
}

// ─── Help Center hub ──────────────────────────────────────────────────────────

interface HelpOption {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  comingSoon?: boolean;
  href?: string;
  action?: 'chat';
}

const HELP_OPTIONS: HelpOption[] = [
  {
    key: 'faq',
    title: 'FAQ',
    description: 'Browse answers to common questions',
    icon: <RiQuestionnaireLine className="h-6 w-6" />,
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
    comingSoon: true,
  },
  {
    key: 'kb',
    title: 'Knowledge Base',
    description: 'Articles and guides — coming soon',
    icon: <RiBookOpenLine className="h-6 w-6" />,
    iconBg: 'bg-purple-500/15',
    iconColor: 'text-purple-400',
    comingSoon: true,
  },
  {
    key: 'chat',
    title: 'Chat Admin',
    description: 'Chat with our support team in real time',
    icon: <RiCustomerService2Line className="h-6 w-6" />,
    iconBg: 'bg-accent/15',
    iconColor: 'text-accent',
    action: 'chat',
  },
  {
    key: 'call',
    title: 'Call Us',
    description: '+234 901 846 4742',
    icon: <RiPhoneLine className="h-6 w-6" />,
    iconBg: 'bg-green-500/15',
    iconColor: 'text-green-400',
    href: 'tel:+2349018464742',
  },
  {
    key: 'email',
    title: 'Send us an Email',
    description: 'Support@Needhomespdc.com',
    icon: <RiMailLine className="h-6 w-6" />,
    iconBg: 'bg-violet-500/15',
    iconColor: 'text-violet-400',
    href: 'mailto:Support@Needhomespdc.com',
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Support() {
  const [view, setView] = useState<'hub' | 'chat'>('hub');

  if (view === 'chat') {
    return <ChatView onBack={() => setView('hub')} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Help Center</h1>
        <p className="text-foreground/50 text-sm mt-1">
          Find answers, browse guides, or reach our support team through chat, phone, or email.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
        {HELP_OPTIONS.map((opt) => {
          const isDisabled = opt.comingSoon;

          const inner = (
            <div
              className={cn(
                'group flex flex-col gap-3 p-4 rounded-2xl border transition-all',
                isDisabled
                  ? 'bg-foreground/3 border-foreground/8 opacity-60 cursor-not-allowed'
                  : 'bg-foreground/5 border-foreground/10 hover:border-accent/40 hover:bg-foreground/8 cursor-pointer'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className={cn(
                    'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
                    opt.iconBg,
                    opt.iconColor
                  )}
                >
                  {opt.icon}
                </div>
                {!isDisabled && (
                  <span className="w-7 h-7 rounded-full border border-foreground/10 flex items-center justify-center text-foreground/40 group-hover:bg-accent group-hover:border-accent group-hover:text-white transition-all shrink-0">
                    <RiArrowRightLine className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-foreground text-sm font-semibold">{opt.title}</p>
                  {opt.comingSoon && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-foreground/10 text-foreground/40">
                      Soon
                    </span>
                  )}
                </div>
                <p className="text-foreground/50 text-xs mt-0.5 leading-relaxed">{opt.description}</p>
              </div>
            </div>
          );

          if (opt.action === 'chat') {
            return (
              <button key={opt.key} className="w-full text-left" onClick={() => setView('chat')}>
                {inner}
              </button>
            );
          }

          if (opt.href) {
            return (
              <a key={opt.key} href={opt.href} target="_blank" rel="noopener noreferrer">
                {inner}
              </a>
            );
          }

          return <div key={opt.key}>{inner}</div>;
        })}
      </div>
    </div>
  );
}
