import { Navigate } from 'react-router-dom';
import {
  RiDashboardLine,
  RiDashboardFill,
  RiMoneyDollarCircleLine,
  RiMoneyDollarCircleFill,
  RiWalletLine,
  RiWalletFill,
  RiSettings4Line,
  RiSettings4Fill,
} from 'react-icons/ri';
import { useAuth } from '@/hooks/useAuth';
import { AppShell } from '@/components/layout/AppShell';
import { HiOutlineBuildingOffice2, HiBuildingOffice2 } from "react-icons/hi2";
import { BiSupport } from 'react-icons/bi';

const partnerNavItems = [
  {
    label: 'Dashboard',
    to: '/partner/dashboard',
    icon: <RiDashboardLine />,
    activeIcon: <RiDashboardFill />,
  },
  {
    label: 'Properties',
    to: '/partner/properties',
    icon: <HiOutlineBuildingOffice2 />,
    activeIcon: <HiBuildingOffice2 />,
  },
  {
    label: 'Commissions',
    to: '/partner/commissions',
    icon: <RiMoneyDollarCircleLine />,
    activeIcon: <RiMoneyDollarCircleFill />,
  },
  {
    label: 'Wallet',
    to: '/partner/wallet',
    icon: <RiWalletLine />,
    activeIcon: <RiWalletFill />,
  },
  {
      label: 'Support Center',
      to: '/investor/support',
      icon: <BiSupport />,
      activeIcon: <BiSupport />,
    },
  {
    label: 'Settings',
    to: '/partner/settings',
    icon: <RiSettings4Line />,
    activeIcon: <RiSettings4Fill />,
  },
];

export function PartnerRoute() {
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

  if (user?.role === 'investor') {
    return <Navigate to="/investor/dashboard" replace />;
  }

  return <AppShell navItems={partnerNavItems} />;
}
