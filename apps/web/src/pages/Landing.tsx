import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Code2, Check, Star, Users, GraduationCap, TrendingUp, Loader2,
  ExternalLink, Github, CheckCircle2,
} from 'lucide-react';
import HeroCarousel from '../components/ui/HeroCarousel';
import api from '@ebringgs/api';
import { useReviews, useCaseStudies } from '../services/queries';
import ReviewCard from '../components/reviews/ReviewCard';
import type { ReviewCardData } from '../components/reviews/ReviewCard';
import { useAuthStore } from '@ebringgs/auth';
import { useSEO, schema } from '@ebringgs/ui';

/**
 * Landing page.
 *
 * DARK ONLY, deliberately — every colour is unconditional rather than a
 * `dark:` variant, matching the sign-in and sign-up pages. The light-mode
 * treatment is still to be specified.
 */

// Shared surface tokens, so the section banding stays consistent as this page
// grows. `base` is the page floor; `raised` is a panel sitting on it.
const SURFACE = {
  base: 'bg-[#080c11]',
  band: 'bg-[#0a1017]',
  card: 'bg-[#0e141c]',
};

const cyanButton =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-3.5 ' +
  'text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300';
const ghostButton =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-[#0e141c] ' +
  'px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:border-slate-600 hover:bg-[#141b26]';

// ─── Hero ────────────────────────────────────────────────────────────────────
const heroPoints = [
  'All classes taught live by world-class industry professionals',
  'Rigorous cohort programs built around production-grade projects',
  'Guaranteed 1-on-1 mentorship with engineering leads',
  'Comprehensive career placement support & industry certificates',
];

const heroTrust = ['No credit card required', 'Free trial tier included', 'Dedicated 24/7 Slack support'];

function Hero() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  // Admin + teacher portals live on their own subdomains.
  const adminUrl = (import.meta.env.VITE_ADMIN_URL as string | undefined) || 'https://admin.ebringgs.com';
  const teacherUrl = (import.meta.env.VITE_TEACHER_URL as string | undefined) || 'https://teachers.ebringgs.com';
  const dashboardPath =
    user?.role === 'admin' ? adminUrl
    : user?.role === 'teacher' ? teacherUrl
    : user?.role === 'client' ? '/client'
    : '/dashboard';

  return (
    <section className={`no-reveal relative overflow-hidden ${SURFACE.base} text-white`}>
      <div className="absolute inset-0 bg-[radial-gradient(90%_60%_at_15%_20%,rgba(34,211,238,0.07),transparent_60%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-cyan-300">
              Now enrolling for Q3 cohorts
            </span>

            <h1 className="mt-8 text-5xl font-extrabold leading-[1.08] tracking-tight md:text-6xl">
              Build. Learn.
              <br />
              <span className="text-gold-400">Grow.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400">
              Expert-led instruction meets direct 1-on-1 mentorship. We build deep, robust skills in
              software engineering, UI/UX design, and data science designed to accelerate real-world
              career trajectories.
            </p>

            <ul className="mt-8 space-y-3">
              {heroPoints.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/10">
                    <Check size={12} strokeWidth={3} className="text-cyan-400" />
                  </span>
                  <span className="text-sm text-slate-300">{point}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link to={isAuthenticated && user ? dashboardPath : '/register'} className={cyanButton}>
                {isAuthenticated && user ? 'Continue to dashboard' : 'Get started free'} <ArrowRight size={16} />
              </Link>
              <Link to="/pricing" className={ghostButton}>View pricing</Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
              {heroTrust.map((text) => (
                <span key={text} className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="h-1 w-1 shrink-0 rounded-full bg-cyan-400" />
                  {text}
                </span>
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <HeroCarousel />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Stats ───────────────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  const animate = useCallback(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
  }, [target]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) animate(); },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animate]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

function Stats() {
  // Curated numbers (updated 2026-07). Completion rate is a standalone
  // figure, not derived from the counts beside it — don't try to reconcile
  // the four values against each other. `target` is null where the value is
  // a label rather than a number, so the counter is skipped.
  const stats: { target: number | null; display: string; suffix: string; label: string; icon: typeof Users }[] = [
    { target: 20, display: '20+', suffix: '+', label: 'Students Enrolled', icon: Users },
    { target: 4, display: '4', suffix: '', label: 'Projects Delivered', icon: Code2 },
    { target: null, display: '1-on-1', suffix: '', label: 'Guaranteed Mentorship', icon: GraduationCap },
    { target: 94, display: '94%', suffix: '%', label: 'Completion Rate', icon: TrendingUp },
  ];

  return (
    <section className={`${SURFACE.band} border-y border-white/[0.06]`}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map(({ target, display, suffix, label, icon: Icon }) => (
            <div key={label} className="flex items-center gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10">
                <Icon size={20} className="text-cyan-400" />
              </span>
              <span>
                <span className="block text-2xl font-extrabold text-white">
                  {target === null ? display : <AnimatedCounter target={target} suffix={suffix} />}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">{label}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Curriculum ──────────────────────────────────────────────────────────────
const programs = [
  {
    label: 'Web Development',
    tag: 'Frontend & Backend',
    img: '/images/learning/students-laptop.jpg',
    points: ['React, Next.js, and TypeScript', 'Advanced Node.js & Database Systems', 'CI/CD & DevOps basics'],
  },
  {
    label: 'Mobile Development',
    tag: 'iOS & Android',
    img: '/images/hero/data-dashboard.jpg',
    points: ['React Native architecture', 'Native Swift & Kotlin integration', 'App Store deployment pipelines'],
  },
  {
    label: 'UI/UX Design',
    tag: 'Product & Interface',
    img: '/images/services/ux-design.jpg',
    points: ['Advanced Figma & Prototyping', 'Design systems & component design', 'Heuristic product analysis'],
  },
  {
    label: '1-on-1 Mentorship',
    tag: 'Elite Coaching',
    img: '/images/general/coding-screen.jpg',
    points: ['Direct private Slack channels', 'Weekly milestone review', 'Career roadmap consulting'],
  },
];

function Curriculum() {
  return (
    <section className={`${SURFACE.base} py-24`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
            Curriculum overview
          </span>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Structured paths to launch your tech career
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Choose a discipline. Train live with elite builders. Build a verified portfolio that
            outshines traditional university degrees.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {programs.map((program) => (
            <article
              key={program.label}
              className={`group overflow-hidden rounded-2xl border border-slate-800 ${SURFACE.card} transition-colors hover:border-slate-700`}
            >
              <div className="relative h-32 overflow-hidden">
                <img
                  loading="lazy"
                  src={program.img}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 rounded-md bg-slate-950/80 px-2 py-1 text-[10px] font-semibold text-cyan-300 backdrop-blur">
                  {program.tag}
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-white">{program.label}</h3>
                <ul className="mt-3 space-y-2">
                  {program.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-xs leading-relaxed text-slate-400">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-600" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link to="/pricing" className={cyanButton}>
            View program syllabus <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Featured Student Work ───────────────────────────────────────────────────
function FeaturedStudentWork() {
  // Backend sorts case studies by `featured: -1, createdAt: -1` already, so a
  // single top-3 fetch yields featured-first-then-recent automatically.
  const { data: projects = [], isLoading: loading } = useCaseStudies({
    type: 'student_project',
    limit: 3,
  });

  // Hide the whole section if there's nothing to show — better than an
  // awkward empty grid in the middle of a marketing page.
  if (!loading && projects.length === 0) return null;

  return (
    <section className={`${SURFACE.band} border-y border-white/[0.06] py-24`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              What our students shipped
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-400">
              Real apps, built by real students during their cohort. Click through to see the build,
              the team, and where they are now.
            </p>
          </div>
          <Link
            to="/portfolio"
            className="inline-flex shrink-0 items-center gap-2 self-start text-sm font-medium text-cyan-400 hover:underline md:self-auto"
          >
            View full portfolio <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-cyan-400" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link
                key={p._id}
                to={`/success-stories/${p.slug}`}
                className={`group block overflow-hidden rounded-2xl border border-slate-800 ${SURFACE.card} transition-colors hover:border-slate-700`}
              >
                {p.coverImage && (
                  <div className="h-44 overflow-hidden">
                    <img
                      loading="lazy"
                      src={p.coverImage}
                      alt={p.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-5">
                  {p.category && <p className="mb-1 text-xs font-medium text-cyan-400">{p.category}</p>}
                  <h3 className="mb-2 line-clamp-1 font-bold text-white">{p.title}</h3>
                  <p className="mb-4 line-clamp-2 text-sm text-slate-400">{p.summary}</p>

                  {p.studentName && (
                    <div className="flex items-center gap-2.5 border-t border-slate-800 pt-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-cyan-400/10 text-xs font-semibold text-cyan-300">
                        {p.studentAvatar ? (
                          <img loading="lazy" src={p.studentAvatar} alt={p.studentName} className="h-full w-full object-cover" />
                        ) : (
                          p.studentName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-white">{p.studentName}</p>
                        <p className="truncate text-[11px] text-slate-500">
                          {p.studentRole || p.cohortBatch || 'Student project'}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2 text-slate-600">
                        {p.liveUrl && <ExternalLink size={13} />}
                        {p.githubUrl && <Github size={13} />}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Testimonials ────────────────────────────────────────────────────────────
function Testimonials() {
  const { data, isLoading: loading } = useReviews({ limit: 6 });
  const reviews: ReviewCardData[] = (data?.reviews ?? []) as unknown as ReviewCardData[];
  const stats = data?.stats ?? null;

  return (
    <section className={`${SURFACE.base} py-24`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            What our students &amp; clients say
          </h2>
          {stats && stats.count > 0 ? (
            <div className="mt-3 inline-flex items-center gap-2 text-slate-400">
              <Star size={16} className="fill-gold-400 text-gold-400" />
              <span className="font-bold text-white">{stats.average.toFixed(1)}</span>
              <span className="text-sm">based on {stats.count} review{stats.count === 1 ? '' : 's'}</span>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-400">Transparent reviews from modern tech operators.</p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-cyan-400" />
          </div>
        ) : reviews.length === 0 ? (
          <div className={`mx-auto max-w-lg rounded-2xl border border-slate-800 ${SURFACE.card} px-8 py-12 text-center`}>
            <span className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10">
              <Star size={20} className="text-cyan-400" />
            </span>
            <p className="font-semibold text-white">No reviews yet, be the first.</p>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Once students complete a program and clients finish a custom technical integration,
              verified transparent reviews will populate this terminal instantly.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {reviews.map((r) => (
              <ReviewCard key={r._id} review={r} dark />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Newsletter ─────────────────────────────────────────────────────────────
function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const { data } = await api.post('/newsletter/subscribe', { email });
      setStatus('success');
      setMessage(data.message);
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <section className={`${SURFACE.base} pb-24`}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className={`rounded-3xl border border-slate-800 ${SURFACE.card} px-6 py-14 text-center`}>
          <h2 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
            Stay in the loop with modular education
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
            Sign up for our newsletter to get resource drops, curriculum updates, and industry insights.
          </p>

          {status === 'success' ? (
            <div className="mt-8 inline-flex items-center gap-2 rounded-xl bg-cyan-400/10 px-6 py-3 text-sm font-medium text-cyan-300">
              <CheckCircle2 size={18} /> {message}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
              <input
                type="email"
                placeholder="Enter your professional email…"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 rounded-xl border border-slate-800 bg-[#111823] px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300 disabled:opacity-60"
              >
                {status === 'loading' && <Loader2 size={16} className="animate-spin" />}
                Subscribe
              </button>
            </form>
          )}
          {status === 'error' && <p className="mt-3 text-sm text-red-400">{message}</p>}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ───────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className={`${SURFACE.base} pb-28`}>
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
          Ready to get started?
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/register" className={cyanButton}>Enroll in a program</Link>
          <Link to="/contact" className={ghostButton}>Book a consultation call</Link>
        </div>
      </div>
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function Landing() {
  useSEO({
    title: 'E-Bringgs Technologies',
    description:
      'Learn to ship real software with our live cohorts, or hire our team to build yours. Mentorship, projects, certificates — all in one place.',
    keywords: [
      'software training', 'coding bootcamp', 'web development cohort',
      'UI/UX mentorship', 'software agency Nigeria', 'live online classroom',
      'learn to code', 'E-Bringgs Technologies',
    ],
    url: 'https://ebringgs.com/',
    image: 'https://ebringgs.com/logo-full.jpg',
    imageAlt: 'E-Bringgs Technologies — software training & client projects',
    robotsExtras: ['max-image-preview:large'],
    jsonLd: [schema.website(), schema.organization()],
  });

  return (
    <div className={SURFACE.base}>
      <Hero />
      <Stats />
      <Curriculum />
      <FeaturedStudentWork />
      <Testimonials />
      <Newsletter />
      <FinalCTA />
    </div>
  );
}
