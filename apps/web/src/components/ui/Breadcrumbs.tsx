import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

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
  team: 'Meet the Team',
  values: 'Our Values',
  client: 'Client Services',
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
    // Sits directly on the page surface — no bar, border or shadow — so it
    // reads as part of the page rather than a strip bolted under the header.
    <nav aria-label="Breadcrumb" className="relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ol className="flex items-center gap-2 pt-8 text-sm overflow-x-auto">
          <li>
            <Link to="/" className="text-slate-400 hover:text-white transition-colors">
              Home
            </Link>
          </li>
          {crumbs.map(({ label, path, isLast }) => (
            <li key={path} className="flex items-center gap-2">
              <ChevronRight size={13} className="text-slate-600 shrink-0" />
              {isLast ? (
                <span className="text-cyan-400 truncate max-w-[200px]">{label}</span>
              ) : (
                <Link
                  to={path}
                  className="text-slate-400 hover:text-white transition-colors truncate max-w-[200px]"
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
