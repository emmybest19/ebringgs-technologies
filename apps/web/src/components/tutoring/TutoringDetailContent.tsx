import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, ShoppingCart, ShieldCheck,
  Code2, BarChart3, BookOpen, Layers, Smartphone, Palette, Server, Briefcase,
  Loader2, GraduationCap, UserCheck, Calendar, Users, Target, Sparkles,
} from 'lucide-react';
import { useTutoringTrack } from '../../services/queries';

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  code: Code2,
  server: Server,
  layers: Layers,
  smartphone: Smartphone,
  'bar-chart': BarChart3,
  'book-open': BookOpen,
  palette: Palette,
  briefcase: Briefcase,
};

function formatNGN(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency', currency: 'NGN', maximumFractionDigits: 0,
  }).format(amount);
}

interface Props {
  trackId: string | undefined;
  backHref: string;
  backLabel?: string;
  embedded?: boolean;
}

export default function TutoringDetailContent({
  trackId, backHref, backLabel = 'Back', embedded = false,
}: Props) {
  const navigate = useNavigate();
  const { data: track, isLoading, isError } = useTutoringTrack(trackId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-teal-600" />
      </div>
    );
  }

  if (isError || !track) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-12 text-center">
        <p className="text-gray-500 dark:text-slate-400 mb-4">
          We couldn't find that tutoring track.
        </p>
        <Link to={backHref} className="text-sm font-semibold text-teal-700 hover:text-teal-800">
          {backLabel}
        </Link>
      </div>
    );
  }

  const Icon = iconMap[track.icon] || Code2;
  const TierIcon = track.tier === 'cohort' ? GraduationCap : UserCheck;
  const tierLabel = track.tier === 'cohort' ? 'Cohort' : '1-on-1 Mentorship';

  return (
    <div className={embedded ? '' : 'max-w-5xl mx-auto px-4 sm:px-6 py-8'}>
      {/* Back link */}
      <Link
        to={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-400 mb-6"
      >
        <ArrowLeft size={14} /> {backLabel}
      </Link>

      {/* Hero */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 sm:p-8 mb-6">
        <div className="flex flex-wrap items-start gap-4 mb-4">
          <div className="w-14 h-14 bg-teal-50 dark:bg-teal-950 rounded-xl flex items-center justify-center shrink-0">
            <Icon size={24} className="text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-medium text-teal-700 dark:text-teal-400">{track.category}</span>
              {track.subTrack && (
                <span className="text-xs text-gray-400 dark:text-slate-500">· {track.subTrack}</span>
              )}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                track.tier === 'cohort'
                  ? 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
              }`}>
                <TierIcon size={11} />
                {tierLabel}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{track.title}</h1>
          </div>
        </div>

        <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-6">{track.summary}</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <FactPill icon={Calendar} label="Duration" value={track.durationLabel} />
          <FactPill icon={Clock} label="Per week" value={track.weeklyCommitment} />
          <FactPill icon={Users} label="Class size" value={track.classSize} />
          <FactPill icon={Sparkles} label="Format" value={track.format} />
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4 pt-4 border-t border-gray-100 dark:border-slate-800">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500 font-semibold">Tuition</p>
            <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
              {formatNGN(track.priceNgn)}
            </p>
            {track.installmentEligible && (
              <p className="text-xs text-teal-700 dark:text-teal-400 font-semibold mt-0.5">
                Pay in 2× or 3× installments at checkout
              </p>
            )}
          </div>
          <button
            onClick={() => navigate(`/checkout?type=plan&id=${track.id}`)}
            className="px-5 py-3 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
          >
            <ShoppingCart size={16} /> Enrol now
          </button>
        </div>
      </div>

      {/* Outcomes */}
      <Section icon={Target} title="What you'll be able to do by the end">
        <ul className="space-y-2">
          {track.outcomes.map((o, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-slate-300">
              <CheckCircle2 size={16} className="text-teal-600 shrink-0 mt-0.5" />
              <span>{o}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Syllabus */}
      <Section icon={BookOpen} title="Syllabus">
        <div className="space-y-4">
          {track.syllabus.map((m, i) => (
            <div key={i} className="border-l-2 border-teal-200 dark:border-teal-800 pl-4">
              <p className="text-xs uppercase tracking-wide text-teal-700 dark:text-teal-400 font-semibold mb-0.5">
                {m.week}
              </p>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">{m.title}</h4>
              <ul className="text-sm text-gray-600 dark:text-slate-400 space-y-0.5">
                {m.topics.map((t, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <span className="text-gray-300 dark:text-slate-600 mt-0.5">·</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* Projects */}
      <Section icon={Sparkles} title="What you'll build">
        <ul className="space-y-2">
          {track.projects.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-slate-300">
              <span className="text-teal-600 mt-0.5">→</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Prerequisites */}
      <Section icon={Users} title="Who this is for">
        <ul className="space-y-2">
          {track.prerequisites.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-slate-300">
              <CheckCircle2 size={16} className="text-gray-300 dark:text-slate-600 shrink-0 mt-0.5" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Included / not included */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
            <CheckCircle2 size={16} className="text-teal-600" />
            What's included
          </h3>
          <ul className="space-y-1.5">
            {track.whatsIncluded.map((item, i) => (
              <li key={i} className="text-sm text-gray-600 dark:text-slate-400 flex items-start gap-2">
                <span className="text-teal-600 mt-0.5">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        {track.whatsNotIncluded && track.whatsNotIncluded.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
              <XCircle size={16} className="text-gray-400" />
              Not included
            </h3>
            <ul className="space-y-1.5">
              {track.whatsNotIncluded.map((item, i) => (
                <li key={i} className="text-sm text-gray-600 dark:text-slate-400 flex items-start gap-2">
                  <span className="text-gray-300 dark:text-slate-600 mt-0.5">−</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* FAQ */}
      {track.faq && track.faq.length > 0 && (
        <Section icon={BookOpen} title="FAQ">
          <div className="space-y-4">
            {track.faq.map((f, i) => (
              <div key={i}>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{f.q}</p>
                <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Refund policy */}
      <div className="bg-gray-50 dark:bg-slate-950 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 mb-6">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5">
          <ShieldCheck size={16} className="text-teal-600" />
          Refund policy
        </h3>
        <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">{track.refundPolicy}</p>
      </div>

      {/* Sticky-ish bottom CTA */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">Ready to enrol?</p>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {formatNGN(track.priceNgn)} · {track.durationLabel} · {tierLabel.toLowerCase()}
          </p>
        </div>
        <button
          onClick={() => navigate(`/checkout?type=plan&id=${track.id}`)}
          className="px-5 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
        >
          <ShoppingCart size={14} /> Enrol now
        </button>
      </div>
    </div>
  );
}

/* ─── Local atoms ──────────────────────────────────────────────────── */

function FactPill({
  icon: Icon, label, value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-gray-400 dark:text-slate-500 font-semibold mb-0.5">
        <Icon size={11} />
        {label}
      </div>
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function Section({
  icon: Icon, title, children,
}: {
  icon: typeof Clock;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 sm:p-6 mb-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Icon size={18} className="text-teal-600" />
        {title}
      </h2>
      {children}
    </section>
  );
}
