import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, CreditCard, LogOut, User, Star, Sparkles,
  Calendar, Menu, X,
} from 'lucide-react';
import { useAuthStore } from '@ebringgs/auth';
import { Logo, PageTransition } from '@ebringgs/ui';
import useScrollReveal from '../../hooks/useScrollReveal';

const calendlyConfigured = Boolean(import.meta.env.VITE_CALENDLY_URL);

const navItems = [
  { to: '/client', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/client/projects', label: 'Projects', icon: FolderKanban },
  { to: '/client/services', label: 'Browse Services', icon: Sparkles },
  ...(calendlyConfigured
    ? [{ to: '/client/schedule-call', label: 'Schedule a Call', icon: Calendar }]
    : []),
  { to: '/client/payments', label: 'Payments', icon: CreditCard },
  { to: '/client/reviews', label: 'My Reviews', icon: Star },
  { to: '/client/profile', label: 'Profile', icon: User },
];

export default function ClientLayout() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  useScrollReveal(mainRef);

  // Mobile drawer state, auto-closes on route change.
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'client') {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  if (!user || user.role !== 'client') return null;

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-slate-950">
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Logo variant="mark" size={32} onDark />
          <span className="font-bold text-white text-sm">Client</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          className="p-2 text-slate-300 hover:text-white"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation menu"
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-slate-900 flex flex-col
          transition-transform duration-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:z-auto
        `}
      >
        {/* Logo + mobile close */}
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
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }>
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
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

      {/* Main */}
      <div className="flex-1 min-w-0 pt-14 lg:pt-0">
        <main ref={mainRef} className="p-4 sm:p-6 lg:p-8">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
