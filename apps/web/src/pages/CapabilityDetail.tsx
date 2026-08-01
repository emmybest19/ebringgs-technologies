import { Link, Navigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, CheckCircle2, GraduationCap, Briefcase,
} from 'lucide-react';
import { useSEO, schema } from '@ebringgs/ui';
import { capabilities, getCapability, type CapabilityTrack } from '../data/capabilities';

export default function CapabilityDetail() {
  const { slug = '' } = useParams<{ slug: string }>();
  const capability = getCapability(slug);

  const capUrl = `https://ebringgs.com/services/${slug}`;
  useSEO({
    title: capability?.title ?? 'Services',
    description: capability?.intro,
    keywords: capability?.techStack,
    url: capUrl,
    image: 'https://ebringgs.com/logo-full.jpg',
    imageAlt: capability?.title,
    jsonLd: capability
      ? [
          schema.service({
            name: capability.title,
            description: capability.intro,
            url: capUrl,
            serviceType: capability.title,
          }),
          schema.breadcrumb([
            { name: 'Home', url: 'https://ebringgs.com/' },
            { name: 'Services', url: 'https://ebringgs.com/services' },
            { name: capability.title, url: capUrl },
          ]),
        ]
      : undefined,
  });

  if (!capability) return <Navigate to="/" replace />;

  const { title, intro, icon: Icon, heroGradient, img, techStack, student, client } = capability;

  // "Other capabilities" cross-sell at the bottom
  const others = capabilities.filter((c) => c.slug !== slug);

  return (
    <div className="bg-white dark:bg-slate-900">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className={`relative overflow-hidden bg-linear-to-br ${heroGradient} text-white`}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23fff%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-8 transition-colors"
          >
            <ArrowLeft size={16} /> Back to home
          </Link>

          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-xs font-medium mb-5">
                <Icon size={14} /> What we do
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-5">{title}</h1>
              <p className="text-white/85 text-lg leading-relaxed max-w-xl">{intro}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#students"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-gray-900 text-sm font-semibold hover:bg-gray-100 transition-colors"
                >
                  <GraduationCap size={16} /> I want to learn it
                </a>
                <a
                  href="#clients"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/15 backdrop-blur text-white text-sm font-semibold hover:bg-white/25 transition-colors"
                >
                  <Briefcase size={16} /> I want it built for me
                </a>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="aspect-4/3 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/20">
                <img loading="lazy" src={img} alt={title} className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Two-track section ─────────────────────────────────────────── */}
      <section className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Two ways to engage with us
            </h2>
            <p className="text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
              Pick the path that fits where you are right now.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <TrackCard
              id="students"
              track={student}
              accent="teal"
              audienceIcon={<GraduationCap size={22} />}
              audience="Students"
              techStack={techStack}
            />
            <TrackCard
              id="clients"
              track={client}
              accent="slate"
              audienceIcon={<Briefcase size={22} />}
              audience="Clients"
            />
          </div>
        </div>
      </section>

      {/* ── Cross-sell other capabilities ─────────────────────────────── */}
      <section className="py-16 bg-gray-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Explore what else we do
          </h3>
          <div className="grid sm:grid-cols-3 gap-5">
            {others.map((c) => {
              const OtherIcon = c.icon;
              return (
                <Link
                  key={c.slug}
                  to={`/services/${c.slug}`}
                  className="group flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:border-teal-300 hover:shadow-md transition-all"
                >
                  <div className={`p-2.5 rounded-xl ${c.bg} ${c.color} shrink-0`}>
                    <OtherIcon size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-teal-600 transition-colors">
                      {c.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">{c.tagline}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

interface TrackCardProps {
  id: string;
  track: CapabilityTrack;
  accent: 'teal' | 'slate';
  audienceIcon: React.ReactNode;
  audience: string;
  /** Tech the student will learn. Only rendered when present (student card only). */
  techStack?: string[];
}

function TrackCard({ id, track, accent, audienceIcon, audience, techStack }: TrackCardProps) {
  const styles = accent === 'teal'
    ? {
        border: 'border-teal-200 dark:border-teal-900',
        chip: 'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300',
        cta: 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/25',
        checkmark: 'text-teal-600',
      }
    : {
        border: 'border-gray-200 dark:border-slate-700',
        chip: 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300',
        cta: 'bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white shadow-lg shadow-gray-500/25',
        checkmark: 'text-gray-700 dark:text-slate-300',
      };

  return (
    <div
      id={id}
      className={`scroll-mt-24 rounded-3xl border-2 ${styles.border} bg-white dark:bg-slate-900 p-8 lg:p-10 flex flex-col`}
    >
      <div className={`inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full text-xs font-medium ${styles.chip} mb-5`}>
        {audienceIcon} {audience}
      </div>
      <p className="text-xs font-semibold tracking-wide uppercase text-gray-400 dark:text-slate-500 mb-2">
        {track.kicker}
      </p>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white leading-snug mb-6">
        {track.promise}
      </h3>

      <ul className="space-y-3 mb-6 flex-1">
        {track.bullets.map((b) => (
          <li key={b} className="flex items-start gap-3">
            <CheckCircle2 size={18} className={`shrink-0 mt-0.5 ${styles.checkmark}`} />
            <span className="text-gray-700 dark:text-slate-300 text-sm leading-relaxed">{b}</span>
          </li>
        ))}
      </ul>

      {techStack && techStack.length > 0 && (
        <div className="mb-8 pt-6 border-t border-gray-100 dark:border-slate-800">
          <p className="text-[11px] font-semibold tracking-wider uppercase text-gray-400 dark:text-slate-500 mb-3">
            Tech you'll learn
          </p>
          <div className="flex flex-wrap gap-2">
            {techStack.map((t) => (
              <span
                key={t}
                className="px-2.5 py-1 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-medium border border-teal-100 dark:border-teal-900"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      <Link
        to={track.ctaHref}
        className={`inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 ${styles.cta}`}
      >
        {track.ctaLabel} <ArrowRight size={16} />
      </Link>
      <Link
        to="/pricing"
        className="mt-3 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 dark:text-slate-400 hover:text-teal-600 transition-colors"
      >
        See pricing details <ArrowRight size={12} />
      </Link>
    </div>
  );
}
