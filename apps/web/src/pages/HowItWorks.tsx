import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, UserPlus, Search, CreditCard, BookOpen, Video,
  Award, Code2, MessageSquare, FolderOpen, BarChart3, CheckCircle2,
  GraduationCap, Briefcase, Users,
} from 'lucide-react';
import { useSEO } from '@ebringgs/ui';

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

/* ─── Page ──────────────────────────────────────────────────────────────────── */

export default function HowItWorks() {
  const [activeRole, setActiveRole] = useState<Role>('student');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const steps = stepsByRole[activeRole];

  useSEO({
    title: 'How It Works',
    description: 'A step-by-step guide for students and clients to get started with E-Bringgs Technologies.',
  });

  return (
    <div className="bg-white dark:bg-slate-900">
      {/* Hero */}
      <section className="relative text-white py-24 px-4 overflow-hidden">
        <img src="/images/general/african-students.jpg" alt="Getting started" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-br from-slate-900/90 to-teal-950/85" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">How It Works</h1>
          <p className="text-slate-300 text-lg max-w-xl mx-auto">
            Whether you're here to learn or to build, here's your step-by-step guide to getting the most out of E-Bringgs.
          </p>
        </div>
      </section>

      {/* Role selector */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-2 gap-4">
          {roles.map(({ key, label, icon: Icon, description }) => (
            <button
              key={key}
              onClick={() => setActiveRole(key)}
              className={`flex items-center gap-4 p-5 md:p-6 rounded-2xl border-2 text-left transition-all duration-200 ${
                activeRole === key
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-950 shadow-lg shadow-teal-500/10'
                  : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-teal-200 dark:hover:border-teal-800'
              }`}
            >
              <div className={`p-3 rounded-xl shrink-0 ${activeRole === key ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className={`font-bold text-lg ${activeRole === key ? 'text-teal-700 dark:text-teal-300' : 'text-gray-900 dark:text-white'}`}>{label}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
        <div className="space-y-20">
          {steps.map((step, i) => {
            const isEven = i % 2 === 1;
            return (
              <div
                key={step.number}
                className={`grid md:grid-cols-2 gap-10 md:gap-14 items-center ${isEven ? 'md:direction-rtl' : ''}`}
              >
                {/* Image side */}
                <div className={`${isEven ? 'md:order-2' : ''}`}>
                  <div className="relative rounded-2xl overflow-hidden shadow-xl group">
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-64 md:h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <div className="w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center font-extrabold text-lg shadow-lg">
                        {step.number}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content side */}
                <div className={`${isEven ? 'md:order-1' : ''}`}>
                  <div className="inline-flex p-3 bg-teal-50 dark:bg-teal-950 rounded-xl mb-4">
                    <step.icon size={22} className="text-teal-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{step.title}</h3>
                  <p className="text-gray-500 dark:text-slate-400 leading-relaxed mb-5">{step.description}</p>

                  {/* Tips */}
                  <div className="space-y-2 mb-6">
                    {step.tips.map((tip) => (
                      <div key={tip} className="flex items-start gap-2.5">
                        <CheckCircle2 size={16} className="text-teal-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600 dark:text-slate-400">{tip}</span>
                      </div>
                    ))}
                  </div>

                  {step.cta && (
                    <Link
                      to={step.cta.to}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors"
                    >
                      {step.cta.label} <ArrowRight size={16} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* At a glance, visual summary */}
      <section className="bg-linear-to-br from-slate-50 to-teal-50 dark:from-slate-950 dark:to-teal-950 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">At a glance</h2>
          <p className="text-gray-500 dark:text-slate-400 text-center max-w-xl mx-auto mb-14">Here's the full journey in one view.</p>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-0 right-0 h-0.5 bg-linear-to-r from-teal-200 via-teal-400 to-teal-200 dark:from-teal-800 dark:via-teal-600 dark:to-teal-800" />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {steps.map((step) => (
                <div key={step.number} className="relative flex flex-col items-center text-center">
                  <div className="relative z-10 w-16 h-16 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-lg mb-4">
                    <step.icon size={24} />
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{step.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">Common questions</h2>
        <p className="text-gray-500 dark:text-slate-400 text-center mb-12">Still unsure? These should help.</p>

        <div className="space-y-4">
          {faqs.map(({ q, a }, i) => (
            <div key={q} className="bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between cursor-pointer px-6 py-5 text-left text-gray-900 dark:text-white font-medium"
              >
                {q}
                <span className={`ml-4 text-teal-500 text-xl font-bold transition-transform duration-200 ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
              </button>
              {openFaq === i && (
                <div className="px-6 pb-5 text-gray-500 dark:text-slate-400 text-sm leading-relaxed">
                  {a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 px-4 text-center text-white overflow-hidden">
        <img src="/images/hero/team-collaboration.jpg" alt="Get started" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-br from-teal-700/90 to-emerald-800/90" />
        <div className="relative">
          <Users size={36} className="mx-auto mb-5 text-teal-200" />
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ready to get started?</h2>
          <p className="text-teal-200 text-lg mb-8 max-w-xl mx-auto">
            Join hundreds of students and clients already using E-Bringgs to learn, build, and grow.
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
      </section>
    </div>
  );
}
