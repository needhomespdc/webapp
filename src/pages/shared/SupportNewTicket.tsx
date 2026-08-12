import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RiArrowLeftLine, RiSendPlaneFill } from 'react-icons/ri';
import { Input } from '@/components/ui/input';
import { useCreateSupportTicket } from '@/hooks/useSupport';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/useToast';
import { ApiError } from '@/lib/fetchClient';

function SupportAvatar({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-7' : 'w-10 h-10';
  const iconDim = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center shrink-0 overflow-hidden`}
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

export default function SupportNewTicket() {
  const [input, setInput] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const roleBase = location.pathname.startsWith('/partner') ? '/partner' : '/investor';
  const createMutation = useCreateSupportTicket();
  const { user } = useAuth();
  const firstName = user?.firstName ?? 'there';

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || createMutation.isPending) return;
    createMutation.mutate(
      { subject: 'NeedHomes Support Chat', message: trimmed },
      {
        onSuccess: (res) => {
          navigate(`${roleBase}/support/tickets/${res.id}`, { replace: true });
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
          <p className="text-foreground text-sm font-semibold leading-tight">NeedHomes Support</p>
          <p className="text-foreground/40 text-xs mt-0.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
            Online · Typically replies in minutes
          </p>
        </div>
      </div>

      {/* Welcome messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        <div className="space-y-0.5 mt-2">
          {[
            `Hi ${firstName}! Welcome to NeedHomes Support. How can we help you today?`,
            'Our team can assist with investments, wallet, KYC, and account questions.',
          ].map((text, i) => (
            <div key={i} className={`flex items-end gap-2 ${i === 0 ? '' : 'mt-0.5'}`}>
              <div className="w-7 shrink-0 mb-0.5">
                {i === 1 ? <SupportAvatar size="sm" /> : <div className="w-7" />}
              </div>
              <div className="max-w-[75%] px-4 py-2.5 bg-foreground/10 text-foreground rounded-t-2xl rounded-br-2xl rounded-bl-sm">
                <p className="text-sm leading-relaxed">{text}</p>
              </div>
            </div>
          ))}
        </div>
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
