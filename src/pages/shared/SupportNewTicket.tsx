import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RiArrowLeftLine, RiSendPlaneFill } from 'react-icons/ri';
import { Input } from '@/components/ui/input';
import { useCreateSupportTicket } from '@/hooks/useSupport';
import { toast } from '@/hooks/useToast';
import { ApiError } from '@/lib/fetchClient';

function SupportAvatar() {
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
      style={{ backgroundColor: '#362319' }}
    >
      <img
        src="/public/logo/logo-hero-white.png"
        alt="NH"
        className="w-6 h-6 object-contain"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
      />
    </div>
  );
}

export default function SupportNewTicket() {
  const [input, setInput] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const roleBase = location.pathname.startsWith('/partner') ? '/partner' : '/investor';
  const createMutation = useCreateSupportTicket();

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || createMutation.isPending) return;
    createMutation.mutate(
      { subject: 'NeedHomes Support Chat', message: trimmed },
      {
        onSuccess: (res) => {
          navigate(`${roleBase}/support/tickets/${res.data.id}`, { replace: true });
        },
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : 'Failed to start conversation'),
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
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
      </div>

      {/* Empty area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-6 overflow-y-auto min-h-0">
        <p className="text-foreground font-semibold text-sm">Hi there! Welcome to NeedHomes Support.</p>
        <p className="text-foreground/40 text-xs">
          Type your message below to start a conversation with our team.
        </p>
      </div>

      {/* Input bar */}
      <div className="px-3 py-3 border-t border-foreground/10 bg-background shrink-0">
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message…"
            disabled={createMutation.isPending}
            className="flex-1 rounded-full bg-foreground/8 border-foreground/10 px-5 h-10"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || createMutation.isPending}
            className="w-11 h-11 rounded-full bg-accent flex items-center justify-center text-white shrink-0 transition-opacity disabled:opacity-40 hover:bg-accent/90"
          >
            <RiSendPlaneFill className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
