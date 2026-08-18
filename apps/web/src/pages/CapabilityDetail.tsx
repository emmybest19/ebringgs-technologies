import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowRight, Check, GraduationCap, Briefcase } from 'lucide-react';
import { useSEO, schema } from '@ebringgs/ui';
import {
  capabilities, getCapability, getAccent,
  type CapabilityTrack, type DarkAccent,
} from '../data/capabilities';

/**
 * Per-capability detail page. Continues the accent the services index
 * introduced for this capability, so the colour on the card you clicked is
 * the colour of the page you land on.
 *
 * DARK ONLY, deliberately — colours are unconditional rather than `dark:`
 * variants, matching the services index and the landing page.
 */

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

  const { title, intro, icon: Icon, img, techStack, student, client } = capability;
  const accent = getAccent(slug);
  const others = capabilities.filter((c) => c.slug !== slug);

  return (
    <div className="bg-[#080c11]">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="no-reveal relative overflow-hidden">
        {/* Glow tinted to this capability's accent — the page's only nod to
            the old gradient hero. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(80% 60% at 12% 20%, ${accent.glow}, transparent 62%)` }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${accent.tile}`}>
                <Icon size={20} />
              </span>

              <h1 className="mt-7 text-4xl font-extrabold leading-[1.1] tracking-tight text-white md:text-5xl">
                {title}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400">{intro}</p>

              <div className="mt-9 flex flex-wrap gap-3">
                <a
                  href="#students"
                  className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300"
                >
                  <GraduationCap size={16} /> I want to learn it
                </a>
                <a
                  href="#clients"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-slate-600 hover:bg-white/5"
                >
                  <Briefcase size={16} /> I want it built for me
                </a>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0e141c] p-2">
                <img
                  loading="lazy"
                  src={img}
                  alt=""
                  aria-hidden="true"
                  className="aspect-4/3 w-full rounded-xl object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Two tracks ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Two ways to engage with us
          </h2>
          <p className="mt-4 text-sm text-slate-400">Pick the path that fits where you are right now.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <TrackCard
            id="students"
            track={student}
            accent={accent}
            highlight
            audienceIcon={<GraduationCap size={15} />}
            audience="Students"
            techStack={techStack}
          />
          <TrackCard
            id="clients"
            track={client}
            accent={accent}
            audienceIcon={<Briefcase size={15} />}
            audience="Clients"
          />
        </div>
      </section>

      {/* ── Cross-sell ────────────────────────────────────────────────── */}
      <section className="border-t border-white/[0.06] bg-[#0d1520] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-2xl font-extrabold tracking-tight text-white">
            Explore what else we do
          </h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {others.map((c) => {
              const OtherIcon = c.icon;
              const otherAccent = getAccent(c.slug);
              return (
                <Link
                  key={c.slug}
                  to={`/services/${c.slug}`}
                  className="group flex items-start gap-4 rounded-2xl border border-slate-800 bg-[#0e141c] p-5 transition-colors hover:border-slate-700"
                >
                  <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${otherAccent.tile}`}>
                    <OtherIcon size={18} />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-white">{c.title}</span>
                    <span className="mt-1 block line-clamp-2 text-xs leading-relaxed text-slate-400">
                      {c.tagline}
                    </span>
                  </span>
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
  accent: DarkAccent;
  /** The student track carries the capability's accent; the client track
   *  stays neutral so the two are visually distinguishable at a glance. */
  highlight?: boolean;
  audienceIcon: React.ReactNode;
  audience: string;
  /** Only rendered when present, i.e. the student card. */
  techStack?: string[];
}

function TrackCard({ id, track, accent, highlight, audienceIcon, audience, techStack }: TrackCardProps) {
  const chip = highlight
    ? `${accent.tile} border`
    : 'border border-slate-700 bg-slate-800/60 text-slate-300';
  const tick = highlight ? accent.text : 'text-slate-500';

  return (
    <div
      id={id}
      className="flex scroll-mt-28 flex-col rounded-2xl border border-slate-800 bg-[#0e141c] p-8 lg:p-10"
    >
      <span className={`inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-xs font-semibold ${chip}`}>
        {audienceIcon} {audience}
      </span>

      <p className="mt-6 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {track.kicker}
      </p>
      <h3 className="mt-2 text-xl font-bold leading-snug text-white">{track.promise}</h3>

      <ul className="mt-7 flex-1 space-y-3">
        {track.bullets.map((b) => (
          <li key={b} className="flex items-start gap-3">
            <Check size={15} strokeWidth={3} className={`mt-0.5 shrink-0 ${tick}`} />
            <span className="text-sm leading-relaxed text-slate-300">{b}</span>
          </li>
        ))}
      </ul>

      {techStack && techStack.length > 0 && (
        <div className="mt-8 border-t border-slate-800 pt-6">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Tech you'll learn
          </p>
          <div className="flex flex-wrap gap-2">
            {techStack.map((t) => (
              <span
                key={t}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium ${accent.tile}`}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      <Link
        to={track.ctaHref}
        className={`mt-8 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition-colors ${
          highlight
            ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
            : 'border border-slate-700 text-white hover:border-slate-600 hover:bg-white/5'
        }`}
      >
        {track.ctaLabel} <ArrowRight size={16} />
      </Link>
      <Link
        to="/pricing"
        className="mt-3 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-white"
      >
        See pricing details <ArrowRight size={12} />
      </Link>
    </div>
  );
}
