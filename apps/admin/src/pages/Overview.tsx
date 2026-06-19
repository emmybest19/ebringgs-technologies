import { Link } from 'react-router-dom';
import {
  Users, FileText, CreditCard, TrendingUp,
  ArrowRight, Activity, ClipboardList, GraduationCap,
} from 'lucide-react';
import { useAdminStats } from '../services/queries';
import { useSEO } from '@ebringgs/ui';

const SITE = 'E-Bringgs Admin';

const FALLBACK = {
  totalUsers: 0, newUsersThisMonth: 0,
  totalBlogs: 0, publishedBlogs: 0,
  revenue: 0, pendingAssignments: 0,
};

export default function AdminOverview() {
  useSEO({ title: 'Overview', siteName: SITE });
  const { data: rawStats, isLoading: loading } = useAdminStats();
  // Backend doesn't return `totalEnrollments`; the stat card defaults it to 0.
  const stats = { ...FALLBACK, ...rawStats, totalEnrollments: 0 };

  const statCards = [
    {
      label: 'Total users', value: stats.totalUsers,
      sub: `+${stats.newUsersThisMonth} this month`,
      icon: Users, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950', link: '/admin/users',
    },
    {
      label: 'Live Sessions', value: stats.totalEnrollments || 0,
      sub: 'scheduled sessions',
      icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950', link: '/admin/live-sessions',
    },
    {
      label: 'Blog posts', value: stats.totalBlogs,
      sub: `${stats.publishedBlogs} published`,
      icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950', link: '/admin/blogs',
    },
    {
      label: 'Revenue (USD)', value: `$${stats.revenue.toLocaleString()}`,
      sub: 'from succeeded payments',
      icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950', link: '/admin/payments',
    },
    {
      label: 'Pending reviews', value: stats.pendingAssignments,
      sub: 'assignments awaiting review',
      icon: ClipboardList, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950', link: '/admin/assignments',
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Overview</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Platform summary as of today</p>
      </div>

      {/* Stats grid, 6 cards in 2 rows */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map(({ label, value, sub, icon: Icon, color, bg, link }) => (
          <Link key={label} to={link}
            className="group bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 hover:border-teal-100 dark:hover:border-teal-800 hover:shadow-md transition-all">
            <div className={`inline-flex p-2.5 rounded-xl ${bg} mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className={`text-2xl font-bold text-gray-900 dark:text-white transition-opacity ${loading ? 'opacity-30' : ''}`}>
              {loading ? '-' : value}
            </p>
            <div className="flex items-center justify-between mt-1">
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400">{label}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{sub}</p>
              </div>
              <ArrowRight size={14} className="text-gray-300 dark:text-slate-600 group-hover:text-teal-500 transition-colors shrink-0" />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent activity */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Activity size={18} className="text-teal-600" />
            <h2 className="font-bold text-gray-900 dark:text-white">Recent activity</h2>
          </div>
          <p className="text-sm text-gray-400 dark:text-slate-500">Activity feed will appear here once the platform is live.</p>
        </div>

        {/* Quick actions */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={18} className="text-teal-600" />
            <h2 className="font-bold text-gray-900 dark:text-white">Quick actions</h2>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Schedule a live session', to: '/admin/live-sessions', icon: GraduationCap, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950' },
              { label: 'Review pending assignments', to: '/admin/assignments', icon: ClipboardList, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950' },
              { label: 'Write a blog post', to: '/admin/blogs', icon: FileText, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950' },
              { label: 'Manage users & roles', to: '/admin/users', icon: Users, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950' },
              { label: 'View payment history', to: '/admin/payments', icon: CreditCard, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950' },
            ].map(({ label, to, icon: Icon, color }) => (
              <Link key={to} to={to}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group">
                <div className={`p-2 rounded-lg ${color}`}>
                  <Icon size={16} />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors flex-1">
                  {label}
                </span>
                <ArrowRight size={14} className="text-gray-300 dark:text-slate-600 group-hover:text-teal-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
