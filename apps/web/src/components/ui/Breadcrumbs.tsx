import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const labelMap: Record<string, string> = {
  pricing: 'Pricing',
  services: 'Services',
  blog: 'Blog',
  about: 'About',
  'how-it-works': 'How It Works',
  'success-stories': 'Success Stories',
  portfolio: 'Portfolio',
  schedule: 'Schedule',
  instructors: 'Instructors',
  contact: 'Contact',
  terms: 'Terms',
  privacy: 'Privacy',
  'verify-certificate': 'Verify Certificate',
  dashboard: 'Dashboard',
  profile: 'Profile',
  certificate: 'Certificate',
  checkout: 'Checkout',
};

export default function Breadcrumbs() {
  const { pathname } = useLocation();

  if (pathname === '/') return null;

  const segments = pathname.split('/').filter(Boolean);

  const crumbs = segments.map((seg, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/');
    const label = labelMap[seg] || decodeURIComponent(seg).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const isLast = i === segments.length - 1;
    return { label, path, isLast };
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className="relative z-20 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <ol className="flex items-center gap-2 py-3.5 text-sm overflow-x-auto">
          <li>
            <Link
              to="/"
              className="flex items-center gap-1.5 text-gray-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              <Home size={15} />
              <span>Home</span>
            </Link>
          </li>
          {crumbs.map(({ label, path, isLast }) => (
            <li key={path} className="flex items-center gap-2">
              <ChevronRight size={13} className="text-gray-300 dark:text-slate-600 shrink-0" />
              {isLast ? (
                <span className="font-semibold text-teal-700 dark:text-teal-400 truncate max-w-[200px]">
                  {label}
                </span>
              ) : (
                <Link
                  to={path}
                  className="text-gray-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors truncate max-w-[200px]"
                >
                  {label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
