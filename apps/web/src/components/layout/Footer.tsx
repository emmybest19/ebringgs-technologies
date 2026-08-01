import { Link } from 'react-router-dom';
import { Mail, Twitter, Linkedin, Github } from 'lucide-react';
import { Logo } from '@ebringgs/ui';

const footerLinks = {
  Company: [
    { label: 'About', to: '/about' },
    { label: 'Blog', to: '/blog' },
    { label: 'Careers', to: '/careers' },
    { label: 'Contact', to: '/contact' },
  ],
  Services: [
    { label: 'Software Development', to: '/services' },
    { label: 'Data Analysis', to: '/services' },
    { label: 'Research Support', to: '/services' },
    { label: 'UX / Product', to: '/services' },
  ],
  Learning: [
    { label: 'Training Programs', to: '/pricing' },
    { label: 'Student Portfolio', to: '/portfolio' },
    { label: 'Success Stories', to: '/success-stories' },
    { label: 'Student Portal', to: '/dashboard' },
    { label: 'How It Works', to: '/how-it-works' },
  ],
  Legal: [
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <Logo variant="full" size={72} asLink tone="dark" className="drop-shadow-sm" />
            </div>
            <p className="text-sm leading-relaxed mb-6">
              Empowering individuals and organizations through technology, learning, and innovation.
            </p>
            <div className="flex gap-3">
              {[
                { Icon: Twitter, href: '#' },
                { Icon: Linkedin, href: '#' },
                { Icon: Github, href: '#' },
                { Icon: Mail, href: 'mailto:ebringgstechnologies@gmail.com' },
              ].map(({ Icon, href }, i) => (
                <a key={i} href={href} className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-teal-600 flex items-center justify-center transition-colors" target="_blank" rel="noopener noreferrer">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-white font-semibold text-sm mb-4">{section}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">© {new Date().getFullYear()} E-Bringgs Technologies. All rights reserved.</p>
          <p className="text-sm">Built with passion in Africa 🌍</p>
        </div>
      </div>
    </footer>
  );
}
