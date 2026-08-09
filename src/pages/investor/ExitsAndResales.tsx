import { useNavigate } from 'react-router-dom';
import {
  RiLineChartLine,
  RiRepeat2Line,
  RiArrowRightLine,
} from 'react-icons/ri';
import { cn } from '@/lib/utils';

export default function ExitsAndResales() {
  const navigate = useNavigate();

  const cards = [
    {
      key: 'exits',
      icon: <RiLineChartLine className="h-6 w-6" />,
      iconBg: 'bg-green-500/15',
      iconColor: 'text-green-400',
      title: 'Exits',
      desc: 'Request to exit your active investments and receive your returns.',
      steps: 'Review • Request • Receive',
      stepsColor: 'text-green-400',
      onClick: () => navigate('/investor/exits'),
    },
    {
      key: 'resales',
      icon: <RiRepeat2Line className="h-6 w-6" />,
      iconBg: 'bg-accent/15',
      iconColor: 'text-accent',
      title: 'Resales',
      desc: 'List your property holdings for resale and track buyer interest.',
      steps: 'List • Manage • Sell',
      stepsColor: 'text-accent',
      onClick: () => navigate('/investor/resales'),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Exit & Resale</h1>
        <p className="text-foreground/50 text-sm mt-1">
          Manage how you leave investments or list your holdings for resale on the NeedHomes marketplace.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {cards.map((card) => (
          <button
            key={card.key}
            onClick={card.onClick}
            className="group relative rounded-2xl bg-foreground/5 border border-foreground/10 hover:border-foreground/20 p-5 transition-all flex flex-col text-left"
          >
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', card.iconBg, card.iconColor)}>
              {card.icon}
            </div>

            <h3 className="text-foreground font-semibold mt-4 text-sm">{card.title}</h3>
            <p className="text-foreground/50 text-xs mt-1.5 leading-relaxed flex-1">{card.desc}</p>

            <div className="border-t border-foreground/10 mt-4 pt-3 flex items-center justify-between gap-2">
              <span className={cn('text-xs font-medium', card.stepsColor)}>{card.steps}</span>
              <span className="shrink-0 w-7 h-7 rounded-full border border-foreground/10 flex items-center justify-center text-foreground/40 group-hover:bg-accent group-hover:border-accent group-hover:text-white transition-all">
                <RiArrowRightLine className="h-3.5 w-3.5" />
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
