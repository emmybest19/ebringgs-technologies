import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, LogOut, User, LayoutDashboard, Sun, Moon, Bell, BellOff } from 'lucide-react';
import Logo from '../Logo';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useAuthStore } from '../../store/auth.store';
import { useThemeStore } from '../../store/theme.store';

const navLinks = [
  { label: 'Services', to: '/services' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Portfolio', to: '/portfolio' },
  { label: 'About', to: '/about' },
  { label: 'How It Works', to: '/how-it-works' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const { mode, setMode } = useThemeStore();
  const navigate = useNavigate();

  const ThemeIcon = mode === 'dark' ? Sun : Moon;
  const { permission, isSubscribed, isLoading: pushLoading, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } = usePushNotifications();

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-gray-100 dark:border-slate-800 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <Logo variant="full" size={60} asLink className="drop-shadow-sm" />


        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'text-teal-600 bg-teal-50 dark:bg-teal-950' : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Auth actions + theme toggle */}
        <div className="hidden md:flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={`Theme: ${mode}`}
            title={`Theme: ${mode}. Click to switch.`}
          >
            <ThemeIcon size={18} className="text-gray-600 dark:text-slate-400" />
          </button>

          {isAuthenticated && user ? (
            <>
            {/* Push notification bell */}
            {permission !== 'unsupported' && (
              <button
                onClick={isSubscribed ? pushUnsubscribe : pushSubscribe}
                disabled={pushLoading || permission === 'denied'}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                aria-label={isSubscribed ? 'Disable notifications' : 'Enable notifications'}
                title={
                  permission === 'denied'
                    ? 'Notifications blocked — enable in browser settings'
                    : isSubscribed
                      ? 'Notifications enabled — click to disable'
                      : 'Enable push notifications'
                }
              >
                {isSubscribed ? (
                  <Bell size={18} className="text-teal-600 dark:text-teal-400" />
                ) : (
                  <BellOff size={18} className="text-gray-400 dark:text-slate-500" />
                )}
                {isSubscribed && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-500 rounded-full" />
                )}
              </button>
            )}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-teal-600 dark:text-teal-300 font-semibold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{user.name.split(' ')[0]}</span>
                <ChevronDown size={14} className="text-gray-500 dark:text-slate-500" />
              </button>

              {dropdownOpen && (() => {
                const dashboardPath =
                  user?.role === 'admin' ? '/admin'
                  : user?.role === 'teacher' ? '/teacher'
                  : user?.role === 'client' ? '/client'
                  : '/dashboard';
                const profilePath =
                  user?.role === 'admin' ? '/admin/profile'
                  : user?.role === 'teacher' ? '/teacher/profile'
                  : user?.role === 'client' ? '/client/profile'
                  : '/dashboard/profile';
                return (
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 py-1 z-50">
                  <Link
                    to={dashboardPath}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                  <Link
                    to={profilePath}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User size={16} /> Profile
                  </Link>
                  <hr className="my-1 border-gray-100 dark:border-slate-700" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
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
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="flex md:hidden items-center gap-1">
          <button
            onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={`Theme: ${mode}`}
          >
            <ThemeIcon size={18} className="text-gray-600 dark:text-slate-400" />
          </button>
          {isAuthenticated && permission !== 'unsupported' && (
            <button
              onClick={isSubscribed ? pushUnsubscribe : pushSubscribe}
              disabled={pushLoading || permission === 'denied'}
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              aria-label={isSubscribed ? 'Disable notifications' : 'Enable notifications'}
            >
              {isSubscribed ? (
                <Bell size={18} className="text-teal-600 dark:text-teal-400" />
              ) : (
                <BellOff size={18} className="text-gray-400 dark:text-slate-500" />
              )}
              {isSubscribed && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-500 rounded-full" />
              )}
            </button>
          )}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} className="text-gray-900 dark:text-white" /> : <Menu size={22} className="text-gray-900 dark:text-white" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pb-4">
          <ul className="mt-2 space-y-1">
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-lg text-sm font-medium ${
                      isActive ? 'text-teal-600 bg-teal-50 dark:bg-teal-950' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
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
                className="w-full px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-950"
              >
                Sign out
              </button>
            ) : (
              <>
                <Link to="/login" className="block text-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800" onClick={() => setMenuOpen(false)}>Sign in</Link>
                <Link to="/register" className="block text-center px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700" onClick={() => setMenuOpen(false)}>Get started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
