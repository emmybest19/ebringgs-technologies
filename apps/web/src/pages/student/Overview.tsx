import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Video, Calendar, CheckCircle2, ClipboardList, Gift, Copy, Check,
  Link2, MessageCircle, Trophy, Loader2, Rocket, Clock, Award,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@ebringgs/api';
import { useAuthStore } from '@ebringgs/auth';
import { useMyPaymentPlans } from '../../services/queries';
import NextPaymentBanner, { pickMostUrgentPlan } from '../../components/payments/NextPaymentBanner';
import { formatDate } from './_utils';
import type { UpcomingSession, MyAssignment } from './_utils';

export default function Overview() {
  const user = useAuthStore((s) => s.user);
  const [sessions, setSessions] = useState<UpcomingSession[]>([]);
  const [assignments, setAssignments] = useState<MyAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: plans } = useMyPaymentPlans();
  const urgentPlan = pickMostUrgentPlan(plans);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      api.get('/live-sessions?upcoming=true').then(({ data }) =>
        Array.isArray(data?.data) ? data.data as UpcomingSession[] : [],
      ),
      api.get('/assignments/my').then(({ data }) => {
        const list = data?.data?.assignments ?? data?.data ?? [];
        return Array.isArray(list) ? list as MyAssignment[] : [];
      }),
    ]).then(([s, a]) => {
      if (!active) return;
      setSessions(s.status === 'fulfilled' ? s.value : []);
      setAssignments(a.status === 'fulfilled' ? a.value : []);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-cyan-600" />
      </div>
    );
  }

  const reviewedCount = assignments.filter((a) => a.status === 'reviewed').length;

  return (
    <div>
      {/* Surface the most-urgent installment plan (if any). Auto-hides for
          paid-in-full / future-due plans, see pickMostUrgentPlan rules. */}
      {urgentPlan && <NextPaymentBanner plan={urgentPlan} />}

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        Welcome back, {user.name.split(' ')[0]}
      </h1>
      <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
        Here's what's happening with your learning.
      </p>

      <CohortCountdown />

      <ReferralCard />

      {/* Stats — icon-beside-text, matches the client overview pattern */}
      <div className="reveal grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={Calendar}
          iconColor="text-cyan-600"
          iconBg="bg-cyan-50 dark:bg-cyan-950"
          value={sessions.length}
          label="Upcoming sessions"
        />
        <StatCard
          icon={ClipboardList}
          iconColor="text-amber-600"
          iconBg="bg-amber-50 dark:bg-amber-950"
          value={assignments.length}
          label={`Assignments · ${reviewedCount} reviewed`}
        />
        <StatCard
          icon={Trophy}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50 dark:bg-emerald-950"
          value={user.points ?? 0}
          label={`Points · worth ₦${((user.points ?? 0) * 100).toLocaleString()}`}
        />
      </div>

      {/* Upcoming sessions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Upcoming sessions</h2>
          <Link to="/dashboard/schedule" className="text-sm text-cyan-600 hover:text-cyan-800 font-medium">
            View all
          </Link>
        </div>
        {sessions.length === 0 ? (
          <div className="bg-white dark:bg-[#0e141c] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-10 text-center">
            <Calendar size={36} className="text-gray-200 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-slate-400 text-sm">No upcoming sessions.</p>
            <Link to="/pricing" className="inline-block mt-3 text-sm text-cyan-600 hover:underline font-medium">
              Browse programs
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.slice(0, 5).map((s) => (
              <div
                key={s._id}
                className="flex items-center gap-4 bg-white dark:bg-[#0e141c] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-4 hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950 flex items-center justify-center shrink-0">
                  <Video size={18} className="text-cyan-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">{s.title}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    {s.instructor} · {formatDate(s.scheduledAt)}
                  </p>
                </div>
                <a
                  href={s.meetingUrl || `/classroom/${s.roomId}`}
                  className="shrink-0 px-3 py-1.5 bg-cyan-700 text-white text-xs font-semibold rounded-lg hover:bg-cyan-800 transition-colors"
                >
                  Join
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Earned certificates — only renders if the student has any */}
      <CertificatesSection />

      {/* Recent assignments */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent assignments</h2>
          <Link to="/dashboard/assignments" className="text-sm text-cyan-600 hover:text-cyan-800 font-medium">
            View all
          </Link>
        </div>
        {assignments.length === 0 ? (
          <div className="bg-white dark:bg-[#0e141c] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-10 text-center">
            <ClipboardList size={36} className="text-gray-200 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-slate-400 text-sm">No assignments yet.</p>
          </div>
        ) : (
          <div className="reveal bg-white dark:bg-[#0e141c] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-[#080c11] text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left">Title</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left hidden sm:table-cell">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {assignments.slice(0, 5).map((a) => (
                  <tr key={a._id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                    <td className="px-5 py-3 text-gray-900 dark:text-white">{a.title}</td>
                    <td className="px-5 py-3">
                      <AssignmentStatusBadge status={a.status} />
                    </td>
                    <td className="px-5 py-3 text-gray-400 dark:text-slate-500 hidden sm:table-cell">
                      {a.submittedAt ? formatDate(a.submittedAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Sub-components (extracted for readability) ───────────────────────── */

function StatCard({
  icon: Icon, iconColor, iconBg, value, label,
}: {
  icon: typeof Calendar;
  iconColor: string;
  iconBg: string;
  value: number | string;
  label: string;
}) {
  return (
    <div className="bg-white dark:bg-[#0e141c] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center`}>
        <Icon size={20} className={iconColor} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{value}</p>
        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{label}</p>
      </div>
    </div>
  );
}

function AssignmentStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'reviewed':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 dark:text-green-400">
          <CheckCircle2 size={12} className="text-green-500" /> Reviewed
        </span>
      );
    case 'submitted':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-400">
          <CheckCircle2 size={12} className="text-blue-500" /> Submitted
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
          Pending
        </span>
      );
    default:
      return <span className="text-xs text-gray-500 dark:text-slate-400 capitalize">{status}</span>;
  }
}

/**
 * Refer & earn card — student version of the client's ReferralCard. Same
 * restrained palette as the rest of the overview: white surface, hairline
 * border, small teal icon tile, code rendered as a dashed-border stamp,
 * three share actions (copy code, copy link, WhatsApp). Renders nothing if
 * the user hasn't loaded yet or has no referral code.
 */
function ReferralCard() {
  const user = useAuthStore((s) => s.user);
  const [copied, setCopied] = useState(false);

  if (!user?.referralCode) return null;

  const referralCode = user.referralCode;
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `Join me on E-Bringgs and learn to ship real products. Sign up with my code ${referralCode} → ${referralLink}`,
  )}`;

  const copyTo = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy. Long-press to copy manually.');
    }
  };

  return (
    <div className="bg-white dark:bg-[#0e141c] rounded-2xl border border-gray-200 dark:border-slate-800 p-5 mb-6">
      {/* Header row — icon, title, right-aligned reward pill */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-cyan-50 dark:bg-cyan-950 flex items-center justify-center shrink-0">
            <Gift size={13} className="text-cyan-700 dark:text-cyan-400" />
          </div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Refer &amp; earn</h2>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-700 dark:text-cyan-400 tabular-nums">
          50 pts / friend
        </span>
      </div>
      <p className="text-xs text-gray-500 dark:text-slate-400 ml-9 mb-4">
        Every friend who enrols earns you{' '}
        <span className="font-semibold text-cyan-700 dark:text-cyan-400">50 points</span>{' '}
        (worth <span className="font-semibold text-cyan-700 dark:text-cyan-400">₦5,000</span>{' '}
        off your next purchase).
      </p>

      <div className="grid md:grid-cols-[1fr_auto] gap-3 items-stretch">
        {/* The code itself — stamp-style, prominent */}
        <div className="px-3 py-3 rounded-lg bg-gray-50 dark:bg-[#080c11] border border-dashed border-gray-300 dark:border-slate-700 text-center">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-slate-500 font-semibold mb-0.5">
            Your code
          </p>
          <code className="text-lg font-bold font-mono tracking-[0.2em] text-gray-900 dark:text-white">
            {referralCode}
          </code>
        </div>

        {/* Three quick share actions */}
        <div className="grid grid-cols-3 md:flex md:items-stretch gap-2">
          <button
            type="button"
            onClick={() => copyTo(referralCode, 'Code')}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-xs font-medium text-gray-700 dark:text-slate-300 hover:border-cyan-300 dark:hover:border-cyan-700 hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            Code
          </button>
          <button
            type="button"
            onClick={() => copyTo(referralLink, 'Link')}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-xs font-medium text-gray-700 dark:text-slate-300 hover:border-cyan-300 dark:hover:border-cyan-700 hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors"
          >
            <Link2 size={13} />
            Link
          </button>
          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-semibold transition-colors"
          >
            <MessageCircle size={13} />
            Share
          </a>
        </div>
      </div>

      <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-3">
        <ArrowRight size={10} className="inline -translate-y-px" /> Tracked automatically when they enrol.
      </p>
    </div>
  );
}

/* ─── Cohort countdown ─────────────────────────────────────────────────── */

interface CohortNextResponse {
  cohort: {
    title?: string;
    startDate: string;
    endDate?: string;
    durationLabel?: string;
    planId?: string;
  } | null;
  eligible: boolean;
  isPlaceholder?: boolean;
}

function diffParts(target: number, now: number) {
  const ms = Math.max(0, target - now);
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  return { ms, days, hours, minutes, seconds };
}

/**
 * Live countdown to the student's next cohort start. Hidden entirely for
 * students who haven't bought a cohort plan, so the rest of the dashboard
 * stays clean for service-only / non-training users. Once the cohort
 * starts, swaps into an "in progress" mode rather than going negative.
 */
function CohortCountdown() {
  const [data, setData] = useState<CohortNextResponse | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    api
      .get('/cohorts/my-next')
      .then((res) => {
        if (!active) return;
        setData(res.data?.data ?? null);
      })
      .catch(() => {
        if (!active) return;
        setData({ cohort: null, eligible: false });
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!data?.eligible || !data.cohort) return null;

  const target = new Date(data.cohort.startDate).getTime();
  const inProgress = now >= target;
  const { days, hours, minutes, seconds } = diffParts(target, now);

  const startLabel = new Date(data.cohort.startDate).toLocaleDateString('en-NG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="relative overflow-hidden bg-white dark:bg-[#0e141c] rounded-2xl border border-gray-200 dark:border-slate-800 p-5 sm:p-6 mb-6">
      {/* Subtle teal corner accent — keeps the "quiet brand" feel */}
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-cyan-500/5 dark:bg-cyan-400/5 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-md bg-cyan-50 dark:bg-cyan-950 flex items-center justify-center shrink-0">
              <Rocket size={13} className="text-cyan-700 dark:text-cyan-400" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {inProgress ? 'Your cohort is live' : 'Your cohort starts in'}
            </h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 ml-9 line-clamp-1">
            {data.cohort.title || 'Your cohort'}
            {data.cohort.durationLabel ? ` · ${data.cohort.durationLabel}` : ''}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 ml-9 mt-1 flex items-center gap-1.5">
            <Clock size={11} />
            {inProgress ? 'Started' : 'Starts'} {startLabel}
            {data.isPlaceholder && !inProgress && (
              <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950">
                Tentative
              </span>
            )}
          </p>
        </div>

        {!inProgress ? (
          <div className="grid grid-cols-4 gap-2 sm:gap-3 shrink-0">
            <TimePart value={days} label="Days" />
            <TimePart value={hours} label="Hours" />
            <TimePart value={minutes} label="Minutes" />
            <TimePart value={seconds} label="Seconds" />
          </div>
        ) : (
          <div className="shrink-0">
            <Link
              to="/dashboard/schedule"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-semibold transition-colors"
            >
              Open schedule <ArrowRight size={12} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Earned certificates ──────────────────────────────────────────────── */

interface EarnedCertificate {
  _id: string;
  certificateId: string;
  program: string;
  completedAt: string;
  isValid: boolean;
}

/**
 * Renders nothing until certs load, then renders nothing if the student has
 * none. Once they earn one, it surfaces as a small horizontal stack of cards
 * with a deep-link straight into the printable certificate page.
 */
function CertificatesSection() {
  const [certs, setCerts] = useState<EarnedCertificate[] | null>(null);

  useEffect(() => {
    let active = true;
    api.get('/certificates/my')
      .then(({ data }) => {
        if (!active) return;
        const list = data?.data?.certificates ?? [];
        setCerts(Array.isArray(list) ? list : []);
      })
      .catch(() => { if (active) setCerts([]); });
    return () => { active = false; };
  }, []);

  if (!certs || certs.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Your certificates</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {certs.map((c) => (
          <Link
            key={c._id}
            to={`/certificate/${c.certificateId}`}
            className={`flex items-center gap-4 bg-white dark:bg-[#0e141c] rounded-2xl border shadow-sm p-4 transition-colors ${
              c.isValid
                ? 'border-gray-100 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700'
                : 'border-red-100 dark:border-red-900 opacity-60'
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center shrink-0">
              <Award size={20} className="text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">
                {c.program}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 font-mono">
                {c.certificateId} · {formatDate(c.completedAt)}
              </p>
              {!c.isValid && (
                <p className="text-[10px] uppercase tracking-wider font-bold text-red-600 dark:text-red-400 mt-1">
                  Revoked
                </p>
              )}
            </div>
            <ArrowRight size={16} className="text-gray-400 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function TimePart({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="px-2 sm:px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#080c11] border border-gray-200 dark:border-slate-800">
        <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-gray-900 dark:text-white leading-none">
          {String(value).padStart(2, '0')}
        </p>
      </div>
      <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-gray-400 dark:text-slate-500 font-semibold mt-1">
        {label}
      </p>
    </div>
  );
}
