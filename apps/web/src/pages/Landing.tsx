import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Code2,
  CheckCircle2, Star, Zap, Shield, Users, GraduationCap, Globe, Mail, Loader2,
  ExternalLink, Github, Sparkles,
} from 'lucide-react';
import HeroCarousel from '../components/ui/HeroCarousel';
import api from '@ebringgs/api';
import { useReviews, useCaseStudies } from '../services/queries';
import ReviewCard from '../components/reviews/ReviewCard';
import type { ReviewCardData } from '../components/reviews/ReviewCard';
import { useAuthStore } from '@ebringgs/auth';
import { useSEO, schema } from '@ebringgs/ui';

// ─── Hero ────────────────────────────────────────────────────────────────────
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
    <section className="relative overflow-hidden bg-linear-to-br from-slate-900 via-teal-950 to-cyan-950 text-white">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%239C92AC%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left, Copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-sm font-medium mb-8">
              <Zap size={14} className="fill-current" />
              Technology · Learning · Innovation
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6">
              Build. Learn.{' '}
              <span className="bg-linear-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Grow.
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-300 leading-relaxed mb-10 max-w-2xl">
              E-Bringgs Technologies delivers world-class software services, structured learning programs, and expert consulting, all in one platform.
            </p>

            <div className="flex flex-wrap gap-4">
              {isAuthenticated && user ? (
                <Link
                  to={dashboardPath}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:-translate-y-0.5"
                >
                  Continue to dashboard <ArrowRight size={18} />
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:-translate-y-0.5"
                >
                  Get started free <ArrowRight size={18} />
                </Link>
              )}
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all duration-200 backdrop-blur"
              >
                View pricing
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-6 text-slate-400 text-sm">
              {['No credit card required', 'Free tier available', '24/7 support'].map((text) => (
                <div key={text} className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-green-400 shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Right, Image Carousel */}
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
  // Honest, curated numbers (updated 2026-07). Completion rate is derived:
  // delivered / (delivered + in flight) = 4 / 10 = 40%.
  const stats = [
    { value: 20, suffix: '+', label: 'Students enrolled', icon: GraduationCap },
    { value: 4, suffix: '', label: 'Projects delivered', icon: Code2 },
    { value: 6, suffix: '', label: 'Projects in flight', icon: Users },
    { value: 40, suffix: '%', label: 'Completion rate', icon: Globe },
  ];

  return (
    <section className="bg-teal-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ value, suffix, label, icon: Icon }) => (
            <div key={label} className="text-center">
              <Icon size={28} className="mx-auto mb-3 text-teal-200" />
              <p className="text-4xl font-extrabold">
                <AnimatedCounter target={value} suffix={suffix} />
              </p>
              <p className="text-teal-200 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Learning ────────────────────────────────────────────────────────────────
function Learning() {
  return (
    <section className="py-24 bg-linear-to-br from-slate-50 to-teal-50 dark:from-slate-950 dark:to-teal-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-sm font-medium mb-6">
              <GraduationCap size={14} /> Learning Programs
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Structured paths to launch your tech career
            </h2>
            <p className="text-gray-500 dark:text-slate-400 text-lg mb-8">
              Join live instructor-led classes, cohort programs, and get 1-on-1 mentorship from seasoned professionals.
            </p>

            <ul className="space-y-4 mb-8">
              {[
                'All classes taught live by expert instructors',
                'Cohort programs with real-world projects',
                '1-on-1 mentorship with industry experts',
                'Career support and certificate of completion',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-teal-600 shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-slate-400">{item}</span>
                </li>
              ))}
            </ul>

            <Link to="/pricing" className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors">
              View programs <ArrowRight size={16} />
            </Link>
          </div>

          {/* Visual image grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Web Development', duration: '8-12 weeks', tag: 'Starter / Cohort', img: '/images/learning/students-laptop.jpg' },
              { label: 'Mobile Development', duration: '8-12 weeks', tag: 'Cohort', img: '/images/hero/data-dashboard.jpg' },
              { label: 'UI/UX Design', duration: '6-10 weeks', tag: 'Live classes', img: '/images/services/ux-design.jpg' },
              { label: '1-on-1 Mentorship', duration: '10-12 weeks', tag: 'Mentorship', img: '/images/general/coding-screen.jpg' },
            ].map((program) => (
              <div key={program.label} className="card-hover-border bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden group">
                <div className="h-28 overflow-hidden">
                  <img loading="lazy" src={program.img} alt={program.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="p-4">
                  <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-md bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 mb-2">{program.tag}</span>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{program.label}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">{program.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Featured Student Work ───────────────────────────────────────────────────

function FeaturedStudentWork() {
  // Backend sorts case studies by `featured: -1, createdAt: -1` already, so
  // a single top-3 fetch yields featured-first-then-recent automatically.
  // (Previously this was a two-stage fetch, feature-filtered then fallback -
  // unnecessary given the server-side sort.)
  const { data: projects = [], isLoading: loading } = useCaseStudies({
    type: 'student_project',
    limit: 3,
  });

  // Hide the whole section if there's nothing to show, better than an
  // awkward empty grid in front of a marketing page.
  if (!loading && projects.length === 0) return null;

  return (
    <section className="py-24 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-sm font-medium mb-4">
              <Sparkles size={14} className="fill-current" /> Featured student work
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              What our students shipped
            </h2>
            <p className="text-lg text-gray-500 dark:text-slate-400 max-w-2xl">
              Real apps, built by real students during their cohort. Click through to see the build, the team, and where they are now.
            </p>
          </div>
          <Link
            to="/portfolio"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-slate-300 hover:border-teal-300 hover:text-teal-600 transition-colors self-start md:self-auto"
          >
            View full portfolio <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-teal-600" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => (
              <Link
                key={p._id}
                to={`/success-stories/${p.slug}`}
                className="group block bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-0.5 hover:border-teal-200 dark:hover:border-teal-800 transition-all overflow-hidden"
              >
                {p.coverImage && (
                  <div className="h-44 overflow-hidden">
                    <img loading="lazy"
                      src={p.coverImage}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="p-5">
                  {p.category && (
                    <p className="text-xs font-medium text-teal-600 dark:text-teal-400 mb-1">{p.category}</p>
                  )}
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">{p.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 mb-4">{p.summary}</p>

                  {p.studentName && (
                    <div className="flex items-center gap-2.5 pt-3 border-t border-gray-100 dark:border-slate-800">
                      <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900 overflow-hidden flex items-center justify-center text-teal-700 dark:text-teal-300 font-semibold text-xs shrink-0">
                        {p.studentAvatar ? (
                          <img loading="lazy" src={p.studentAvatar} alt={p.studentName} className="w-full h-full object-cover" />
                        ) : (
                          p.studentName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{p.studentName}</p>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
                          {p.studentRole || p.cohortBatch || 'Student project'}
                        </p>
                      </div>
                      <div className="flex gap-2 text-gray-300 dark:text-slate-600 shrink-0">
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
    <section className="relative py-24 text-white overflow-hidden">
      <img loading="lazy" src="/images/general/african-students.jpg" alt="Students" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-linear-to-br from-slate-900/95 to-teal-950/90" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What our students & clients say</h2>
          {stats && stats.count > 0 ? (
            <div className="inline-flex items-center gap-2 text-slate-300">
              <Star size={18} className="fill-amber-400 text-amber-400" />
              <span className="font-bold text-white">{stats.average.toFixed(1)}</span>
              <span className="text-sm">based on {stats.count} review{stats.count === 1 ? '' : 's'}</span>
            </div>
          ) : (
            <p className="text-slate-400 text-lg max-w-xl mx-auto">Real reviews from people who've worked with us.</p>
          )}
        </div>

        {loading ? (
          <div className="text-center text-slate-400 py-12">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center max-w-md mx-auto py-12 px-6 bg-white/5 backdrop-blur border border-white/10 rounded-2xl">
            <p className="text-slate-300 mb-2">No reviews yet, be the first.</p>
            <p className="text-sm text-slate-400">
              Once students complete a program and clients finish a project, their reviews will appear here.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
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
    <section className="py-20 bg-gray-50 dark:bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-100 dark:bg-teal-900 rounded-2xl mb-6">
          <Mail size={24} className="text-teal-600 dark:text-teal-400" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">Stay in the loop</h2>
        <p className="text-gray-500 dark:text-slate-400 mb-8 max-w-lg mx-auto">
          Get updates on new cohort openings, free workshops, and tech career tips. No spam, unsubscribe anytime.
        </p>

        {status === 'success' ? (
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-xl font-medium">
            <CheckCircle2 size={18} /> {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="flex-1 px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 shrink-0"
            >
              {status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : null}
              Subscribe
            </button>
          </form>
        )}
        {status === 'error' && (
          <p className="text-sm text-red-500 mt-3">{message}</p>
        )}
      </div>
    </section>
  );
}

// ─── Final CTA ───────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="py-24 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-linear-to-br from-teal-600 to-emerald-700 p-12 md:p-20 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.1)_0%,_transparent_70%)]" />
          <div className="relative">
            <Shield size={40} className="mx-auto mb-6 text-teal-200" />
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Ready to get started?</h2>
            <p className="text-teal-200 text-lg mb-10 max-w-xl mx-auto">
              Join hundreds of students and clients who trust E-Bringgs to level up their skills and deliver results.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-teal-700 font-bold rounded-xl hover:bg-teal-50 transition-colors shadow-lg">
                Create free account <ArrowRight size={18} />
              </Link>
              <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-colors">
                Talk to us
              </Link>
            </div>
          </div>
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
    <>
      <Hero />
      <Stats />
      <Learning />
      <FeaturedStudentWork />
      <Testimonials />
      <Newsletter />
      <FinalCTA />
    </>
  );
}
