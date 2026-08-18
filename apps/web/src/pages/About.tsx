import { Link } from 'react-router-dom';
import { ArrowRight, Award, Eye, Heart, Users } from 'lucide-react';
import { useSEO, schema } from '@ebringgs/ui';

/**
 * About page.
 *
 * DARK ONLY, deliberately — colours are unconditional rather than `dark:`
 * variants, matching the landing and services pages.
 */

const values = [
  { icon: Award, title: 'Excellence', description: 'We hold ourselves to the highest standard in everything we deliver: code, design, or curriculum.' },
  { icon: Heart, title: 'Empowerment', description: 'We believe every person deserves access to world-class technology skills and opportunities.' },
  { icon: Users, title: 'Community', description: 'We build relationships, not just products. Our alumni and client network is our greatest asset.' },
  { icon: Eye, title: 'Transparency', description: 'Honest timelines, clear pricing, and open communication; no surprises, ever.' },
];

/** Small outlined pill used as a section eyebrow. */
function Eyebrow({ tone, children }: { tone: 'cyan' | 'amber'; children: React.ReactNode }) {
  const cls = tone === 'cyan'
    ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300'
    : 'border-amber-400/30 bg-amber-400/10 text-amber-300';
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${cls}`}>
      {children}
    </span>
  );
}

/** Dash + statement closing the mission and vision blocks. */
function Pull({ tone, children }: { tone: 'cyan' | 'amber'; children: React.ReactNode }) {
  return (
    <p className={`mt-8 flex items-center gap-3 text-sm font-semibold ${tone === 'cyan' ? 'text-cyan-400' : 'text-amber-400'}`}>
      <span className={`h-px w-7 shrink-0 ${tone === 'cyan' ? 'bg-cyan-400' : 'bg-amber-400'}`} />
      {children}
    </p>
  );
}

export default function About() {
  useSEO({
    title: 'About Us',
    description: 'Learn about E-Bringgs Technologies, our mission, and the values behind the platform.',
    keywords: ['about E-Bringgs', 'tech company Nigeria', 'software training Africa'],
    url: 'https://ebringgs.com/about',
    image: 'https://ebringgs.com/logo-full.jpg',
    imageAlt: 'About E-Bringgs Technologies',
    jsonLd: [
      schema.organization(),
      schema.breadcrumb([
        { name: 'Home', url: 'https://ebringgs.com/' },
        { name: 'About', url: 'https://ebringgs.com/about' },
      ]),
    ],
  });

  return (
    <div className="bg-[#080c11]">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="no-reveal relative overflow-hidden">
        {/* Abstract backdrop rather than a photo: two brand glows over a
            fading dot field. A stock photo here punched a bright hole in an
            otherwise dark page. */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_10%,rgba(34,211,238,0.10),transparent_65%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_50%_at_20%_90%,rgba(13,148,136,0.08),transparent_60%)]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(rgba(148,163,184,1) 1px, transparent 1px)',
            backgroundSize: '26px 26px',
            maskImage: 'radial-gradient(75% 65% at 50% 45%, #000 30%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(75% 65% at 50% 45%, #000 30%, transparent 100%)',
          }}
        />

        <div className="relative mx-auto max-w-3xl px-4 pb-28 pt-20 text-center sm:px-6">
          <Eyebrow tone="cyan">About our cohort &amp; mission</Eyebrow>

          <h1 className="mt-7 text-4xl font-extrabold leading-[1.1] tracking-tight text-white md:text-5xl">
            We&rsquo;re building Africa&rsquo;s premier{' '}
            <span className="text-cyan-400">tech platform</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400">
            ebringgs was founded on a simple insight: traditional education leaves gaps that
            real-world companies struggle with. We assemble elite cohorts, align them with industry
            leaders, and build meaningful tech solutions.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/about/team"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3.5 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300"
            >
              Meet the Team <ArrowRight size={16} />
            </Link>
            <a
              href="#values"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-[#0e141c] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:border-slate-600 hover:bg-[#141b26]"
            >
              Our Values
            </a>
          </div>
        </div>
      </section>

      {/* ── Mission ───────────────────────────────────────────────────── */}
      <section className="reveal-clip mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="reveal-left">
            <Eyebrow tone="amber">Our purpose</Eyebrow>
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Our mission
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-slate-400">
              To empower the next generation of builders by delivering rigorous, live instruction
              coupled with direct industry mentorship. We don&rsquo;t just teach code; we enable the
              launch of high-impact platforms and foster software intelligence that can power global
              platforms.
            </p>
            <Pull tone="cyan">Democratising access to premier tech education</Pull>
          </div>

          <div className="reveal-right overflow-hidden rounded-2xl border border-slate-800 bg-[#0e141c] p-2">
            <img
              loading="lazy"
              src="/images/about/mission.jpg"
              alt=""
              aria-hidden="true"
              className="h-64 w-full rounded-xl object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── Vision ────────────────────────────────────────────────────── */}
      <section className="reveal-clip mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="reveal-left order-2 overflow-hidden rounded-2xl border border-slate-800 bg-[#0e141c] p-2 md:order-1">
            <div className="relative overflow-hidden rounded-xl">
              <img
                loading="lazy"
                src="/images/about/office-space.jpg"
                alt=""
                aria-hidden="true"
                className="h-64 w-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/20 to-transparent" />
              <span className="absolute inset-x-0 bottom-4 text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300">
                Global connectivity
              </span>
            </div>
          </div>

          <div className="reveal-right order-1 md:order-2">
            <Eyebrow tone="cyan">Our horizon</Eyebrow>
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              Our vision
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-slate-400">
              A world where geography is no barrier to a world-class tech career or a well-built
              digital product. We believe the next generation of great software will be built by
              diverse, globally distributed teams.
            </p>
            <Pull tone="amber">Geography is no barrier to talent</Pull>
          </div>
        </div>
      </section>

      {/* ── Values ────────────────────────────────────────────────────── */}
      <section id="values" className="scroll-mt-28 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow tone="cyan">Core values</Eyebrow>
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              What we stand for
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              The operational pillars that anchor our community, define our training metrics, and
              guide our products.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {values.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-800 bg-[#0e141c] p-8 transition-colors hover:border-slate-700"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-400">
                  <Icon size={18} />
                </span>
                <h3 className="mt-6 text-lg font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="px-4 pb-28 pt-8 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-2xl border border-cyan-400/40 bg-[#0b1119] px-6 py-16 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Join us on the journey
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-slate-400">
            Join Africa&rsquo;s most focused cohort program or contract our expert software delivery
            team.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3.5 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300"
            >
              Get Started
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-[#0e141c] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:border-slate-600 hover:bg-[#141b26]"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
