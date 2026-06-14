import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, ArrowRight, Video, Calendar, CheckCircle2, ClipboardList, Gift, Copy, Check,
} from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/auth.store';
import { useMyPaymentPlans } from '../../services/queries';
import NextPaymentBanner, { pickMostUrgentPlan } from '../../components/payments/NextPaymentBanner';
import { formatDate } from './_utils';
import type { UpcomingSession, MyAssignment } from './_utils';

export default function Overview() {
  const user = useAuthStore((s) => s.user);
  const [sessions, setSessions] = useState<UpcomingSession[]>([]);
  const [assignments, setAssignments] = useState<MyAssignment[]>([]);
  const [copied, setCopied] = useState(false);
  const { data: plans } = useMyPaymentPlans();
  const urgentPlan = pickMostUrgentPlan(plans);

  useEffect(() => {
    api.get('/live-sessions?upcoming=true')
      .then(({ data }) => setSessions(Array.isArray(data?.data) ? data.data : []))
      .catch(() => setSessions([]));
    api.get('/assignments/my')
      .then(({ data }) => {
        const list = data?.data?.assignments ?? data?.data ?? [];
        setAssignments(Array.isArray(list) ? list : []);
      })
      .catch(() => setAssignments([]));
  }, []);

  if (!user) return null;

  const stats = [
    { label: 'Upcoming Sessions', value: String(sessions.length), icon: Calendar, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950' },
    { label: 'Assignments', value: String(assignments.length), icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950' },
    { label: 'Reviewed', value: String(assignments.filter((a) => a.status === 'reviewed').length), icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950' },
    { label: 'Points', value: String(user.points ?? 0), icon: Gift, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
  ];

  const referralLink = `${window.location.origin}/register?ref=${user.referralCode || user.id}`;

  return (
    <div>
      {/* Installment-plan reminder (auto-hides when there's nothing urgent) */}
      {urgentPlan && <NextPaymentBanner plan={urgentPlan} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user.name.split(' ')[0]}
          </h1>
          <p className="text-gray-500 text-sm mt-1 capitalize dark:text-slate-400">{user.role} account</p>
        </div>
        <button aria-label="Notifications"
          className="relative p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 transition-colors">
          <Bell size={20} className="text-gray-500 dark:text-slate-400" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm">
            <div className={`inline-flex p-2.5 rounded-xl ${bg} mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming sessions */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900 dark:text-white">Upcoming sessions</h2>
            <Link to="/dashboard/schedule" className="text-sm text-teal-600 hover:text-teal-800 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar size={40} className="text-gray-200 dark:text-slate-700 mb-3" />
              <p className="font-medium text-gray-500 dark:text-slate-400">No upcoming sessions</p>
              <p className="text-sm text-gray-400 dark:text-slate-500 mb-4">Your scheduled live classes will appear here</p>
              <Link to="/pricing" className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">
                View programs
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.slice(0, 4).map((s) => (
                <div key={s._id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                  <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900 rounded-xl flex items-center justify-center shrink-0">
                    <Video size={18} className="text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">{s.title}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{s.instructor} Â· {formatDate(s.scheduledAt)}</p>
                  </div>
                  <a href={s.meetingUrl || `/classroom/${s.roomId}`}
                    className="px-3 py-1.5 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-colors shrink-0">
                    Join
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Announcements */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4">Announcements</h2>
            <div className="space-y-3">
              <div className="p-3 bg-teal-50 dark:bg-teal-950 rounded-xl border border-teal-100 dark:border-teal-800">
                <p className="text-xs font-medium text-teal-700 dark:text-teal-300 mb-1">New cohort opening</p>
                <p className="text-sm text-gray-600 dark:text-slate-400">Frontend Development cohort starts soon.</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-xl border border-amber-100 dark:border-amber-800">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Platform update</p>
                <p className="text-sm text-gray-600 dark:text-slate-400">New classroom features and scheduling tools are now live.</p>
              </div>
            </div>
          </div>

          {/* Referral */}
          <div className="bg-linear-to-br from-teal-600 to-emerald-700 rounded-2xl shadow-sm p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Gift size={18} />
              <h2 className="font-bold">Refer a friend</h2>
            </div>
            <p className="text-teal-100 text-sm mb-3">
              Earn <span className="font-bold text-white">50 points (â‚¦5,000 discount)</span> for every friend who signs up and enrols.
            </p>
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
              <input
                readOnly
                value={referralLink}
                className="flex-1 bg-transparent text-sm text-white outline-none truncate"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(referralLink);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="Copy link"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <p className="text-[11px] text-teal-200 mt-2">
              {copied ? 'Copied!' : 'Share via WhatsApp, email, or social media'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
