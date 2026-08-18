import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings, Mail, Shield, Database, Globe, Users,
  CalendarDays, CreditCard, FileText, CheckCircle2, AlertCircle,
  ChevronRight, Zap,
} from 'lucide-react';
import { useSEO } from '@ebringgs/ui';

interface SettingRow {
  label: string;
  value: string;
  status?: 'ok' | 'warn' | 'error';
}

function SettingsSection({ title, icon: Icon, rows }: { title: string; icon: React.ElementType; rows: SettingRow[] }) {
  return (
    <div className="bg-white dark:bg-[#0e141c] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100 dark:border-slate-800">
        <Icon size={18} className="text-cyan-600" />
        <h2 className="font-bold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-slate-800">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between px-6 py-3.5">
            <p className="text-sm text-gray-600 dark:text-slate-400">{row.label}</p>
            <div className="flex items-center gap-2">
              {row.status === 'ok' && <CheckCircle2 size={14} className="text-green-500 shrink-0" />}
              {row.status === 'warn' && <AlertCircle size={14} className="text-amber-500 shrink-0" />}
              {row.status === 'error' && <AlertCircle size={14} className="text-red-500 shrink-0" />}
              <span className={`text-sm font-medium ${
                row.status === 'ok' ? 'text-green-700 dark:text-green-400' :
                row.status === 'warn' ? 'text-amber-700 dark:text-amber-400' :
                row.status === 'error' ? 'text-red-700 dark:text-red-400' :
                'text-gray-700 dark:text-slate-300'
              }`}>{row.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const quickLinks = [
  { label: 'Manage users & roles', to: '/admin/users', icon: Users, color: 'text-cyan-600 bg-cyan-50' },
  { label: 'Live sessions', to: '/admin/live-sessions', icon: CalendarDays, color: 'text-emerald-600 bg-emerald-50' },
  { label: 'Payment overview', to: '/admin/payments', icon: CreditCard, color: 'text-purple-600 bg-purple-50' },
  { label: 'Service requests', to: '/admin/service-requests', icon: FileText, color: 'text-amber-600 bg-amber-50' },
];

export default function AdminSettings() {
  useSEO({ title: 'Settings', siteName: 'E-Bringgs Admin' });
  const [apiEnv] = useState({
    nodeEnv: import.meta.env.MODE || 'development',
    apiBase: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    frontendUrl: window.location.origin,
  });

  const platformRows: SettingRow[] = [
    { label: 'Platform name', value: 'E-Bringgs Technologies' },
    { label: 'Frontend URL', value: apiEnv.frontendUrl },
    { label: 'API base URL', value: apiEnv.apiBase },
    { label: 'Environment', value: apiEnv.nodeEnv, status: apiEnv.nodeEnv === 'production' ? 'ok' : 'warn' },
  ];

  const emailRows: SettingRow[] = [
    { label: 'SMTP transport', value: 'nodemailer (configured via env)', status: 'ok' },
    { label: 'From address', value: 'E-Bringgs <ebringgstechnologies@gmail.com>' },
    { label: 'Templates', value: 'Verify email, Password reset, Enrollment', status: 'ok' },
    { label: 'SMTP_HOST env', value: import.meta.env.VITE_SMTP_STATUS || 'Set via backend .env', status: 'warn' },
  ];

  const securityRows: SettingRow[] = [
    { label: 'Auth strategy', value: 'JWT (Access 15m + Refresh 7d)', status: 'ok' },
    { label: 'Password hashing', value: 'bcryptjs · 12 salt rounds', status: 'ok' },
    { label: 'Rate limiting', value: '100 req / 15 min per IP', status: 'ok' },
    { label: 'Secure headers', value: 'Helmet enabled', status: 'ok' },
    { label: 'Input validation', value: 'Zod schemas on all auth routes', status: 'ok' },
    { label: 'CORS', value: 'Origin: VITE_CLIENT_URL env var', status: 'ok' },
  ];

  const storageRows: SettingRow[] = [
    { label: 'Database', value: 'MongoDB via Mongoose', status: 'ok' },
    { label: 'File uploads', value: 'Local disk (uploads/ directory)', status: 'warn' },
    { label: 'Cloud storage', value: 'Not configured, use Cloudinary/S3 in prod', status: 'warn' },
    { label: 'Payments', value: 'Paystack, Transactions + Webhooks', status: 'ok' },
    { label: 'API docs', value: 'Swagger UI at /api/docs', status: 'ok' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Settings size={22} className="text-cyan-600" /> Settings
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Platform configuration and system status overview</p>
      </div>

      <div className="grid gap-5">
        {/* Status badge */}
        <div className="flex items-center gap-3 bg-cyan-50 dark:bg-cyan-950 border border-cyan-100 dark:border-cyan-800 rounded-2xl px-5 py-3.5">
          <Zap size={18} className="text-cyan-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-cyan-800 dark:text-cyan-200">System operational</p>
            <p className="text-xs text-cyan-600 dark:text-cyan-400">All core services running. Configuration is read from environment variables.</p>
          </div>
          <span className="px-2.5 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">Online</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <SettingsSection title="Platform" icon={Globe} rows={platformRows} />
          <SettingsSection title="Email / SMTP" icon={Mail} rows={emailRows} />
          <SettingsSection title="Security" icon={Shield} rows={securityRows} />
          <SettingsSection title="Storage & Integrations" icon={Database} rows={storageRows} />
        </div>

        {/* Quick links */}
        <div className="bg-white dark:bg-[#0e141c] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Quick navigation</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {quickLinks.map(({ label, to, icon: Icon, color }) => (
              <Link key={to} to={to}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group">
                <div className={`p-2 rounded-lg ${color} shrink-0`}>
                  <Icon size={16} />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300 group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors flex-1">
                  {label}
                </span>
                <ChevronRight size={14} className="text-gray-300 dark:text-slate-600 group-hover:text-cyan-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Environment vars reminder */}
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-100 dark:border-amber-800 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">Required environment variables</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mb-2">Ensure these are set in your backend <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">.env</code> file before going to production:</p>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
                {[
                  'MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET',
                  'PAYSTACK_SECRET_KEY',
                  'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS',
                  'CLIENT_URL', 'EMAIL_FROM',
                ].map(v => (
                  <code key={v} className="text-xs text-amber-800 dark:text-amber-300 font-mono">{v}</code>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
