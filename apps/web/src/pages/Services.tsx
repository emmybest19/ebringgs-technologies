import { Link } from 'react-router-dom';
import { ArrowRight, GraduationCap, Briefcase } from 'lucide-react';
import { useSEO } from '@ebringgs/ui';
import { capabilities, getAccent } from '../data/capabilities';

/**
 * One canonical surface for what E-Bringgs does. Each capability serves a dual
 * audience: students who want to LEARN the skill, and clients who want us to
 * DELIVER it. Cards click through to `/services/:slug`, where the dual-track
 * detail page expands on both.
 *
 * DARK ONLY, deliberately — colours are unconditional rather than `dark:`
 * variants, matching the landing and auth pages.
 */

export default function Services() {
  useSEO({
    title: 'Services',
    description: 'Every skill we teach is a skill we ship. Web, mobile, UI/UX, data — learn it with our mentors or hire our team to build it for you.',
    url: 'https://ebringgs.com/services',
    image: 'https://ebringgs.com/logo-full.jpg',
  });

  return (
    <div className="bg-[#080c11]">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="no-reveal mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 lg:px-8">
        <span className="inline-flex items-center rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-cyan-300">
          Modular support built for you
        </span>

        <h1 className="mt-7 max-w-4xl text-4xl font-extrabold leading-[1.1] tracking-tight text-white md:text-5xl">
          Services built around your goals
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-400">
          From individual educational pathways to end-to-end organizational product
          integrations, we provide the specific, expert technical backing you need.
        </p>

        {/* The two audiences, as real routes rather than decorative chips —
            they look like buttons, so they behave like buttons. */}
        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300"
          >
            Students enroll in cohorts
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-slate-600 hover:bg-white/5"
          >
            Clients book custom projects
          </Link>
        </div>
      </section>

      {/* ── Capability grid ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map(({ slug, icon: Icon, title, tagline, img }) => {
            const accent = getAccent(slug);
            return (
              <Link
                key={slug}
                to={`/services/${slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#0e141c] p-2 transition-colors hover:border-slate-700"
              >
                <div className="overflow-hidden rounded-xl">
                  <img
                    loading="lazy"
                    src={img}
                    alt=""
                    aria-hidden="true"
                    className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${accent.tile}`}>
                    <Icon size={18} />
                  </span>

                  <h2 className="mt-5 text-lg font-bold text-white">{title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{tagline}</p>

                  <span className={`mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold ${accent.text}`}>
                    Learn more
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3.5 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300"
          >
            <GraduationCap size={16} /> Browse cohorts to enroll in
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-[#0e141c] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:border-slate-600 hover:bg-[#141b26]"
          >
            <Briefcase size={16} /> Book us for a project
          </Link>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 px-4 py-3.5 text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            See pricing <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────── */}
      <section className="border-t border-white/[0.06] bg-[#0d1520] py-24">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Not seeing what you need?
          </h2>
          <p className="mt-4 text-sm text-slate-400">
            Let's talk. We'll help you figure out the right approach for your goals.
          </p>
          <Link
            to="/contact"
            className="mt-9 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-7 py-3.5 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300"
          >
            Talk to us <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
