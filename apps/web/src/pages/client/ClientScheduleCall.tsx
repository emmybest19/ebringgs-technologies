import { Navigate } from 'react-router-dom';
import {
  Calendar, Clock, Sparkles, ShieldCheck, Video, MessageSquare, Phone, Zap,
} from 'lucide-react';
import CalendlyInline from '../../components/calendly/CalendlyInline';
import { useAuthStore } from '@ebringgs/auth';

const reasonsToBook = [
  {
    icon: Sparkles,
    title: 'Scope your project together',
    body: 'Walk through what you want to build and we will help you pick the right tier or scope a custom engagement.',
    accent: 'from-teal-500/20 to-emerald-500/20',
  },
  {
    icon: Zap,
    title: 'Move faster than email',
    body: '20 minutes on a call usually replaces a week of back-and-forth threads. Same outcome, far less waiting.',
    accent: 'from-amber-500/20 to-orange-500/20',
  },
  {
    icon: ShieldCheck,
    title: 'Zero commitment',
    body: 'No sales pressure. If we are not the right fit, we will tell you and recommend someone who is.',
    accent: 'from-purple-500/20 to-pink-500/20',
  },
];

const trustStrip = [
  { icon: Clock, label: 'Average call', value: '20 min' },
  { icon: Video, label: 'Format', value: 'Video or audio' },
  { icon: MessageSquare, label: 'Response', value: 'Same day' },
  { icon: Phone, label: 'Cost', value: 'Free' },
];

export default function ClientScheduleCall() {
  const calendlyUrl = import.meta.env.VITE_CALENDLY_URL as string | undefined;
  const { user } = useAuthStore();

  if (!calendlyUrl) {
    // Feature not configured — quietly bounce back to the overview.
    return <Navigate to="/client" replace />;
  }

  return (
    <div className="space-y-10">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-teal-950 to-cyan-950 text-white p-8 sm:p-12">
        {/* Decorative glow blobs */}
        <div className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2314b8a6' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-300 bg-teal-500/10 border border-teal-400/20 rounded-full px-3 py-1.5 mb-5">
            <Calendar size={13} /> Book a Call
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
            Pick a time that works for you.
            <br />
            <span className="bg-linear-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">
              We'll handle the rest.
            </span>
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-6 max-w-2xl">
            A short, no-pressure call with the E-Bringgs team — to scope your project,
            answer questions, or just figure out what you actually need. Pick any open slot below.
          </p>

          {/* Trust strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
            {trustStrip.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 flex items-center gap-2.5"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-teal-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    {label}
                  </p>
                  <p className="text-sm font-bold text-white truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reasons to book ──────────────────────────────────────────────── */}
      <section className="grid sm:grid-cols-3 gap-4">
        {reasonsToBook.map(({ icon: Icon, title, body, accent }) => (
          <div
            key={title}
            className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-md hover:border-teal-200 dark:hover:border-teal-800 transition-all overflow-hidden"
          >
            <div
              className={`absolute -top-12 -right-12 w-32 h-32 bg-linear-to-br ${accent} rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity`}
            />
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center mb-4">
                <Icon size={20} className="text-teal-600 dark:text-teal-400" />
              </div>
              <p className="font-bold text-gray-900 dark:text-white mb-1.5">{title}</p>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Inline scheduler ─────────────────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Choose a time</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              All times shown in your local timezone.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Available slots load live
          </div>
        </div>

        <CalendlyInline
          url={calendlyUrl}
          prefill={{ name: user?.name, email: user?.email }}
          utm={{ utmSource: 'client-dashboard', utmCampaign: 'schedule-call' }}
          height={760}
        />
      </section>

      {/* ── Aftercare strip ─────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900 flex items-center justify-center shrink-0">
          <MessageSquare size={22} className="text-teal-700 dark:text-teal-300" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 dark:text-white">Prefer to message first?</p>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            If you're not ready for a call, drop us a note through the project messaging or contact form — we reply within one business day.
          </p>
        </div>
      </section>
    </div>
  );
}
