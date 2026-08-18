import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, UserPlus, Search, CreditCard, BookOpen, Video,
  Award, Code2, MessageSquare, FolderOpen, BarChart3, Check,
  GraduationCap, Briefcase, Plus, Minus,
} from 'lucide-react';
import { useSEO, schema } from '@ebringgs/ui';
import { capabilities, getAccent } from '../data/capabilities';

/* ─── Role tabs ─────────────────────────────────────────────────────────────── */

type Role = 'student' | 'client';

const roles: { key: Role; label: string; icon: typeof GraduationCap; description: string }[] = [
  { key: 'student', label: 'I want to learn', icon: GraduationCap, description: 'Live training, mentorship & career growth' },
  { key: 'client', label: 'I need a service', icon: Briefcase, description: 'Software, design & consulting' },
];

/* ─── Steps per role ────────────────────────────────────────────────────────── */

interface Step {
  number: number;
  title: string;
  description: string;
  icon: typeof UserPlus;
  image: string;
  tips: string[];
  cta?: { label: string; to: string };
}

const studentSteps: Step[] = [
  {
    number: 1,
    title: 'Create your free account',
    description: 'Sign up in seconds with your email. Choose "Student" as your role during registration, this unlocks your personal learning dashboard.',
    icon: UserPlus,
    image: '/images/hero/team-collaboration.jpg',
    tips: ['Use a real email, you\'ll need it to verify your account', 'You can upgrade or change your plan later'],
    cta: { label: 'Create account', to: '/register' },
  },
  {
    number: 2,
    title: 'Choose a training program',
    description: 'Pick from Web Development, Mobile Development, or UI/UX Design, each with three tiers: Starter (live classes), Cohort (intensive group program), or Mentorship (1-on-1 sessions). All classes are taught live.',
    icon: Search,
    image: '/images/learning/students-laptop.jpg',
    tips: ['Compare tiers on the pricing page to find the best fit', 'All programs have set class schedules, check availability'],
    cta: { label: 'View programs', to: '/pricing' },
  },
  {
    number: 3,
    title: 'Pay & get started',
    description: 'Select your program and complete a secure one-time payment via Paystack. Once payment is confirmed, your live class schedule appears in your dashboard. Fixed price, no haggling.',
    icon: CreditCard,
    image: '/images/services/data-analysis.jpg',
    tips: ['Payments are in Nigerian Naira (NGN)', 'You\'ll get a confirmation email with your receipt'],
    cta: { label: 'View pricing', to: '/pricing' },
  },
  {
    number: 4,
    title: 'Check your dashboard & schedule',
    description: 'Your Student Dashboard is your home base. See upcoming live sessions, class schedule, downloadable resources, assignments, and announcements. You can also track your position on the leaderboard, watch class recordings you missed, and share your referral link to earn rewards.',
    icon: BookOpen,
    image: '/images/general/coding-screen.jpg',
    tips: ['The "Schedule" tab shows all your upcoming live sessions', 'Check the leaderboard to see how you rank among your peers', 'Share your referral link to earn discounts on future programs'],
  },
  {
    number: 5,
    title: 'Attend live classes',
    description: 'All classes are taught live. Join directly from your dashboard at the scheduled time. Turn on your camera, share your screen, ask questions in real time, and interact with your instructor and classmates. Missed a session? Every class is recorded and available in your Recordings tab.',
    icon: Video,
    image: '/images/learning/video-class.jpg',
    tips: ['Test your camera and mic before class starts', 'Use the in-class chat to ask questions during the session', 'Missed a class? Watch the recording from your dashboard'],
  },
  {
    number: 6,
    title: 'Submit assignments & earn your certificate',
    description: 'Complete assignments given during live classes, get reviewed by your instructor, and when you finish the program, download your verified certificate of completion. Every certificate has a unique ID that employers can verify on our public verification page.',
    icon: Award,
    image: '/images/learning/mentorship.jpg',
    tips: ['Assignments are reviewed within 48 hours', 'Your certificate includes a unique ID for employer verification', 'Employers can verify your certificate at /verify-certificate'],
  },
];

const clientSteps: Step[] = [
  {
    number: 1,
    title: 'Create your account',
    description: 'Sign up and select "Client" as your role. This gives you access to the Client Dashboard where you can manage projects, payments, and communication, all in one place.',
    icon: UserPlus,
    image: '/images/hero/modern-workspace.jpg',
    tips: ['Choose "Client" during registration to get the right dashboard', 'You can also inquire without an account via the Services page'],
    cta: { label: 'Create account', to: '/register' },
  },
  {
    number: 2,
    title: 'Explore our services',
    description: 'Browse what we offer, web apps, mobile apps, data analytics, ML, research support, UI/UX design, and product strategy. Each service page shows deliverables and what to expect.',
    icon: Code2,
    image: '/images/services/software-dev.jpg',
    tips: ['Not sure what you need? Use the "Talk to us" button on the Services page', 'Each service card lists exactly what you\'ll receive'],
    cta: { label: 'View services', to: '/services' },
  },
  {
    number: 3,
    title: 'Submit a service inquiry',
    description: 'Found what you need? Click "Request Service" and fill out a short form describing your project. Our team reviews every inquiry within 1-2 business days and reaches out with a plan.',
    icon: MessageSquare,
    image: '/images/general/handshake.jpg',
    tips: ['Be as specific as possible about your project goals', 'Include your timeline and budget range if you have one'],
  },
  {
    number: 4,
    title: 'Get matched & project kicks off',
    description: 'Once we align on scope and pricing, your project is created in your Client Dashboard. You\'ll see a dedicated project page with status updates, milestones, and deliverables.',
    icon: FolderOpen,
    image: '/images/hero/developer-coding.jpg',
    tips: ['Your project page shows real-time status: pending, in-progress, or completed', 'You can message us directly from the dashboard'],
  },
  {
    number: 5,
    title: 'Make payments securely',
    description: 'Pay via Paystack, our secure payment gateway. View all your transactions, receipts, and payment history from the Payments section of your dashboard.',
    icon: CreditCard,
    image: '/images/hero/data-dashboard.jpg',
    tips: ['All prices are in NGN', 'Fixed price per package, what you see is what you pay'],
    cta: { label: 'View pricing', to: '/pricing' },
  },
  {
    number: 6,
    title: 'Track progress & receive deliverables',
    description: 'Monitor your project from start to finish. We provide regular updates, and when the project is complete, all deliverables are available for download from your dashboard.',
    icon: BarChart3,
    image: '/images/about/team-meeting.jpg',
    tips: ['Check the "Projects" tab for live status', 'Completed projects include all source files and documentation'],
  },
];

const stepsByRole: Record<Role, Step[]> = {
  student: studentSteps,
  client: clientSteps,
};

/* ─── FAQ ───────────────────────────────────────────────────────────────────── */

const faqs = [
  { q: 'Is it free to create an account?', a: 'Yes, signing up is completely free. You only pay when you enrol in a training program or request a service.' },
  { q: 'Can I be both a student and a client?', a: 'Currently each account has one role. If you need both, contact us and we\'ll help you set up access.' },
  { q: 'What payment methods do you accept?', a: 'We use Paystack, which supports bank transfers, cards (Visa, Mastercard), and USSD, all in Nigerian Naira.' },
  { q: 'Are all classes live?', a: 'Yes, every class is taught live by our instructors. You join at the scheduled time from your dashboard. Camera, mic, screen sharing, and chat are all built in.' },
  { q: 'What if I miss a live class?', a: 'No worries, all live sessions are recorded. You can watch them anytime from the Recordings tab in your dashboard.' },
  { q: 'How does the referral program work?', a: 'Every student gets a unique referral link. Share it with friends, when they sign up and enrol, you earn rewards like discounts on future programs.' },
  { q: 'Can employers verify my certificate?', a: 'Yes, every certificate has a unique ID. Employers can verify it on our public verification page at /verify-certificate.' },
  { q: 'Can I get a refund?', a: 'Refund policies vary by program and service. Contact us within 7 days of payment and we\'ll work it out.' },
  { q: 'How fast do you respond to service inquiries?', a: 'We aim to respond within 1-2 business days with a plan and quote.' },
];

/* --- Condensed flow strip ------------------------------------------------- */
// Short labels for the "at a glance" rail. Kept per-role so the summary always
// matches the six detailed steps above it.
const glance: Record<Role, { label: string; blurb: string }[]> = {
  student: [
    { label: 'Signup', blurb: 'Create your free account' },
    { label: 'Select', blurb: 'Pick the cohort that fits' },
    { label: 'Enroll', blurb: 'Secure your place on the roster' },
    { label: 'Onboard', blurb: 'Dashboard and schedule go live' },
    { label: 'Attend', blurb: 'Join live weekly sessions' },
    { label: 'Graduate', blurb: 'Earn a verifiable certificate' },
  ],
  client: [
    { label: 'Signup', blurb: 'Create your account' },
    { label: 'Explore', blurb: 'Review what we deliver' },
    { label: 'Enquire', blurb: 'Send us the brief' },
    { label: 'Kickoff', blurb: 'Meet your delivery squad' },
    { label: 'Build', blurb: 'Weekly demos as we ship' },
    { label: 'Handover', blurb: 'Code, docs and deployment' },
  ],
};

/* --- Page ----------------------------------------------------------------- */
/**
 * DARK ONLY, deliberately - colours are unconditional rather than `dark:`
 * variants, matching the rest of the redesigned public pages.
 */

export default function HowItWorks() {
  const [activeRole, setActiveRole] = useState<Role>('student');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const steps = stepsByRole[activeRole];

  useSEO({
    title: 'How It Works',
    description: 'A step-by-step guide for students and clients to get started with E-Bringgs Technologies.',
    keywords: ['how it works', 'enrollment', 'client onboarding', 'training process'],
    url: 'https://ebringgs.com/how-it-works',
    image: 'https://ebringgs.com/logo-full.jpg',
    imageAlt: 'How E-Bringgs Technologies works',
    jsonLd: [
      schema.breadcrumb([
        { name: 'Home', url: 'https://ebringgs.com/' },
        { name: 'How It Works', url: 'https://ebringgs.com/how-it-works' },
      ]),
    ],
  });

  return (
    <div className="bg-[#080c11]">
      {/* Hero */}
      <section className="no-reveal relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(65%_55%_at_50%_0%,rgba(34,211,238,0.09),transparent_65%)]" />
        <div className="relative mx-auto max-w-3xl px-4 pb-16 pt-16 text-center sm:px-6">
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white md:text-5xl">
            Step-by-step path to tech excellence
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-slate-400">
            Whether you want to advance your career with elite live learning cohorts or seek to
            deploy high-grade technical services, our process is optimized for guaranteed delivery.
          </p>

          {/* Role switch - swaps the six steps and the glance rail below. */}
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            {roles.map(({ key, label, icon: Icon }) => {
              const active = activeRole === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setActiveRole(key); setOpenFaq(null); }}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-colors ${
                    active
                      ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
                      : 'border border-slate-700 bg-[#0e141c] text-white hover:border-slate-600 hover:bg-[#141b26]'
                  }`}
                >
                  <Icon size={16} /> {label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="reveal-clip mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="space-y-16">
          {steps.map((step, i) => {
            const imageFirst = i % 2 === 0;
            return (
              <div key={`${activeRole}-${step.number}`} className="grid items-center gap-10 lg:grid-cols-2">
                <div
                  className={`overflow-hidden rounded-2xl border border-slate-800 bg-[#0e141c] p-2 ${
                    imageFirst ? 'lg:order-1' : 'lg:order-2'
                  }`}
                >
                  <img
                    loading="lazy"
                    src={step.image}
                    alt=""
                    aria-hidden="true"
                    className="h-64 w-full rounded-xl object-cover"
                  />
                </div>

                <div className={imageFirst ? 'lg:order-2' : 'lg:order-1'}>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 text-xs font-bold text-cyan-400">
                    {step.number}
                  </span>
                  <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-white">
                    {step.title}
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-slate-400">{step.description}</p>

                  <ul className="mt-6 space-y-2.5">
                    {step.tips.map((tip) => (
                      <li key={tip} className="flex items-start gap-2.5">
                        <Check size={13} strokeWidth={3} className="mt-0.5 shrink-0 text-cyan-400" />
                        <span className="text-xs leading-relaxed text-slate-300">{tip}</span>
                      </li>
                    ))}
                  </ul>

                  {step.cta && (
                    <Link
                      to={step.cta.to}
                      className="mt-7 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-[#0e141c] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:border-slate-600 hover:bg-[#141b26]"
                    >
                      {step.cta.label} <ArrowRight size={13} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Services strip */}
      <section className="border-t border-white/[0.06] bg-[#0a1017] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
              Services that power your journey
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              From hands-on learning to high-grade delivery, our services are designed to support
              students and organizations alike.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                      className="h-32 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${accent.tile}`}>
                      <Icon size={16} />
                    </span>
                    <h3 className="mt-4 text-sm font-bold text-white">{title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-400">{tagline}</p>
                    <span className={`mt-auto inline-flex items-center gap-1.5 pt-5 text-xs font-semibold ${accent.text}`}>
                      Learn more
                      <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 text-sm font-medium text-cyan-400 transition-colors hover:underline"
            >
              Explore all services <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Process at a glance */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
              The process at a glance
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              A frictionless flow designed to take you from zero to landing high-impact tech work.
            </p>
          </div>

          <ol className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
            {glance[activeRole].map(({ label, blurb }, i) => (
              <li key={label}>
                <span className="text-[11px] font-bold text-cyan-400">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="mt-2 block h-px w-full bg-slate-800" />
                <span className="mt-4 block text-sm font-bold text-white">{label}</span>
                <span className="mt-1 block text-xs leading-relaxed text-slate-500">{blurb}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-white/[0.06] bg-[#0a1017] py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-sm text-slate-400">
              Got queries? Find direct answers about our programs, teaching structure, and career
              pathways.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const open = openFaq === i;
              return (
                <div key={faq.q} className="overflow-hidden rounded-xl border border-slate-800 bg-[#0e141c]">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-sm font-bold text-white">{faq.q}</span>
                    <span className="shrink-0 text-cyan-400">
                      {open ? <Minus size={16} /> : <Plus size={16} />}
                    </span>
                  </button>
                  {open && (
                    <p className="px-5 pb-5 text-xs leading-relaxed text-slate-400">{faq.a}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-[#0e141c] px-6 py-14 text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
            Ready to build, learn, and grow?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-slate-400">
            Join ebringgs today and level up your skills alongside an elite tech community.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3.5 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300"
            >
              Enroll in a program
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:border-slate-600 hover:bg-white/5"
            >
              Talk to our team
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
