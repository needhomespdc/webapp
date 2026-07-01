import { Navigate } from 'react-router-dom';
import {
  RiDashboardLine,
  RiDashboardFill,
  RiWalletLine,
  RiWalletFill,
  RiLineChartLine,
  RiLineChartFill,
  RiShieldCheckLine,
  RiShieldCheckFill,
  RiSettings4Line,
  RiSettings4Fill,
} from 'react-icons/ri';
import { useAuth } from '@/hooks/useAuth';
import { AppShell } from '@/components/layout/AppShell';
import { AiFillPieChart, AiOutlinePieChart } from "react-icons/ai";
import { HiOutlineBuildingOffice2, HiBuildingOffice2 } from "react-icons/hi2";
import { BiSupport } from "react-icons/bi";


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
    label: 'Invest',
    to: '/investor/invest',
    icon: <RiLineChartLine />,
    activeIcon: <RiLineChartFill />,
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
    label: 'KYC Verification',
    to: '/investor/kyc',
    icon: <RiShieldCheckLine />,
    activeIcon: <RiShieldCheckFill />,
  },
  {
    label: 'Support Center',
    to: '/investor/support',
    icon: <BiSupport />,
    activeIcon: <BiSupport />,
  },
  {
    label: 'Settings',
    to: '/investor/settings',
    icon: <RiSettings4Line />,
    activeIcon: <RiSettings4Fill />,
  },
];

export function InvestorRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'partner') {
    return <Navigate to="/partner/dashboard" replace />;
  }

  return <AppShell navItems={investorNavItems} />;
}
