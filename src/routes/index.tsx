import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { RootRedirect } from './RootRedirect';
import { InvestorRoute } from './InvestorRoute';
import { PartnerRoute } from './PartnerRoute';
import { RouteErrorPage } from '@/components/shared/ErrorBoundary';

// Auth pages
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const VerifyEmail = lazy(() => import('@/pages/auth/VerifyEmail'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const VerifyResetOTP = lazy(() => import('@/pages/auth/VerifyResetOTP'));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'));

// Investor pages
const InvestorDashboard = lazy(() => import('@/pages/investor/InvestorDashboard'));
const Invest = lazy(() => import('@/pages/investor/Invest'));
const Marketplace = lazy(() => import('@/pages/investor/Marketplace'));
const PropertyDetail = lazy(() => import('@/pages/investor/PropertyDetail'));
const Portfolio = lazy(() => import('@/pages/investor/Portfolio'));
const InvestmentDetail = lazy(() => import('@/pages/investor/InvestmentDetail'));
const InvestorWallet = lazy(() => import('@/pages/investor/Wallet'));
const KYCPage = lazy(() => import('@/pages/investor/KYCPage'));
const ExitsAndResales = lazy(() => import('@/pages/investor/ExitsAndResales'));
const ExitsList = lazy(() => import('@/pages/investor/Exits'));
const Resales = lazy(() => import('@/pages/investor/Resales'));
const Favorites = lazy(() => import('@/pages/investor/Favorites'));

// Partner pages
const PartnerDashboard = lazy(() => import('@/pages/partner/PartnerDashboard'));
const PartnerProperties = lazy(() => import('@/pages/partner/PartnerProperties'));
const PartnerShare = lazy(() => import('@/pages/partner/Share'));
const CommissionEarnings = lazy(() => import('@/pages/partner/CommissionEarnings'));
const CommissionWallet = lazy(() => import('@/pages/partner/CommissionWallet'));
const PartnerFavorites = lazy(() => import('@/pages/partner/Favorites'));
const PartnerPropertyDetail = lazy(() => import('@/pages/partner/PartnerPropertyDetail'));
const PartnerKYCPage = lazy(() => import('@/pages/partner/KYCPage'));

// Shared pages
const Notifications = lazy(() => import('@/pages/shared/Notifications'));
const Support = lazy(() => import('@/pages/shared/Support'));
const Profile = lazy(() => import('@/pages/shared/Profile'));
const Settings = lazy(() => import('@/pages/shared/Settings'));
const AddBankAccount = lazy(() => import('@/pages/shared/AddBankAccount'));


function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
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
  {
    // Root wrapper — provides our custom error UI for every route
    errorElement: <RouteErrorPage />,
    children: [
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
          { path: '/investor/invest', element: withSuspense(Invest) },
          { path: '/investor/marketplace', element: withSuspense(Marketplace) },
          { path: '/investor/marketplace/:slug', element: withSuspense(PropertyDetail) },
          { path: '/investor/portfolio', element: withSuspense(Portfolio) },
          { path: '/investor/portfolio/:investmentId', element: withSuspense(InvestmentDetail) },
          { path: '/investor/wallet', element: withSuspense(InvestorWallet) },
          { path: '/wallet/paystack/callback', element: withSuspense(InvestorWallet) },
          { path: '/investor/kyc', element: withSuspense(KYCPage) },
          { path: '/investor/exits-and-resales', element: withSuspense(ExitsAndResales) },
          { path: '/investor/exits', element: withSuspense(ExitsList) },
          { path: '/investor/resales', element: withSuspense(Resales) },
          { path: '/investor/favorites', element: withSuspense(Favorites) },
          { path: '/investor/add-bank-account', element: withSuspense(AddBankAccount) },
          { path: '/investor/notifications', element: withSuspense(Notifications) },
          { path: '/investor/support', element: withSuspense(Support) },
          // { path: '/investor/settings', element: withSuspense(Settings) },
          { path: '/investor/profile', element: withSuspense(Profile) },
        ],
      },

      // Partner routes
      {
        element: <PartnerRoute />,
        children: [
          { path: '/partner/dashboard', element: withSuspense(PartnerDashboard) },
          { path: '/partner/properties', element: withSuspense(PartnerProperties) },
          { path: '/partner/properties/:slug', element: withSuspense(PartnerPropertyDetail) },
          { path: '/partner/share', element: withSuspense(PartnerShare) },
          { path: '/partner/commission-earnings', element: withSuspense(CommissionEarnings) },
          { path: '/partner/wallet', element: withSuspense(CommissionWallet) },
          { path: '/partner/kyc', element: withSuspense(PartnerKYCPage) },
          { path: '/partner/add-bank-account', element: withSuspense(AddBankAccount) },
          { path: '/partner/favorites', element: withSuspense(PartnerFavorites) },
          { path: '/partner/notifications', element: withSuspense(Notifications) },
          { path: '/partner/support', element: withSuspense(Support) },
          { path: '/partner/settings', element: withSuspense(Settings) },
          { path: '/partner/profile', element: withSuspense(Profile) },
        ],
      },

      // Catch-all → 404
      { path: '*', element: withSuspense(lazy(() => import('@/pages/NotFound'))) },
    ],
  },
]);
