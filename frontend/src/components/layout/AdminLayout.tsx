import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, Settings,
  CreditCard, LogOut, Inbox, CalendarDays, ClipboardList, Star, User as UserIcon, FolderKanban, Sparkles, GraduationCap, Receipt,
  Menu, X,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useUnreadCounts } from '../../services/queries';
import PageTransition from '../ui/PageTransition';
import Logo from '../Logo';

const navItems = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true, badgeKey: null },
  { to: '/admin/users', label: 'Users', icon: Users, badgeKey: null },
  { to: '/admin/projects', label: 'Projects', icon: FolderKanban, badgeKey: null },
  { to: '/admin/assignments', label: 'Assignments', icon: ClipboardList, badgeKey: 'assignments' as const },
  { to: '/admin/cohorts', label: 'Cohorts', icon: GraduationCap, badgeKey: null },
  { to: '/admin/live-sessions', label: 'Live sessions', icon: CalendarDays, badgeKey: null },
  { to: '/admin/blogs', label: 'Blog posts', icon: FileText, badgeKey: null },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard, badgeKey: null },
  { to: '/admin/payment-plans', label: 'Payment plans', icon: Receipt, badgeKey: null },
  { to: '/admin/service-requests', label: 'Service requests', icon: Inbox, badgeKey: 'serviceRequests' as const },
  { to: '/admin/reviews', label: 'Reviews', icon: Star, badgeKey: 'reviews' as const },
  { to: '/admin/case-studies', label: 'Case studies', icon: Sparkles, badgeKey: null },
  { to: '/admin/profile', label: 'Profile', icon: UserIcon, badgeKey: null },
  { to: '/admin/settings', label: 'Settings', icon: Settings, badgeKey: null },
];

export default function AdminLayout() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';

  // Mobile sidebar drawer state. Auto-closes on route change so a tap on a
  // nav link doesn't leave the drawer open over the new page.
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // The hook polls every 30s on its own, gated on isAdmin so it doesn't fire
  // before the redirect-to-login effect kicks in.
  const { data: counts = { serviceRequests: 0, assignments: 0, reviews: 0 } } =
    useUnreadCounts({ enabled: isAdmin });

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) navigate('/login');
  }, [isAuthenticated, isAdmin, navigate]);

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-slate-950">
      {/* Mobile top bar, visible < lg only */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Logo variant="mark" size={32} onDark />
          <span className="font-bold text-white text-sm">Admin</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          className="p-2 text-slate-300 hover:text-white"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile backdrop, covers content when drawer is open */}
      {mobileOpen && (
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation menu"
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        />
      )}

      {/* Sidebar, slides in on mobile, sticky on desktop */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-slate-900 flex flex-col
          transition-transform duration-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:z-auto
        `}
      >
        {/* Logo + mobile close button */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-start justify-between">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <Logo variant="mark" size={32} onDark />
              <span className="font-bold text-white">E-Bringgs</span>
            </Link>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
            className="lg:hidden p-1 text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon, end, badgeKey }) => {
            const count = badgeKey ? counts[badgeKey] : 0;
            return (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`
                }>
                <Icon size={17} />
                <span className="flex-1">{label}</span>
                {count > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-4.5 text-center leading-none">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.name}</p>
              <p className="text-slate-400 text-xs truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main, pushes down on mobile to clear the fixed top bar */}
      <div className="flex-1 min-w-0 pt-14 lg:pt-0">
        <main className="p-4 sm:p-6 lg:p-8">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
