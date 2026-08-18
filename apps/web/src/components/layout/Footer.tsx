import { Link } from 'react-router-dom';
import { Mail, Twitter, Linkedin, Github } from 'lucide-react';

/**
 * Site footer.
 *
 * DARK ONLY, deliberately — colours are unconditional rather than `dark:`
 * variants, matching the landing and auth pages.
 *
 * Uses main.png at 140px, where the full lockup's "TECHNOLOGIES" line and
 * tagline are legible; the header renders the same art at half that and
 * loses them.
 */
const BRAND_LOCKUP = '/ebrings/main.png';

const footerLinks = {
  Offerings: [
    { label: 'Software Engineering', to: '/services/software-development' },
    { label: 'Data & Analytics', to: '/services/data-analytics' },
    { label: 'UX Research', to: '/services/ux-product-design' },
    { label: 'Product Strategy', to: '/services' },
  ],
  Resources: [
    { label: 'Cohort Schedule', to: '/schedule' },
    { label: 'Documentation', to: '/how-it-works' },
    { label: 'Success Stories', to: '/success-stories' },
    { label: 'Careers', to: '/careers' },
  ],
  Legal: [
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
  ],
};

function BrandLockup({ height = 140 }: { height?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden"
      style={{ height, width: height * 1.1 }}
    >
      <img
        src={BRAND_LOCKUP}
        alt="E-Bringgs Technologies"
        draggable={false}
        style={{ height: height * 1.25, width: 'auto', maxWidth: 'none' }}
      />
    </span>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#060a0e] text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-flex">
              <BrandLockup />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
              Transformative live learning, real-world cohort programs, and custom business
              integrations designed to elevate engineering, design, and data teams.
            </p>
          </div>

          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {section}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-slate-400 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 sm:flex-row">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} ebringgs inc. All rights reserved. Made for elite operators worldwide.
          </p>
          <div className="flex gap-2">
            {[
              { Icon: Twitter, href: '#', label: 'Twitter' },
              { Icon: Linkedin, href: '#', label: 'LinkedIn' },
              { Icon: Github, href: '#', label: 'GitHub' },
              { Icon: Mail, href: 'mailto:ebringgstechnologies@gmail.com', label: 'Email' },
            ].map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition-colors hover:bg-cyan-400/10 hover:text-cyan-400"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
