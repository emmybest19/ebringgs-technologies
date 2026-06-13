import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, ArrowRight, HelpCircle, ChevronDown,
  Code2, Smartphone, Zap, Users, Building2,
  Briefcase, GraduationCap, BarChart3, BookOpen, Layers,
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';

// ─── Types ──────────────────────────────────────────────────────────────────
type PricingTab = 'clients' | 'training';

interface ServicePlan {
  id: string;
  name: string;
  subtitle: string;
  icon: typeof Code2;
  startingPrice: number | null; // null = "Custom"
  priceSuffix: string;
  description: string;
  features: string[];
  highlight: boolean;
  cta: string;
  badge?: string;
}

interface TrainingPlan {
  id: string;
  name: string;
  icon: typeof Zap;
  price: number;
  duration: string;
  description: string;
  color: string;
  bg: string;
  features: string[];
  notIncluded: string[];
  cta: string;
  highlight: boolean;
}

// ─── Client Service Plans ───────────────────────────────────────────────────
const clientPlans: ServicePlan[] = [
  {
    id: 'web-development',
    name: 'Web Development',
    subtitle: 'Landing pages · marketing sites · full-stack apps',
    icon: Code2,
    startingPrice: 150000,
    priceSuffix: '',
    description: 'From a single high-converting landing page to a full-stack web application with authentication, payments and an admin panel — built on a modern React + Node stack and deployed to your domain.',
    features: [
      'Responsive design (mobile · tablet · desktop)',
      'React + TypeScript frontend',
      'Node.js + MongoDB backend (for full-stack)',
      'User authentication & role management',
      'Payment integration (Paystack / Stripe)',
      'SEO-friendly structure',
      'Deployment to your domain',
      '7–30 days of post-launch support',
    ],
    highlight: true,
    cta: 'Browse packages',
    badge: 'Most requested',
  },
  {
    id: 'mobile-app-development',
    name: 'Mobile App Development',
    subtitle: 'Cross-platform iOS & Android with React Native',
    icon: Smartphone,
    startingPrice: 1500000,
    priceSuffix: '',
    description: 'Cross-platform mobile apps built with React Native — one codebase, both stores. Includes auth, push notifications, and submission to TestFlight + Google Play internal testing.',
    features: [
      'iOS + Android from one codebase',
      'Up to 8 polished app screens',
      'User authentication & profile',
      'Push notifications setup',
      'TestFlight + Google Play internal release',
      '30 days of post-launch support',
      'Backend integration (existing API or built fresh)',
    ],
    highlight: false,
    cta: 'View the package',
  },
  {
    id: 'research-writing',
    name: 'Research Writing',
    subtitle: 'Undergraduate · MSc · PhD · journal manuscripts',
    icon: BookOpen,
    startingPrice: 100000,
    priceSuffix: '',
    description: 'End-to-end academic writing support — topic refinement, literature review, methodology, analysis, and citation. From BSc projects to PhD chapters and journal-ready manuscripts.',
    features: [
      'Up to 12,000 words for postgraduate',
      'Literature review with up to 50 sources',
      'Methodology section with justification',
      'Analysis with appropriate statistical depth',
      'Plagiarism-checked output',
      'APA / MLA / Harvard / Chicago / IEEE citations',
      'Reference manager file (Zotero / EndNote)',
      '1–2 rounds of revisions',
    ],
    highlight: false,
    cta: 'View packages',
  },
  {
    id: 'data-analysis',
    name: 'Data Analysis',
    subtitle: 'Dashboards · reports · machine learning',
    icon: BarChart3,
    startingPrice: 400000,
    priceSuffix: '',
    description: 'Interactive dashboards on Metabase or Power BI, weekly automated reports, and predictive models. We connect to your data sources and surface the KPIs that actually matter.',
    features: [
      'Connected dashboard (up to 3 data sources)',
      'Up to 8 KPI charts',
      'Automated weekly email report',
      'PostgreSQL / MongoDB / Sheets / Stripe support',
      '1-hour training session',
      'Machine learning add-on (₦800,000)',
    ],
    highlight: false,
    cta: 'View the package',
  },
];

// ─── Training Tracks ────────────────────────────────────────────────────────
// 5 student tracks (frontend, backend, full-stack, mobile, research writing).
// Each has 3 tiers: Starter (live classes only), Live Cohort (cohort + projects),
// Mentorship (1-on-1). Plan IDs match Checkout.tsx planDetails — if you rename
// one here, update there + AdminCohorts PLAN_OPTIONS too.
const trainingCategories = [
  {
    category: 'Frontend Development',
    stack: 'HTML · CSS · JavaScript · TypeScript · React · Tailwind · Vite',
    plans: [
      {
        id: 'frontend-starter',
        name: 'Starter',
        icon: Zap,
        price: 75000,
        duration: '8 weeks',
        description: 'Live instructor-led classes covering modern frontend from zero to React.',
        color: 'text-teal-600',
        bg: 'bg-teal-50',
        features: [
          'Stack: HTML, CSS, JavaScript, TypeScript',
          'React + Vite + Tailwind from scratch',
          'Responsive layouts & accessibility basics',
          'Git, GitHub & deployment to Vercel',
          'Live classes (2×/week)',
          'Community forum access',
          'Certificate of completion',
        ],
        notIncluded: ['Capstone project', '1-on-1 mentorship'],
        cta: 'Start learning',
        highlight: false,
      },
      {
        id: 'frontend-cohort',
        name: 'Live Cohort',
        icon: Users,
        price: 250000,
        duration: '12 weeks',
        description: 'Intensive 12-week cohort — build & ship a real React app with mentor reviews.',
        color: 'text-white',
        bg: 'bg-white/20',
        features: [
          'Everything in Starter',
          'Advanced React (hooks, context, suspense)',
          'State management with Zustand / TanStack Query',
          'Real-world capstone project',
          'Daily live classes',
          '1-on-1 mentor calls (2×/month)',
          'Career coaching & CV review',
          'Job referral network',
        ],
        notIncluded: [],
        cta: 'Join next cohort',
        highlight: true,
      },
      {
        id: 'frontend-mentor',
        name: '1-on-1 Mentorship',
        icon: Building2,
        price: 450000,
        duration: '12 weeks',
        description: 'Personal mentorship with a senior frontend engineer.',
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        features: [
          'Everything in Live Cohort',
          'Weekly 1-on-1 sessions',
          'Custom learning roadmap',
          'Personal portfolio project',
          'Code reviews on every PR',
          'Direct Slack access to mentor',
          'Interview prep & mock calls',
        ],
        notIncluded: [],
        cta: 'Book a mentor',
        highlight: false,
      },
    ] as TrainingPlan[],
  },
  {
    category: 'Backend Development',
    stack: 'Node.js · Express · TypeScript · MongoDB · REST APIs · JWT auth',
    plans: [
      {
        id: 'backend-starter',
        name: 'Starter',
        icon: Zap,
        price: 80000,
        duration: '8 weeks',
        description: 'Live classes building production-style REST APIs end-to-end.',
        color: 'text-teal-600',
        bg: 'bg-teal-50',
        features: [
          'Stack: Node.js, Express, TypeScript',
          'MongoDB + Mongoose data modelling',
          'Building REST APIs from scratch',
          'JWT authentication & middleware',
          'Postman testing & API docs',
          'Live classes (2×/week)',
          'Community forum access',
          'Certificate of completion',
        ],
        notIncluded: ['Capstone API project', '1-on-1 mentorship'],
        cta: 'Start learning',
        highlight: false,
      },
      {
        id: 'backend-cohort',
        name: 'Live Cohort',
        icon: Users,
        price: 270000,
        duration: '12 weeks',
        description: 'Build a real production API — auth, payments, deployment, the works.',
        color: 'text-white',
        bg: 'bg-white/20',
        features: [
          'Everything in Starter',
          'Stripe / Paystack payment integration',
          'WebSocket real-time features',
          'Deployment to Render / Railway / AWS',
          'Capstone: ship a real API to production',
          'Daily live classes',
          '1-on-1 mentor calls (2×/month)',
          'Career coaching',
        ],
        notIncluded: [],
        cta: 'Join next cohort',
        highlight: true,
      },
      {
        id: 'backend-mentor',
        name: '1-on-1 Mentorship',
        icon: Building2,
        price: 480000,
        duration: '12 weeks',
        description: 'Personal mentorship with a senior backend engineer.',
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        features: [
          'Everything in Live Cohort',
          'Weekly 1-on-1 architecture sessions',
          'Code reviews on your own project',
          'System design deep-dives',
          'Performance & security reviews',
          'Direct Slack access to mentor',
          'Interview prep & mock calls',
        ],
        notIncluded: [],
        cta: 'Book a mentor',
        highlight: false,
      },
    ] as TrainingPlan[],
  },
  {
    category: 'Full-Stack Development',
    stack: 'React · Node.js · TypeScript · MongoDB · Tailwind · Auth · Payments',
    plans: [
      {
        id: 'fullstack-starter',
        name: 'Starter',
        icon: Zap,
        price: 100000,
        duration: '10 weeks',
        description: 'Live classes covering both halves of a modern web app from end to end.',
        color: 'text-teal-600',
        bg: 'bg-teal-50',
        features: [
          'Stack: React + Node + MongoDB',
          'Frontend with React + TypeScript + Tailwind',
          'Backend with Express + Mongoose',
          'JWT auth wired end-to-end',
          'Git, GitHub & deployment',
          'Live classes (3×/week)',
          'Community forum access',
          'Certificate of completion',
        ],
        notIncluded: ['Capstone product', '1-on-1 mentorship'],
        cta: 'Start learning',
        highlight: false,
      },
      {
        id: 'fullstack-cohort',
        name: 'Live Cohort',
        icon: Users,
        price: 320000,
        duration: '14 weeks',
        description: 'The intensive — ship a real full-stack product to production with mentor support.',
        color: 'text-white',
        bg: 'bg-white/20',
        features: [
          'Everything in Starter',
          'Payment integration (Paystack / Stripe)',
          'Push notifications & email flows',
          'Admin dashboards & role-based access',
          'Real production capstone',
          'Daily live classes',
          '1-on-1 mentor calls (2×/month)',
          'Career coaching & CV review',
          'Job referral network',
        ],
        notIncluded: [],
        cta: 'Join next cohort',
        highlight: true,
      },
      {
        id: 'fullstack-mentor',
        name: '1-on-1 Mentorship',
        icon: Building2,
        price: 550000,
        duration: '14 weeks',
        description: 'Personal mentorship with a senior full-stack engineer.',
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        features: [
          'Everything in Live Cohort',
          'Weekly 1-on-1 sessions',
          'Code reviews on every commit',
          'Custom roadmap for your goal',
          'Architecture deep-dives',
          'Direct Slack access to mentor',
          'Interview prep & mock calls',
        ],
        notIncluded: [],
        cta: 'Book a mentor',
        highlight: false,
      },
    ] as TrainingPlan[],
  },
  {
    category: 'Mobile App Development',
    stack: 'React Native · Expo · TypeScript · Push notifications · Native modules',
    plans: [
      {
        id: 'mobile-dev-starter',
        name: 'Starter',
        icon: Zap,
        price: 85000,
        duration: '8 weeks',
        description: 'Live classes on React Native and cross-platform mobile development.',
        color: 'text-teal-600',
        bg: 'bg-teal-50',
        features: [
          'Stack: React Native, Expo, TypeScript',
          'Navigation & state management',
          'REST API integration',
          'Local storage & offline data',
          'Live classes (2×/week)',
          'Community forum access',
          'Certificate of completion',
        ],
        notIncluded: ['App store publishing', '1-on-1 mentorship'],
        cta: 'Start learning',
        highlight: false,
      },
      {
        id: 'mobile-dev-cohort',
        name: 'Live Cohort',
        icon: Users,
        price: 280000,
        duration: '10 weeks',
        description: 'Build and ship a real mobile app in 10 weeks with daily live classes.',
        color: 'text-white',
        bg: 'bg-white/20',
        features: [
          'Everything in Starter',
          'Push notifications setup',
          'Offline-first data sync',
          'Build & publish to TestFlight + Google Play',
          'Native modules (camera, geolocation)',
          'Daily live classes',
          '1-on-1 mentor calls (2×/month)',
          'Career support',
        ],
        notIncluded: [],
        cta: 'Join next cohort',
        highlight: true,
      },
      {
        id: 'mobile-dev-mentor',
        name: '1-on-1 Mentorship',
        icon: Building2,
        price: 500000,
        duration: '12 weeks',
        description: 'Personal mentorship with a senior mobile engineer.',
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        features: [
          'Everything in Live Cohort',
          'Weekly 1-on-1 sessions',
          'Custom app project',
          'Architecture & code reviews',
          'Direct Slack access to mentor',
          'Interview prep & mock calls',
        ],
        notIncluded: [],
        cta: 'Book a mentor',
        highlight: false,
      },
    ] as TrainingPlan[],
  },
  {
    category: 'Research Writing',
    stack: 'Academic methodology · Literature review · APA/MLA/Chicago · Zotero · Plagiarism tools',
    plans: [
      {
        id: 'research-writing-starter',
        name: 'Starter',
        icon: Zap,
        price: 50000,
        duration: '6 weeks',
        description: 'Live classes on academic writing fundamentals — structure, citations, methodology.',
        color: 'text-teal-600',
        bg: 'bg-teal-50',
        features: [
          'Academic writing fundamentals',
          'Citation styles: APA, MLA, Chicago, Harvard',
          'Reference management (Zotero / Mendeley)',
          'Literature review techniques',
          'Avoiding plagiarism',
          'Live classes (2×/week)',
          'Community forum access',
          'Certificate of completion',
        ],
        notIncluded: ['Capstone paper review', '1-on-1 mentorship'],
        cta: 'Start learning',
        highlight: false,
      },
      {
        id: 'research-writing-cohort',
        name: 'Live Cohort',
        icon: Users,
        price: 150000,
        duration: '8 weeks',
        description: '8-week intensive — research methodology, statistical analysis, and journal-ready writing.',
        color: 'text-white',
        bg: 'bg-white/20',
        features: [
          'Everything in Starter',
          'Quantitative & qualitative methodology',
          'Statistical analysis (regression, ANOVA, chi-square)',
          'Writing journal-quality manuscripts',
          'Peer review workshops',
          'Daily live classes',
          'Mentor critique on your paper drafts (2×/month)',
          'Submission strategy for top journals',
        ],
        notIncluded: [],
        cta: 'Join next cohort',
        highlight: true,
      },
      {
        id: 'research-writing-mentor',
        name: '1-on-1 Mentorship',
        icon: Building2,
        price: 320000,
        duration: '12 weeks',
        description: 'Personal mentorship with a researcher — your paper, your timeline.',
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        features: [
          'Everything in Live Cohort',
          'Weekly 1-on-1 sessions',
          'Line-by-line review of your own paper',
          'Methodology design for your topic',
          'Supervisor-feedback style critique',
          'Direct Slack access to mentor',
          'Defence / viva preparation',
        ],
        notIncluded: [],
        cta: 'Book a mentor',
        highlight: false,
      },
    ] as TrainingPlan[],
  },
];

// ─── FAQs ───────────────────────────────────────────────────────────────────
const faqs = [
  {
    q: 'How do client project prices work?',
    a: 'Our listed prices are starting points. Every project is unique — after an initial consultation, we provide a detailed scope and fixed quote before any work begins. No surprises.',
  },
  {
    q: 'Can I switch training plans at any time?',
    a: 'Yes. You can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit/debit cards and bank transfers via Paystack. We also support direct bank transfers for client projects and consulting engagements.',
  },
  {
    q: 'When does the next training cohort start?',
    a: 'Cohorts open every quarter. Register now and we\'ll notify you when the next intake begins.',
  },
  {
    q: 'Do you offer discounts for groups or organizations?',
    a: 'Yes. We offer discounted rates for teams of 5 or more. Reach out via the Contact page for a custom quote.',
  },
  {
    q: 'What happens after I pay for a client project?',
    a: 'You\'ll get a kickoff call within 48 hours. We map out milestones, set up a shared project tracker, and begin design or development immediately.',
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatNGN = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);

// ─── Components ─────────────────────────────────────────────────────────────
function FAQItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
      >
        <span className="font-medium text-gray-900 dark:text-white text-sm">{q}</span>
        <ChevronDown size={16} className={`text-gray-400 dark:text-slate-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-6 pb-4 text-sm text-gray-600 dark:text-slate-400 leading-relaxed border-t border-gray-50 dark:border-slate-800">
          <div className="pt-3">{a}</div>
        </div>
      )}
    </div>
  );
}

function ClientCard({ plan }: { plan: ServicePlan }) {
  const Icon = plan.icon;
  return (
    <div
      className={`card-hover-border relative rounded-2xl flex flex-col transition-all duration-300 ${
        plan.highlight
          ? 'bg-gradient-to-br from-teal-600 to-emerald-700 shadow-2xl shadow-teal-500/25 ring-1 ring-teal-400/20 md:scale-[1.03]'
          : 'bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-teal-200 dark:hover:border-teal-800'
      }`}
    >
      {plan.highlight && (
        <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-t-2xl" />
      )}

      <div className="p-7 flex-1 flex flex-col">
        {/* Badge + Icon */}
        <div className="flex items-center justify-between mb-4">
          <div className={`inline-flex p-3 rounded-xl ${plan.highlight ? 'bg-white/15' : 'bg-teal-50 dark:bg-teal-950'}`}>
            <Icon size={22} className={plan.highlight ? 'text-white' : 'text-teal-600 dark:text-teal-400'} />
          </div>
          {plan.badge && (
            <span className="px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full text-xs font-bold text-white shadow-sm">
              {plan.badge}
            </span>
          )}
        </div>

        <h3 className={`text-lg font-bold mb-0.5 ${plan.highlight ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
          {plan.name}
        </h3>
        <p className={`text-xs font-medium mb-3 ${plan.highlight ? 'text-teal-200' : 'text-teal-600 dark:text-teal-400'}`}>
          {plan.subtitle}
        </p>
        <p className={`text-sm leading-relaxed mb-5 ${plan.highlight ? 'text-teal-100' : 'text-gray-500 dark:text-slate-400'}`}>
          {plan.description}
        </p>

        {/* Price */}
        <div className="mb-6">
          {plan.priceSuffix && (
            <span className={`text-xs uppercase tracking-wide font-medium ${plan.highlight ? 'text-teal-300' : 'text-gray-400 dark:text-slate-500'}`}>
              {plan.priceSuffix}
            </span>
          )}
          <div className={`text-3xl font-extrabold ${plan.highlight ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
            {formatNGN(plan.startingPrice ?? 0)}
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-2.5 flex-1 mb-6">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              <CheckCircle2 size={15} className={`shrink-0 mt-0.5 ${plan.highlight ? 'text-teal-200' : 'text-teal-600 dark:text-teal-400'}`} />
              <span className={`text-sm ${plan.highlight ? 'text-teal-100' : 'text-gray-600 dark:text-slate-400'}`}>{f}</span>
            </li>
          ))}
        </ul>

        <Link
          to="/services"
          className={`w-full py-3 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
            plan.highlight
              ? 'bg-white text-teal-700 hover:bg-teal-50 shadow-lg'
              : 'bg-teal-600 text-white hover:bg-teal-700'
          }`}
        >
          {plan.cta} <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

function TrainingCard({ plan }: { plan: TrainingPlan }) {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const Icon = plan.icon;

  const handleSelect = () => {
    if (!isAuthenticated) { navigate('/register'); return; }
    navigate(`/checkout?plan=${plan.id}`);
  };

  return (
    <div
      className={`card-hover-border relative rounded-2xl flex flex-col ${
        plan.highlight
          ? 'bg-gradient-to-br from-teal-600 to-emerald-700 shadow-2xl shadow-teal-500/25 ring-1 ring-teal-400/20 md:scale-[1.03]'
          : 'bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow'
      }`}
    >
      {plan.highlight && (
        <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-t-2xl" />
      )}

      <div className="p-7 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className={`inline-flex p-2.5 rounded-xl ${plan.highlight ? 'bg-white/15' : plan.bg}`}>
            <Icon size={22} className={plan.highlight ? 'text-white' : plan.color} />
          </div>
          {plan.highlight && (
            <span className="px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full text-xs font-bold text-white shadow-sm">
              Most popular
            </span>
          )}
        </div>

        <h3 className={`text-xl font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
          {plan.name}
        </h3>
        <p className={`text-sm mb-5 ${plan.highlight ? 'text-teal-200' : 'text-gray-500 dark:text-slate-400'}`}>
          {plan.description}
        </p>

        <div className="mb-2">
          <span className={`text-3xl font-extrabold ${plan.highlight ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
            {formatNGN(plan.price)}
          </span>
        </div>
        <div className="flex items-center gap-2 mb-6">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${plan.highlight ? 'bg-white/15 text-teal-100' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'}`}>
            {plan.duration}
          </span>
        </div>

        <ul className="space-y-2.5 flex-1 mb-6">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              <CheckCircle2 size={15} className={`shrink-0 mt-0.5 ${plan.highlight ? 'text-teal-200' : 'text-teal-600'}`} />
              <span className={`text-sm ${plan.highlight ? 'text-teal-100' : 'text-gray-600 dark:text-slate-400'}`}>{f}</span>
            </li>
          ))}
          {plan.notIncluded.map((f) => (
            <li key={f} className="flex items-start gap-2.5 opacity-40">
              <div className="shrink-0 mt-1.5 w-4 h-px bg-current" />
              <span className={`text-sm ${plan.highlight ? 'text-teal-200' : 'text-gray-400 dark:text-slate-500'}`}>{f}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={handleSelect}
          className={`w-full py-3 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
            plan.highlight
              ? 'bg-white text-teal-700 hover:bg-teal-50 shadow-lg'
              : 'bg-teal-600 text-white hover:bg-teal-700'
          }`}
        >
          {plan.cta} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function Pricing() {
  const [tab, setTab] = useState<PricingTab>('clients');
  const [activeTrainingCat, setActiveTrainingCat] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-white dark:bg-slate-900">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-teal-950 to-cyan-950 text-white py-24 px-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Pricing that fits{' '}
            <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">your goals</span>
          </h1>
          <p className="text-slate-300 text-lg mb-10 max-w-xl mx-auto">
            Whether you're a business looking to build or a learner ready to grow — we've got a plan for you.
          </p>

          {/* ── Main Toggle: Clients / Training ─────────────────────── */}
          <div className="inline-flex items-center gap-1 bg-white/10 rounded-2xl p-1.5 border border-white/15 backdrop-blur">
            <button
              onClick={() => setTab('clients')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === 'clients' ? 'bg-white text-gray-900 shadow-lg' : 'text-white/70 hover:text-white'
              }`}
            >
              <Briefcase size={16} />
              Client Services
            </button>
            <button
              onClick={() => setTab('training')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === 'training' ? 'bg-white text-gray-900 shadow-lg' : 'text-white/70 hover:text-white'
              }`}
            >
              <GraduationCap size={16} />
              Training Programs
            </button>
          </div>
        </div>
      </section>

      {/* ── Client Plans ───────────────────────────────────────────────── */}
      {tab === 'clients' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wide mb-2">
              For businesses & organisations
            </p>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Choose what you want to build
            </h2>
            <p className="text-gray-500 dark:text-slate-400 max-w-lg mx-auto">
              Fixed-price packages with fixed scope. Every project starts with a free consultation — pick a package, brief us, we deliver.
            </p>
          </div>

          {/* 4 cards: 2-up on tablet, 4-up on desktop */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {clientPlans.map((plan) => (
              <ClientCard key={plan.id} plan={plan} />
            ))}
          </div>

          {/* Enterprise CTA */}
          <div className="mt-12 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-bold text-white text-lg mb-1">Need something bigger? Enterprise & agency partnerships</h3>
              <p className="text-slate-400 text-sm">Dedicated teams, SLA-backed delivery, ongoing retainers. Let's talk scope.</p>
            </div>
            <Link
              to="/contact"
              className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-500 transition-colors text-sm shadow-lg shadow-teal-600/20"
            >
              Schedule a call <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      )}

      {/* ── Training Plans ─────────────────────────────────────────────── */}
      {tab === 'training' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wide mb-2">
              For learners & career switchers
            </p>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Pick your learning track
            </h2>
            <p className="text-gray-500 dark:text-slate-400 max-w-lg mx-auto mb-8">
              Each track offers three tiers — Starter, Live Cohort, or 1-on-1 Mentorship. All classes are taught live by our instructors. One fixed fee per tier.
            </p>
          </div>

          {/* Category tabs */}
          <div className="flex justify-center gap-2 mb-6 flex-wrap">
            {trainingCategories.map((cat, idx) => (
              <button
                key={cat.category}
                onClick={() => setActiveTrainingCat(idx)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTrainingCat === idx
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/20'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.category}
              </button>
            ))}
          </div>

          {/* Stack badge — what students will learn in this track */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center gap-2 max-w-3xl px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <Layers size={14} className="text-teal-600 shrink-0" />
              <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide shrink-0">
                You'll learn
              </span>
              <span className="text-sm text-gray-700 dark:text-slate-300 font-medium">
                {trainingCategories[activeTrainingCat].stack}
              </span>
            </div>
          </div>

          {/* Plans grid */}
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {trainingCategories[activeTrainingCat].plans.map((plan) => (
              <TrainingCard key={plan.id} plan={plan} />
            ))}
          </div>

          {/* Cross-sell to clients */}
          <div className="mt-12 rounded-2xl bg-teal-50 dark:bg-teal-950 border border-teal-100 dark:border-teal-900 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">Looking to hire us instead?</h3>
              <p className="text-gray-500 dark:text-slate-400 text-sm">Check out our client services for web, mobile, and design projects.</p>
            </div>
            <button
              onClick={() => { setTab('clients'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="shrink-0 inline-flex items-center gap-2 px-6 py-3 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 font-semibold rounded-xl hover:bg-teal-100 dark:hover:bg-teal-900 transition-colors text-sm"
            >
              View client pricing <ArrowRight size={16} />
            </button>
          </div>
        </section>
      )}

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section className="bg-gray-50 dark:bg-slate-950 py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 justify-center mb-3">
            <HelpCircle size={20} className="text-teal-600" />
            <span className="text-sm font-medium text-teal-600 uppercase tracking-wide">FAQ</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} isOpen={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
