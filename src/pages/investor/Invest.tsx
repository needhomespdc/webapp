import { Link } from 'react-router-dom';
import {
  RiBuilding2Line,
  RiPieChart2Line,
  RiToolsLine,
  RiMapPin2Line,
  RiSafe2Line,
  RiArrowRightLine,
  RiQuestionLine,
} from 'react-icons/ri';
import { cn } from '@/lib/utils';

interface InvestmentPath {
  type: string;
  title: string;
  description: string;
  tags: string[];
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  tagColor: string;
  popular?: boolean;
}

const PATHS: InvestmentPath[] = [
  {
    type: 'outright',
    title: 'Outright Purchase',
    description: 'Buy complete properties outright and enjoy full ownership benefits.',
    tags: ['Full Ownership', 'Full Control'],
    icon: <RiBuilding2Line className="h-6 w-6" />,
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
    tagColor: 'text-amber-400',
  },
  {
    type: 'fractional',
    title: 'Fractional Ownership',
    description: 'Own a fraction of premium properties and earn proportional returns.',
    tags: ['Low Entry', 'High Potential'],
    icon: <RiPieChart2Line className="h-6 w-6" />,
    iconBg: 'bg-purple-500/15',
    iconColor: 'text-purple-400',
    tagColor: 'text-purple-400',
    popular: true,
  },
  {
    type: 'co_development',
    title: 'Co-Development',
    description: 'Partner with us to develop properties and share in the returns.',
    tags: ['Partner', 'Build', 'Earn'],
    icon: <RiToolsLine className="h-6 w-6" />,
    iconBg: 'bg-green-500/15',
    iconColor: 'text-green-400',
    tagColor: 'text-green-400',
  },
  {
    type: 'land_banking',
    title: 'Land Banking',
    description: 'Secure land in prime locations and watch your investment grow over time.',
    tags: ['Secure', 'Appreciate', 'Profit'],
    icon: <RiMapPin2Line className="h-6 w-6" />,
    iconBg: 'bg-accent/15',
    iconColor: 'text-accent',
    tagColor: 'text-accent',
  },
  {
    type: 'save_to_own',
    title: 'Save-to-Own',
    description: 'Save consistently and get closer to owning your dream property.',
    tags: ['Save', 'Plan', 'Own'],
    icon: <RiSafe2Line className="h-6 w-6" />,
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
    tagColor: 'text-blue-400',
  },
];

export default function Invest() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Choose Your Investment Path</h1>
        <p className="text-foreground/50 text-sm mt-1 max-w-xl">
          Select an investment model that aligns with your goals and start building wealth
          through real estate.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PATHS.map((path) => (
          <Link
            key={path.type}
            to={`/investor/marketplace?type=${path.type}`}
            className="group relative rounded-2xl bg-foreground/5 border border-foreground/10 hover:border-accent/40 p-5 transition-all flex flex-col"
          >
            {path.popular && (
              <span className="absolute top-5 right-5 bg-purple-500/15 text-purple-400 text-[10px] font-semibold px-2.5 py-1 rounded-full">
                Popular
              </span>
            )}

            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', path.iconBg, path.iconColor)}>
              {path.icon}
            </div>

            <h3 className="text-foreground font-semibold mt-4">{path.title}</h3>
            <p className="text-foreground/50 text-sm mt-1.5 leading-relaxed">{path.description}</p>

            <div className="border-t border-foreground/10 mt-4 pt-3 flex items-center justify-between">
              <span className={cn('text-xs font-medium', path.tagColor)}>
                {path.tags.join(' • ')}
              </span>
              <span className="shrink-0 w-8 h-8 rounded-full border border-foreground/10 flex items-center justify-center text-foreground/60 group-hover:bg-accent group-hover:border-accent group-hover:text-white transition-all">
                <RiArrowRightLine className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl bg-accent/10 border border-accent/20 p-5 flex items-center gap-4 flex-wrap">
        <div className="w-11 h-11 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
          <RiQuestionLine className="h-5 w-5" />
        </div>
        <p className="text-foreground text-sm font-medium flex-1 min-w-[200px]">
          Not sure which path is right for you?
        </p>
        <Link
          to="/investor/support"
          className="inline-flex items-center gap-1.5 bg-accent text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#d45a1e] transition-colors shrink-0"
        >
          Get Advice <RiArrowRightLine className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
