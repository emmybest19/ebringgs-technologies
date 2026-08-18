import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, ClipboardList, Video, Trophy, Star,
  LogOut, User as UserIcon, Users, GraduationCap,
  Menu, X,
} from 'lucide-react';
import { useAuthStore } from '@ebringgs/auth';
import AITutorWidget from '../ui/AITutorWidget';
import { Logo, PageTransition } from '@ebringgs/ui';
import useScrollReveal from '../../hooks/useScrollReveal';

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/dashboard/assignments', label: 'Assignments', icon: ClipboardList },
  { to: '/dashboard/recordings', label: 'Recordings', icon: Video },
  { to: '/dashboard/services', label: 'Services', icon: GraduationCap },
  { to: '/dashboard/instructors', label: 'Instructors', icon: Users },
  { to: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/dashboard/reviews', label: 'My Reviews', icon: Star },
  { to: '/dashboard/profile', label: 'Profile', icon: UserIcon },
];

export default function StudentLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  useScrollReveal(mainRef);

  // Mobile drawer state, auto-closes on route change.
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-[#080c11]">
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 bg-[#0e141c] border-b border-slate-800 flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Logo variant="mark" size={32} />
          <span className="font-bold text-white text-sm">Student</span>
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
          fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-[#0e141c] flex flex-col
          transition-transform duration-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:z-auto
        `}
      >
        {/* Logo + mobile close */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-start justify-between">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <Logo variant="mark" size={32} />
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

        <nav className="flex-1 overflow-y-hidden px-3 py-1 space-y-0.5 ">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-[#141b26]'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-sm">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.name}</p>
              <p className="text-slate-400 text-xs truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-[#141b26] transition-colors"
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

      <AITutorWidget />
    </div>
  );
}
