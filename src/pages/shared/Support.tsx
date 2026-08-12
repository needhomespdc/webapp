import { useNavigate, useLocation } from 'react-router-dom';
import {
  RiCustomerService2Line,
  RiQuestionnaireLine,
  RiBookOpenLine,
  RiPhoneLine,
  RiMailLine,
  RiArrowRightLine,
} from 'react-icons/ri';
import { cn } from '@/lib/utils';

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
  {
    key: 'faq',
    title: 'FAQ',
    description: 'Browse answers to common questions',
    icon: <RiQuestionnaireLine className="h-6 w-6" />,
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
    // TODO: replace '#' with the real FAQ URL when available
    href: '#',
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
];

export default function Support() {
  const navigate = useNavigate();
  const location = useLocation();
  const roleBase = location.pathname.startsWith('/partner') ? '/partner' : '/investor';

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
                <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', opt.iconBg, opt.iconColor)}>
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
              <button key={opt.key} className="w-full text-left" onClick={() => navigate(`${roleBase}/support/tickets`)}>
                {inner}
              </button>
            );
          }
          if (opt.href) {
            return (
              <a
                key={opt.key}
                href={opt.href}
                target={opt.href.startsWith('http') || opt.href.startsWith('tel:') || opt.href.startsWith('mailto:') ? '_blank' : undefined}
                rel="noopener noreferrer"
              >
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
