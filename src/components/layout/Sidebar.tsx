import { NavLink, useNavigate } from 'react-router-dom';
import { RiLogoutBoxLine, RiUserLine } from 'react-icons/ri';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { cn } from '@/lib/utils';
import type { NavItem } from './AppShell';

interface SidebarProps {
  navItems: NavItem[];
}

export function Sidebar({ navItems }: SidebarProps) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotificationContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName =
    user?.role === 'partner'
      ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
      : user?.investorType === 'corporate'
      ? (user.companyName ?? 'Corporate')
      : `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-[#0f0f0f] border-r border-white/5 z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/5 flex items-center">
        <img src="/logo/logo-hero-white.png" alt="NeedHomes Logo" className="w-30" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-accent/15 text-accent'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className="text-xl">
                  {isActive && item.activeIcon ? item.activeIcon : item.icon}
                </span>
                <span>{item.label}</span>
                {item.label === 'Notifications' && unreadCount > 0 && (
                  <span className="ml-auto bg-accent text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-white/5 space-y-1">
        <NavLink
          to={user?.role === 'investor' ? '/investor/profile' : '/partner/profile'}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              isActive ? 'bg-accent/15 text-accent' : 'text-white/60 hover:text-white hover:bg-white/5'
            )
          }
        >
          <RiUserLine className="text-xl" />
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm">{displayName || 'Profile'}</p>
            <p className="truncate text-xs opacity-60">{user?.email}</p>
          </div>
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-red-400 hover:bg-red-400/5 transition-all w-full"
        >
          <RiLogoutBoxLine className="text-xl" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
