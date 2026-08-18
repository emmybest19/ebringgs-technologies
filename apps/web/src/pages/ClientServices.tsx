import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useSEO } from '@ebringgs/ui';

/**
 * Client Services, served at /services/client — the organisation-facing half
 * of the services split. The student-facing half lives under /courses.
 *
 * DARK ONLY, deliberately — colours are unconditional rather than `dark:`
 * variants, matching the rest of the redesigned public pages.
 */

interface Offer {
  title: string;
  badge: string;
  body: string;
  deliverables: string[];
  ctaLabel: string;
  ctaHref: string;
}

const offers: Offer[] = [
  {
    title: 'Technical Consulting',
    badge: 'Advisory',
    body: 'Align your tech stack with enterprise-grade modular architectures. We audit your deployment schemas, query indexes, and API latency metrics to pinpoint critical scaling pain points.',
    deliverables: [
      'End-to-end engineering architecture audit',
      'Performance optimization report with concrete specs',
      'Database index and pipeline load analysis',
      'Strategic cloud infra recommendations (AWS/GCP)',
    ],
    ctaLabel: 'Book Architecture Review',
    ctaHref: '/contact',
  },
  {
    title: 'Team Training',
    badge: 'Upskilling',
    body: 'Accelerate your in-house talent pipeline. We configure specialized, interactive training matching your proprietary frameworks, software environments, and delivery cycles.',
    deliverables: [
      'Custom technical syllabus tailored to your team',
      'Direct Slack mentoring channel with senior developers',
      'Weekly milestone evaluations and real-world metrics',
      'Enterprise-grade performance verification exams',
    ],
    ctaLabel: 'Request Custom Training',
    ctaHref: '/contact',
  },
  {
    title: 'Product Development',
    badge: 'Engineering',
    body: 'Contract our elite veteran software teams to design, architect, and deploy performant consumer platforms. Built precisely using React Native, NextJS, Python, and scalable cloud architectures.',
    deliverables: [
      'Production-grade web and mobile app blueprints',
      'Highly-optimized secure payment and API setups',
      'Clean, documented code with strict SLA deliverables',
      'Verification metrics and post-deployment staging support',
    ],
    ctaLabel: 'Consult Our Builders',
    ctaHref: '/contact',
  },
  {
    title: 'Custom Curriculum',
    badge: 'Education Strategy',
    body: 'For institutions, NGOs, and governments looking to build certified digital academies. We design pedagogical metrics, robust exercises, and live testing models.',
    deliverables: [
      'Curriculum maps scaled to multiple experience levels',
      'Automated grading and coding-lab templates',
      'Alumni engagement frameworks and hiring indexes',
      'Globally verifiable ebringgs program accreditation structures',
    ],
    ctaLabel: 'Co-design Academy Models',
    ctaHref: '/contact',
  },
];

const faqs = [
  {
    q: 'How long does a typical consulting engagement take?',
    a: 'Technical stack audits and performance audits typically take 2 to 4 weeks depending on platform complexity. Custom product development runs are scoped with precise milestones on a per-project basis.',
  },
  {
    q: 'Can we mix multiple services, like product build and custom team upskilling?',
    a: 'Absolutely. Many of our enterprise partners hire our software team to build and launch a product, then transition system custody through a customized team training curriculum.',
  },
  {
    q: 'Are your developers and instructors located in GMT timezones?',
    a: 'Yes, our core support team, project architects, and system engineers operate on flexible GMT and EST schedules to deliver constant integration and deployment coverage.',
  },
];

export default function ClientServices() {
  useSEO({
    title: 'Client Services',
    description: 'Enterprise consulting, product development, team training and custom curriculum design from E-Bringgs Technologies.',
    url: 'https://ebringgs.com/services/client',
    image: 'https://ebringgs.com/logo-full.jpg',
  });

  return (
    <div className="bg-[#080c11]">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="no-reveal relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(65%_55%_at_50%_5%,rgba(34,211,238,0.09),transparent_65%)]" />
        <div className="relative mx-auto max-w-3xl px-4 pb-20 pt-16 text-center sm:px-6">
          <span className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
            Enterprise deployments &amp; partnerships
          </span>
          <h1 className="mt-7 text-4xl font-extrabold leading-[1.1] tracking-tight text-white md:text-5xl">
            Accelerate your systems &amp; engineering output
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400">
            We extend expert-level software consulting, product architecture runs, and tailored team
            upskilling programs to help organizations build highly resilient platforms.
          </p>
        </div>
      </section>

      {/* ── Offers ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {offers.map((o) => (
            <div
              key={o.title}
              className="flex flex-col rounded-2xl border border-slate-800 bg-[#0e141c] p-7 transition-colors hover:border-slate-700"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-bold text-white">{o.title}</h2>
                <span className="shrink-0 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-cyan-300">
                  {o.badge}
                </span>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-slate-400">{o.body}</p>

              <div className="mt-6 flex-1 border-t border-slate-800 pt-6">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Key deliverables &amp; metrics
                </p>
                <ul className="mt-4 space-y-2.5">
                  {o.deliverables.map((d) => (
                    <li key={d} className="flex items-start gap-2.5">
                      <Check size={13} strokeWidth={3} className="mt-0.5 shrink-0 text-cyan-400" />
                      <span className="text-xs leading-relaxed text-slate-300">{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to={o.ctaHref}
                className="mt-7 block rounded-xl bg-cyan-400 px-5 py-3 text-center text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300"
              >
                {o.ctaLabel}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Partnerships ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="flex flex-col gap-6 rounded-2xl border border-slate-800 bg-[#0e141c] p-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-300">
              Partnerships
            </span>
            <h2 className="mt-4 text-lg font-bold text-white">
              Need custom regional integrations or global agency programs?
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              We design and coordinate direct developer pipelines and certified technical training
              templates matched to your secure corporate standards.
            </p>
          </div>
          <Link
            to="/contact"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300"
          >
            Contact Partnerships
          </Link>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Client Services FAQ
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Frequently asked questions about our enterprise delivery and team support setups.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map(({ q, a }) => (
            <div key={q} className="rounded-2xl border border-slate-800 bg-[#0e141c] p-6">
              <h3 className="text-sm font-bold text-white">{q}</h3>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="px-4 pb-28 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-cyan-400/40 bg-[#0b1119] px-6 py-14 text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
            Ready to transform your tech operations?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-slate-400">
            Consult directly with our veteran product leads and senior software developers to map a
            plan tailored for your system.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3.5 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300"
            >
              Schedule Integration Call
            </Link>
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-[#0e141c] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:border-slate-600 hover:bg-[#141b26]"
            >
              View Case Studies
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
