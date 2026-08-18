import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, LogOut, User, LayoutDashboard, Bell, BellOff, ArrowRight } from 'lucide-react';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useAuthStore } from '@ebringgs/auth';

/**
 * Site header.
 *
 * DARK ONLY, deliberately — colours are unconditional rather than `dark:`
 * variants, matching the landing and auth pages. The light-mode treatment is
 * still to be specified.
 *
 * The brand art is main.png, the full vertical lockup (mark over wordmark
 * over TECHNOLOGIES over the tagline). It's rendered at 72px, which needs a
 * 96px header — Layout's top padding is matched to that. At this size the
 * mark and "e-bringgs" read clearly; the two lines beneath them do not.
 */
const BRAND_LOCKUP = '/ebrings/main.png';

const navLinks = [
  { label: 'Services', to: '/services' },
  { label: 'About', to: '/about' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'Contact', to: '/contact' },
];

// Rendered uncropped. An earlier version clipped the canvas to tighten the
// padding, which cut the "Build. Launch. Grow." tagline off the bottom — the
// artwork sits too close to the edge for that to be safe. The transparent
// margin costs a few pixels; losing a line of the logo doesn't.
function BrandLockup({ height = 84 }: { height?: number }) {
  return (
    <img
      src={BRAND_LOCKUP}
      alt="E-Bringgs Technologies"
      draggable={false}
      className="shrink-0 object-contain"
      style={{ height, width: 'auto' }}
    />
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const { permission, isSubscribed, isLoading: pushLoading, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } = usePushNotifications();

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#080c11]/90 backdrop-blur">
      <nav className="mx-auto flex h-24 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center">
          <BrandLockup />
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `relative rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-cyan-400 after:absolute after:inset-x-4 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-cyan-400'
                      : 'text-slate-400 hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Auth actions + theme toggle */}
        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated && user ? (
            <>
              {permission !== 'unsupported' && (
                <button
                  onClick={isSubscribed ? pushUnsubscribe : pushSubscribe}
                  disabled={pushLoading || permission === 'denied'}
                  className="relative rounded-lg p-2 transition-colors hover:bg-white/5 disabled:opacity-50"
                  aria-label={isSubscribed ? 'Disable notifications' : 'Enable notifications'}
                  title={
                    permission === 'denied'
                      ? 'Notifications blocked, enable in browser settings'
                      : isSubscribed
                        ? 'Notifications enabled, click to disable'
                        : 'Enable push notifications'
                  }
                >
                  {isSubscribed
                    ? <Bell size={18} className="text-cyan-400" />
                    : <BellOff size={18} className="text-slate-500" />}
                  {isSubscribed && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-cyan-400" />}
                </button>
              )}

              <div className="relative">
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-400/10 text-sm font-semibold text-cyan-300">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-sm font-medium text-slate-300">{user.name.split(' ')[0]}</span>
                  <ChevronDown size={14} className="text-slate-500" />
                </button>

                {dropdownOpen && (() => {
                  // Admins and teachers live on their own subdomains. These
                  // links shoot them off-origin so they hit their own portal
                  // (with its own localStorage auth). Students and clients
                  // stay here on the main web app.
                  const adminUrl = (import.meta.env.VITE_ADMIN_URL as string | undefined) || 'https://admin.ebringgs.com';
                  const teacherUrl = (import.meta.env.VITE_TEACHER_URL as string | undefined) || 'https://teachers.ebringgs.com';
                  const dashboardPath =
                    user?.role === 'admin' ? adminUrl
                    : user?.role === 'teacher' ? teacherUrl
                    : user?.role === 'client' ? '/client'
                    : '/dashboard';
                  const profilePath =
                    user?.role === 'admin' ? `${adminUrl}/profile`
                    : user?.role === 'teacher' ? `${teacherUrl}/profile`
                    : user?.role === 'client' ? '/client/profile'
                    : '/dashboard/profile';
                  return (
                    <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-slate-800 bg-[#0e141c] py-1 shadow-lg">
                      <Link
                        to={dashboardPath}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <LayoutDashboard size={16} /> Dashboard
                      </Link>
                      <Link
                        to={profilePath}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <User size={16} /> Profile
                      </Link>
                      <hr className="my-1 border-slate-800" />
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
                      >
                        <LogOut size={16} /> Sign out
                      </button>
                    </div>
                  );
                })()}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white">
                Sign In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300"
              >
                Get started <ArrowRight size={14} />
              </Link>
            </>
          )}
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-1 md:hidden">
          {isAuthenticated && permission !== 'unsupported' && (
            <button
              onClick={isSubscribed ? pushUnsubscribe : pushSubscribe}
              disabled={pushLoading || permission === 'denied'}
              className="relative rounded-lg p-2 transition-colors hover:bg-white/5 disabled:opacity-50"
              aria-label={isSubscribed ? 'Disable notifications' : 'Enable notifications'}
            >
              {isSubscribed
                ? <Bell size={18} className="text-cyan-400" />
                : <BellOff size={18} className="text-slate-500" />}
              {isSubscribed && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-cyan-400" />}
            </button>
          )}
          <button
            className="rounded-lg p-2 transition-colors hover:bg-white/5"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} className="text-white" /> : <Menu size={22} className="text-white" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-white/[0.06] bg-[#080c11] px-4 pb-4 md:hidden">
          <ul className="mt-2 space-y-1">
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `block rounded-lg px-4 py-2 text-sm font-medium ${
                      isActive ? 'text-cyan-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="w-full rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10"
              >
                Sign out
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block rounded-lg border border-slate-700 px-4 py-2 text-center text-sm font-medium text-slate-300 hover:bg-white/5"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="block rounded-lg bg-cyan-400 px-4 py-2 text-center text-sm font-bold text-slate-950 hover:bg-cyan-300"
                  onClick={() => setMenuOpen(false)}
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
