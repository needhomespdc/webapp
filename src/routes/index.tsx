import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { RootRedirect } from './RootRedirect';
import { InvestorRoute } from './InvestorRoute';
import { PartnerRoute } from './PartnerRoute';

// Auth pages
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const VerifyEmail = lazy(() => import('@/pages/auth/VerifyEmail'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const VerifyResetOTP = lazy(() => import('@/pages/auth/VerifyResetOTP'));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'));

// Investor pages
const InvestorDashboard = lazy(() => import('@/pages/investor/InvestorDashboard'));
const Marketplace = lazy(() => import('@/pages/investor/Marketplace'));
const PropertyDetail = lazy(() => import('@/pages/investor/PropertyDetail'));
const Portfolio = lazy(() => import('@/pages/investor/Portfolio'));
const InvestmentDetail = lazy(() => import('@/pages/investor/InvestmentDetail'));
const InvestorWallet = lazy(() => import('@/pages/investor/Wallet'));
const KYCPage = lazy(() => import('@/pages/investor/KYCPage'));
const Exits = lazy(() => import('@/pages/investor/Exits'));
const Resales = lazy(() => import('@/pages/investor/Resales'));
const Favorites = lazy(() => import('@/pages/investor/Favorites'));

// Partner pages
const PartnerDashboard = lazy(() => import('@/pages/partner/PartnerDashboard'));
const PartnerProperties = lazy(() => import('@/pages/partner/PartnerProperties'));
const Commissions = lazy(() => import('@/pages/partner/Commissions'));
const PartnerWallet = lazy(() => import('@/pages/partner/PartnerWallet'));

// Shared pages
const Notifications = lazy(() => import('@/pages/shared/Notifications'));
const Support = lazy(() => import('@/pages/shared/Support'));
const Profile = lazy(() => import('@/pages/shared/Profile'));

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function withSuspense(Component: React.ComponentType) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  // Root redirect — sends authenticated users to their dashboard, others to /login
  { path: '/', element: <RootRedirect /> },

  // Auth routes
  { path: '/login', element: withSuspense(Login) },
  { path: '/register', element: withSuspense(Register) },
  { path: '/verify-email', element: withSuspense(VerifyEmail) },
  { path: '/forgot-password', element: withSuspense(ForgotPassword) },
  { path: '/verify-reset-otp', element: withSuspense(VerifyResetOTP) },
  { path: '/reset-password', element: withSuspense(ResetPassword) },

  // Investor routes
  {
    element: <InvestorRoute />,
    children: [
      { path: '/investor/dashboard', element: withSuspense(InvestorDashboard) },
      { path: '/investor/marketplace', element: withSuspense(Marketplace) },
      { path: '/investor/marketplace/:slug', element: withSuspense(PropertyDetail) },
      { path: '/investor/portfolio', element: withSuspense(Portfolio) },
      { path: '/investor/portfolio/:investmentId', element: withSuspense(InvestmentDetail) },
      { path: '/investor/wallet', element: withSuspense(InvestorWallet) },
      { path: '/investor/kyc', element: withSuspense(KYCPage) },
      { path: '/investor/exits', element: withSuspense(Exits) },
      { path: '/investor/resales', element: withSuspense(Resales) },
      { path: '/investor/favorites', element: withSuspense(Favorites) },
      { path: '/investor/notifications', element: withSuspense(Notifications) },
      { path: '/investor/support', element: withSuspense(Support) },
      { path: '/investor/profile', element: withSuspense(Profile) },
    ],
  },

  // Partner routes
  {
    element: <PartnerRoute />,
    children: [
      { path: '/partner/dashboard', element: withSuspense(PartnerDashboard) },
      { path: '/partner/properties', element: withSuspense(PartnerProperties) },
      { path: '/partner/commissions', element: withSuspense(Commissions) },
      { path: '/partner/wallet', element: withSuspense(PartnerWallet) },
      { path: '/partner/notifications', element: withSuspense(Notifications) },
      { path: '/partner/support', element: withSuspense(Support) },
      { path: '/partner/profile', element: withSuspense(Profile) },
    ],
  },

  // Catch-all
  { path: '*', element: <Navigate to="/" replace /> },
]);
