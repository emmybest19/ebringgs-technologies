import { Link } from 'react-router-dom';
import { Star, Lightbulb, Users, ShieldCheck, Eye, Rocket, Quote } from 'lucide-react';
import { useSEO } from '@ebringgs/ui';

/**
 * Our Values, served at /about/values.
 *
 * DARK ONLY, deliberately — colours are unconditional rather than `dark:`
 * variants, matching the rest of the redesigned public pages.
 *
 * Note: the About page carries its own four-value teaser with shorter copy.
 * These six are the full statements; the two lists are intentionally separate
 * so each page matches its own design.
 */

const principles = [
  {
    icon: Star,
    title: 'Excellence',
    body: 'We hold our learners, programs, and deliverables to strict international benchmarks. Good enough is never enough when engineering complex platforms.',
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    body: 'Technology moves fast; we move faster. Our live instruction adjusts dynamically as production tools, cloud systems, and design strategies evolve.',
  },
  {
    icon: Users,
    title: 'Community',
    body: 'Nobody builds alone. We foster an elite, highly active cohort structure where students, mentors, and alumni share live code review and pipeline strategies.',
  },
  {
    icon: ShieldCheck,
    title: 'Integrity',
    body: 'No hidden fees, no shortcut curriculums, and no exaggerated claims. Transparent tracking and rigorous reviews dictate our cohort progress and partner trust.',
  },
  {
    icon: Eye,
    title: 'Transparency',
    body: 'From technical execution timelines to client consulting deliverables, we maintain clear, constant, and proactive channels with no surprises down the line.',
  },
  {
    icon: Rocket,
    title: 'Empowerment',
    body: 'We democratize access to elite software standards. By bridging geographic barriers, we launch high-impact digital careers and African tech products.',
  },
];

export default function Values() {
  useSEO({
    title: 'Our Values',
    description: 'The guiding principles behind how E-Bringgs teaches, builds, and works with clients.',
    url: 'https://ebringgs.com/about/values',
    image: 'https://ebringgs.com/logo-full.jpg',
  });

  return (
    <div className="bg-[#080c11]">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="no-reveal relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(65%_55%_at_50%_5%,rgba(251,191,36,0.06),transparent_65%)]" />
        <div className="relative mx-auto max-w-3xl px-4 pb-20 pt-16 text-center sm:px-6">
          <span className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
            Guiding principles
          </span>
          <h1 className="mt-7 text-4xl font-extrabold leading-[1.1] tracking-tight text-white md:text-5xl">
            The values driving Africa&rsquo;s premier engineering hub
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400">
            At ebringgs, we do not just teach technical skills. We instill the operational
            discipline, creative problem-solving, and deep collaborative trust required to build
            systems that scale.
          </p>
        </div>
      </section>

      {/* ── Principles ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {principles.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-800 bg-[#0e141c] p-7 transition-colors hover:border-slate-700"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-400">
                <Icon size={18} />
              </span>
              <h2 className="mt-6 text-lg font-bold text-white">{title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Statement ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <figure className="rounded-2xl border border-slate-800 bg-[#0e141c] px-6 py-14 text-center sm:px-14">
          <Quote size={26} className="mx-auto text-cyan-400" aria-hidden="true" />
          <blockquote className="mx-auto mt-8 max-w-3xl text-2xl font-bold leading-snug text-white md:text-3xl">
            &ldquo;Traditional models of tech training focus heavily on memorization. We structured
            our core ethics around output, high-tempo production loops, and peer responsibility.&rdquo;
          </blockquote>
          {/* Attributed to the company rather than a named executive — swap in
              a real person and title here when you have one. */}
          <figcaption className="mt-8">
            <span className="block text-sm font-bold text-cyan-400">The ebringgs founding team</span>
            <span className="mt-0.5 block text-xs text-slate-500">E-Bringgs Technologies</span>
          </figcaption>
        </figure>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="px-4 pb-28 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-cyan-400/40 bg-[#0b1119] px-6 py-16 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Want to build within a values-driven community?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-slate-400">
            We align our learning models with elite enterprise requirements to deliver a peer network
            of lasting strategic advantage.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3.5 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300"
            >
              Apply to the Cohort
            </Link>
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-[#0e141c] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:border-slate-600 hover:bg-[#141b26]"
            >
              Explore Curriculums
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
