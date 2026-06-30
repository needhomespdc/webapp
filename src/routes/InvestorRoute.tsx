import { Navigate } from 'react-router-dom';
import {
  RiDashboardLine,
  RiDashboardFill,
  RiWalletLine,
  RiWalletFill,
} from 'react-icons/ri';
import { useAuth } from '@/hooks/useAuth';
import { AppShell } from '@/components/layout/AppShell';
import { HiBell, HiOutlineBell } from 'react-icons/hi2';
import { AiFillPieChart, AiOutlinePieChart } from "react-icons/ai";
import { HiOutlineBuildingOffice2, HiBuildingOffice2 } from "react-icons/hi2";


const investorNavItems = [
  {
    label: 'Dashboard',
    to: '/investor/dashboard',
    icon: <RiDashboardLine />,
    activeIcon: <RiDashboardFill />,
  },
  {
    label: 'Marketplace',
    to: '/investor/marketplace',
    icon: <HiOutlineBuildingOffice2 />,
    activeIcon: <HiBuildingOffice2 />,
  },
  {
    label: 'Portfolio',
    to: '/investor/portfolio',
    icon: <AiOutlinePieChart />,
    activeIcon: <AiFillPieChart />,
  },
  {
    label: 'Wallet',
    to: '/investor/wallet',
    icon: <RiWalletLine />,
    activeIcon: <RiWalletFill />,
  },
  {
    label: 'Notifications',
    to: '/investor/notifications',
    icon: <HiOutlineBell />,
    activeIcon: <HiBell />,
  },
];

export function InvestorRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user?.role === 'partner') {
    return <Navigate to="/partner/dashboard" replace />;
  }

  return <AppShell navItems={investorNavItems} />;
}
