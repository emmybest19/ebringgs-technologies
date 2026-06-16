/**
 * Tutoring catalog — server-authoritative source of truth for the
 * student-facing learning tracks (group cohorts + 1-on-1 mentorship).
 *
 * Distinct from `services.catalog.ts`, which is for client-facing
 * productized services (websites, apps, dashboards we BUILD for clients).
 * This catalog is what we TEACH to students.
 *
 * IDs intentionally match `planDetails` in `frontend/src/pages/Checkout.tsx`,
 * so a tutoring purchase flows through the same Checkout/Paystack pipe and
 * gets picked up by the cohort countdown on the student Overview
 * (which reads `Transaction.metadata.planId`).
 *
 * Prices are positioned in the mid-market band for Nigerian tutoring
 * (₦120k–₦300k for cohorts, ~2× for 1-on-1 mentorship).
 */

export type TutoringTier = 'cohort' | 'mentorship';

export interface TutoringSyllabusModule {
  week: string;     // e.g. "Week 1" or "Weeks 5-6"
  title: string;
  topics: string[];
}

export interface TutoringFAQ {
  q: string;
  a: string;
}

export interface TutoringTrack {
  /** Stable ID — matches Checkout.tsx planDetails so the purchase flow works. */
  id: string;
  /** Top-level group: "Software Development", "Mobile App Development", etc. */
  category: string;
  /** Optional sub-track within a category (only Software Development uses this). */
  subTrack?: 'Frontend' | 'Backend' | 'Full-Stack';
  /** "cohort" = small group, "mentorship" = private 1-on-1. */
  tier: TutoringTier;
  /** Card / page title — e.g. "Frontend Development — Cohort". */
  title: string;
  /** Short summary for cards (1-2 sentences). */
  summary: string;
  /** lucide icon name — keys match the iconMap in the React page. */
  icon: string;
  /** Full naira (not kobo). */
  priceNgn: number;
  /** Length in weeks — drives any future "Cohort starts in X weeks" UI. */
  durationWeeks: number;
  /** Human label — "12 weeks", "10 weeks", etc. */
  durationLabel: string;
  /** Delivery format — "Live online" / "1-on-1 live online". */
  format: string;
  /** Class-size copy — "Up to 12 students" or "Just you and the mentor". */
  classSize: string;
  /** Expected weekly time investment from the student. */
  weeklyCommitment: string;
  /** Bulleted prerequisites — "Comfortable with a laptop", etc. */
  prerequisites: string[];
  /** What the student will be able to DO by the end. */
  outcomes: string[];
  /** Week-by-week (or grouped) breakdown of topics covered. */
  syllabus: TutoringSyllabusModule[];
  /** Concrete deliverables — apps / portfolio pieces they'll ship. */
  projects: string[];
  /** What's included as part of the price. */
  whatsIncluded: string[];
  /** Things explicitly NOT included. */
  whatsNotIncluded?: string[];
  /** Plain-English refund terms. */
  refundPolicy: string;
  /** Optional FAQ items. */
  faq?: TutoringFAQ[];
  /**
   * When true, the Checkout page may offer 1×/2×/3× installments. Server
   * enforces this in paystack.controller — clients can't trick the API.
   * Defaults to true for tracks ≥ ₦200,000 (handled at the service helper).
   */
  installmentEligible?: boolean;
}

/* ───── Helpers ─────────────────────────────────────────────────────── */

const REFUND_COHORT =
  'Full refund within 7 days of cohort start if you haven\'t attended more than one session. After that, refund is pro-rated based on weeks elapsed.';

const REFUND_MENTORSHIP =
  'Full refund within 7 days of your first session if you haven\'t held more than one. After that, refund is pro-rated based on sessions held.';

const COMMON_PREREQS = [
  'A laptop and a stable internet connection',
  'Willingness to put in the weekly hours — there\'s no shortcut',
];

const COHORT_FORMAT = 'Live online — weekly classes plus recordings';
const MENTOR_FORMAT = '1-on-1 live online — sessions scheduled around your week';

const COHORT_CLASS_SIZE = 'Capped at 12 students per cohort';
const MENTOR_CLASS_SIZE = 'Just you and the mentor';

/* ───── The catalog ─────────────────────────────────────────────────── */

export const tutoringCatalog: TutoringTrack[] = [

  /* ════════════ 1. SOFTWARE DEVELOPMENT — Frontend ════════════ */
  {
    id: 'frontend-cohort',
    category: 'Software Development',
    subTrack: 'Frontend',
    tier: 'cohort',
    title: 'Frontend Development — Cohort',
    summary: 'Learn to build modern, responsive web interfaces with HTML, CSS, JavaScript, TypeScript, React, and Tailwind. By the end, you\'ll have shipped two real apps live on the web.',
    icon: 'code',
    priceNgn: 200_000,
    durationWeeks: 12,
    durationLabel: '12 weeks',
    format: COHORT_FORMAT,
    classSize: COHORT_CLASS_SIZE,
    weeklyCommitment: '6–8 hours / week',
    prerequisites: [
      ...COMMON_PREREQS,
      'No prior coding experience required — we start from absolute basics',
    ],
    outcomes: [
      'Build responsive websites from scratch using HTML, CSS, and JavaScript',
      'Write components in React with TypeScript and Tailwind CSS',
      'Wire up real APIs, handle authentication, and manage app state',
      'Deploy your work to a public URL on Vercel or Netlify',
      'Read other people\'s code without getting lost',
    ],
    syllabus: [
      { week: 'Weeks 1–2', title: 'HTML + CSS fundamentals', topics: ['Semantic HTML', 'The box model', 'Flexbox & Grid', 'Responsive design', 'Forms and accessibility basics'] },
      { week: 'Weeks 3–4', title: 'JavaScript essentials', topics: ['Variables, control flow, functions', 'Arrays, objects, destructuring', 'DOM manipulation', 'Fetch + async/await', 'Browser dev tools'] },
      { week: 'Week 5', title: 'TypeScript on top of JS', topics: ['Why types', 'Basic types and interfaces', 'Type narrowing', 'Common patterns'] },
      { week: 'Weeks 6–8', title: 'React + Tailwind', topics: ['Components and props', 'State and effects', 'Conditional rendering', 'Tailwind utility-first styling', 'Dark mode and responsive UIs'] },
      { week: 'Weeks 9–10', title: 'Real-world React', topics: ['React Router', 'Calling APIs (Axios / fetch)', 'Forms and validation', 'Authentication patterns', 'Error and loading states'] },
      { week: 'Weeks 11–12', title: 'Capstone + deploy', topics: ['Building your capstone project', 'Git/GitHub workflow', 'Deploying to Vercel', 'Custom domain setup', 'Portfolio polish'] },
    ],
    projects: [
      'A personal portfolio site (Week 4)',
      'A capstone app of your choice — past students have built habit trackers, expense managers, and event booking sites',
    ],
    whatsIncluded: [
      '12 weeks of live classes (recorded if you miss one)',
      'A private Slack channel with your cohort + instructor',
      'Weekly code reviews on your homework',
      'Capstone project mentorship and deployment support',
      'Certificate of completion',
    ],
    whatsNotIncluded: [
      'Paid third-party services (e.g. premium Vercel — the free tier is fine)',
      'Job placement guarantees — we sharpen your skills, the interviews are yours to win',
    ],
    refundPolicy: REFUND_COHORT,
    faq: [
      { q: 'What if I miss a class?', a: 'Every session is recorded and posted in the cohort channel within 24 hours.' },
      { q: 'Will I be able to get a job after?', a: 'You\'ll have the skills of a junior frontend developer and a portfolio to prove it. Interview prep is part of the final weeks but landing a job depends on you applying consistently.' },
      { q: 'Can I switch to the 1-on-1 mentorship version mid-way?', a: 'Yes — we credit the pro-rated balance you\'ve paid against the mentorship tier.' },
    ],
  },
  {
    id: 'frontend-mentor',
    category: 'Software Development',
    subTrack: 'Frontend',
    tier: 'mentorship',
    title: 'Frontend Development — 1-on-1 Mentorship',
    summary: 'The same curriculum, taught privately and adapted to your pace. Sessions scheduled around your week, code reviews on everything you write, and a roadmap built around your specific goals.',
    icon: 'code',
    priceNgn: 400_000,
    durationWeeks: 12,
    durationLabel: '12 weeks (flexible pacing)',
    format: MENTOR_FORMAT,
    classSize: MENTOR_CLASS_SIZE,
    weeklyCommitment: '6–10 hours / week (you set the pace)',
    prerequisites: COMMON_PREREQS,
    outcomes: [
      'Everything in the cohort, but tailored to your goals (career switch, building a specific product, etc.)',
      'A personalised roadmap you can keep using after the program ends',
      'Detailed code reviews on every project you submit',
      'Mock interviews if you\'re job-hunting',
    ],
    syllabus: [
      { week: 'Phase 1', title: 'Foundations', topics: ['HTML, CSS, JavaScript essentials', 'Your first deployed page', 'Dev tools and Git basics'] },
      { week: 'Phase 2', title: 'TypeScript + React', topics: ['Components and state', 'TypeScript on top of JS', 'Tailwind CSS', 'Real-world component patterns'] },
      { week: 'Phase 3', title: 'Real apps', topics: ['Routing and API integration', 'Authentication', 'State management', 'Forms and validation'] },
      { week: 'Phase 4', title: 'Your project + career prep', topics: ['Capstone scoped around your interests', 'Code review and refactoring', 'Portfolio review', 'Mock interviews on request'] },
    ],
    projects: [
      'At least two real apps shipped to production',
      'A polished portfolio showcasing your work',
    ],
    whatsIncluded: [
      'Weekly 1-on-1 live sessions (60–90 min)',
      'Async Slack/WhatsApp access for stuck-points between sessions',
      'Detailed written code reviews on every submission',
      'A personalised learning roadmap',
      'Certificate of completion + reference letter on request',
    ],
    refundPolicy: REFUND_MENTORSHIP,
    faq: [
      { q: 'Can I pause if life gets busy?', a: 'Yes — you can pause for up to 4 weeks per program without losing your slot.' },
      { q: 'What if I already know the basics?', a: 'We start the first session with a skills assessment and skip what you already know.' },
    ],
  },

  /* ════════════ 2. SOFTWARE DEVELOPMENT — Backend ════════════ */
  {
    id: 'backend-cohort',
    category: 'Software Development',
    subTrack: 'Backend',
    tier: 'cohort',
    title: 'Backend Development — Cohort',
    summary: 'Build real APIs with Node.js, Express, and MongoDB. Authentication, payments, file uploads, and deployment — by the end you\'ll have shipped a production API.',
    icon: 'server',
    priceNgn: 220_000,
    durationWeeks: 12,
    durationLabel: '12 weeks',
    format: COHORT_FORMAT,
    classSize: COHORT_CLASS_SIZE,
    weeklyCommitment: '6–8 hours / week',
    prerequisites: [
      ...COMMON_PREREQS,
      'Comfortable with basic JavaScript (we\'ll cover the rest)',
    ],
    outcomes: [
      'Design and build a REST API end-to-end with Node and Express',
      'Model data correctly with MongoDB + Mongoose',
      'Implement secure authentication with JWT and bcrypt',
      'Integrate Paystack to take real payments',
      'Deploy your API to a public host (Render or Railway)',
    ],
    syllabus: [
      { week: 'Weeks 1–2', title: 'Node + Express foundations', topics: ['Node runtime', 'Express routing', 'Middleware', 'Error handling', 'Request/response lifecycle'] },
      { week: 'Weeks 3–4', title: 'MongoDB + Mongoose', topics: ['Document modelling', 'Schemas and validation', 'Relationships', 'Indexes and queries'] },
      { week: 'Weeks 5–6', title: 'Auth + security', topics: ['Password hashing with bcrypt', 'JWT access + refresh tokens', 'Authorization patterns', 'Helmet, CORS, rate limiting'] },
      { week: 'Weeks 7–8', title: 'Real-world APIs', topics: ['File uploads (Multer)', 'Background jobs (cron)', 'Email sending', 'Logging and monitoring'] },
      { week: 'Weeks 9–10', title: 'Payments + integrations', topics: ['Paystack integration', 'Webhook handling', 'Idempotency', 'Third-party API calls'] },
      { week: 'Weeks 11–12', title: 'Capstone + deploy', topics: ['Build your capstone API', 'Environment configuration', 'Deployment to Render/Railway', 'API docs with Swagger'] },
    ],
    projects: [
      'A small CRUD API in Week 4',
      'A capstone API of your choice — past students have built booking APIs, e-commerce backends, and SaaS billing services',
    ],
    whatsIncluded: [
      '12 weeks of live classes (recorded)',
      'Private cohort Slack',
      'Weekly code reviews',
      'Capstone deployment support',
      'Certificate of completion',
    ],
    whatsNotIncluded: [
      'Hosting fees beyond the free tiers on Render / Railway',
      'A frontend — pair this with the Frontend cohort if you want to ship a full app',
    ],
    refundPolicy: REFUND_COHORT,
    faq: [
      { q: 'Do I need to know frontend?', a: 'No — you\'ll test your APIs with Postman/Insomnia. If you want to build a UI on top, take the Full-Stack track or pair this with Frontend.' },
      { q: 'Why Node and not Python / Go?', a: 'JavaScript everywhere is the fastest path to "ship a real product" in Nigeria right now. Once you know one backend stack, picking up another is mostly syntax.' },
    ],
  },
  {
    id: 'backend-mentor',
    category: 'Software Development',
    subTrack: 'Backend',
    tier: 'mentorship',
    title: 'Backend Development — 1-on-1 Mentorship',
    summary: 'Private 1-on-1 backend training built around your goals — your own API project, your own pace. Includes deep code reviews and architectural feedback on real systems.',
    icon: 'server',
    priceNgn: 420_000,
    durationWeeks: 12,
    durationLabel: '12 weeks (flexible pacing)',
    format: MENTOR_FORMAT,
    classSize: MENTOR_CLASS_SIZE,
    weeklyCommitment: '6–10 hours / week',
    prerequisites: COMMON_PREREQS,
    outcomes: [
      'Same outcomes as the cohort, but tailored to a real project of yours',
      'A production-grade API you can put on your CV',
      'Architectural feedback you wouldn\'t get from a course',
    ],
    syllabus: [
      { week: 'Phase 1', title: 'Foundations + auth', topics: ['Node + Express', 'MongoDB + Mongoose', 'JWT authentication', 'Middleware patterns'] },
      { week: 'Phase 2', title: 'Real APIs', topics: ['File handling', 'Background jobs', 'Email and notifications', 'Logging'] },
      { week: 'Phase 3', title: 'Payments + integrations', topics: ['Paystack', 'Webhooks', 'Third-party APIs'] },
      { week: 'Phase 4', title: 'Your project + handover', topics: ['Capstone build', 'Deployment', 'Architectural review'] },
    ],
    projects: [
      'A real API of your choice, built and deployed alongside the mentorship',
    ],
    whatsIncluded: [
      'Weekly 1-on-1 live sessions (60–90 min)',
      'Async Slack/WhatsApp access',
      'Detailed code reviews on every submission',
      'Personalised roadmap',
      'Certificate of completion',
    ],
    refundPolicy: REFUND_MENTORSHIP,
  },

  /* ════════════ 3. SOFTWARE DEVELOPMENT — Full-Stack ════════════ */
  {
    id: 'fullstack-cohort',
    category: 'Software Development',
    subTrack: 'Full-Stack',
    tier: 'cohort',
    title: 'Full-Stack Development — Cohort',
    summary: 'Both halves of a real web app: React frontend, Node/Express/MongoDB backend, auth, payments, deployment. By Week 14 you\'ll have shipped a complete product to production.',
    icon: 'layers',
    priceNgn: 300_000,
    durationWeeks: 14,
    durationLabel: '14 weeks',
    format: COHORT_FORMAT,
    classSize: COHORT_CLASS_SIZE,
    weeklyCommitment: '8–10 hours / week',
    prerequisites: [
      ...COMMON_PREREQS,
      'No prior coding required, but you\'ll need to commit the weekly hours — this is the most intensive cohort',
    ],
    outcomes: [
      'Build and ship a full-stack web app end-to-end',
      'Comfortable across the stack — UI, API, database, deploy',
      'Understand how the frontend and backend talk to each other',
      'Add authentication, payments, and real-time features',
      'Deploy frontend + backend together on real infrastructure',
    ],
    syllabus: [
      { week: 'Weeks 1–3', title: 'Frontend foundations', topics: ['HTML, CSS, JavaScript', 'React + TypeScript', 'Tailwind', 'Router and forms'] },
      { week: 'Weeks 4–6', title: 'Backend foundations', topics: ['Node + Express', 'MongoDB + Mongoose', 'REST API design', 'Connecting frontend to backend'] },
      { week: 'Weeks 7–8', title: 'Auth + security', topics: ['JWT tokens', 'Password hashing', 'Role-based access', 'Rate limiting + CORS'] },
      { week: 'Weeks 9–10', title: 'Real features', topics: ['File uploads', 'Email', 'Paystack integration', 'Webhooks'] },
      { week: 'Weeks 11–12', title: 'State + scale', topics: ['State management', 'Caching and performance', 'Error monitoring', 'Background jobs'] },
      { week: 'Weeks 13–14', title: 'Capstone + ship', topics: ['Building your capstone', 'Deployment (Vercel + Render)', 'Custom domain', 'Portfolio writeup'] },
    ],
    projects: [
      'A todo app in Week 6 (frontend + backend talking)',
      'A capstone product of your choice — booking app, marketplace, SaaS tool, etc.',
    ],
    whatsIncluded: [
      '14 weeks of live classes (recorded)',
      'Private cohort Slack',
      'Weekly code reviews',
      'Capstone deployment support',
      'Certificate of completion',
    ],
    refundPolicy: REFUND_COHORT,
    faq: [
      { q: 'Is this too much for a beginner?', a: 'It\'s intensive but doable. About 60% of past students started with zero coding background. The other 40% finished faster.' },
      { q: 'Will I be junior-level full-stack after this?', a: 'Yes — junior full-stack with a real shipped project on your CV.' },
    ],
  },
  {
    id: 'fullstack-mentor',
    category: 'Software Development',
    subTrack: 'Full-Stack',
    tier: 'mentorship',
    title: 'Full-Stack Development — 1-on-1 Mentorship',
    summary: 'Private full-stack mentorship — your pace, your project, deep code reviews on both halves. Best fit if you have a real product idea you want to ship while learning.',
    icon: 'layers',
    priceNgn: 500_000,
    durationWeeks: 14,
    durationLabel: '14 weeks (flexible pacing)',
    format: MENTOR_FORMAT,
    classSize: MENTOR_CLASS_SIZE,
    weeklyCommitment: '8–12 hours / week',
    prerequisites: COMMON_PREREQS,
    outcomes: [
      'Same as the cohort, tailored to a real product of yours',
      'Architectural review of the full system',
      'A shipped product on your portfolio',
    ],
    syllabus: [
      { week: 'Phase 1', title: 'Frontend foundations', topics: ['React + TypeScript', 'Tailwind', 'Routing and forms'] },
      { week: 'Phase 2', title: 'Backend foundations', topics: ['Node + Express', 'MongoDB', 'REST design'] },
      { week: 'Phase 3', title: 'Real features', topics: ['Auth', 'Payments', 'Email and uploads'] },
      { week: 'Phase 4', title: 'Your capstone', topics: ['Scoping', 'Building', 'Deploying', 'Architectural review'] },
    ],
    projects: ['A full-stack product of your choice, shipped to production'],
    whatsIncluded: [
      'Weekly 1-on-1 live sessions (60–90 min)',
      'Async Slack/WhatsApp access',
      'Detailed code reviews on every submission',
      'Personalised roadmap',
      'Certificate of completion',
    ],
    refundPolicy: REFUND_MENTORSHIP,
  },

  /* ════════════ 4. MOBILE APP DEVELOPMENT ════════════ */
  {
    id: 'mobile-dev-cohort',
    category: 'Mobile App Development',
    tier: 'cohort',
    title: 'Mobile App Development — Cohort',
    summary: 'Ship a real cross-platform app to iOS and Android from a single codebase. Pick your stack at week 1 — Flutter (Dart) or React Native (JavaScript) — and we adjust.',
    icon: 'smartphone',
    priceNgn: 250_000,
    durationWeeks: 10,
    durationLabel: '10 weeks',
    format: COHORT_FORMAT,
    classSize: COHORT_CLASS_SIZE,
    weeklyCommitment: '7–9 hours / week',
    prerequisites: [
      ...COMMON_PREREQS,
      'Basic JavaScript helps but is not required',
    ],
    outcomes: [
      'Build cross-platform mobile apps that run on iOS and Android',
      'Handle navigation, state, and async data correctly',
      'Integrate APIs, authentication, and push notifications',
      'Submit your app to TestFlight + Google Play internal testing',
    ],
    syllabus: [
      { week: 'Week 1', title: 'Stack choice + setup', topics: ['Flutter vs React Native — which fits you', 'Installing Android Studio + Xcode (or alternatives)', 'Your first "Hello World" on a real device'] },
      { week: 'Weeks 2–3', title: 'UI fundamentals', topics: ['Widgets / components', 'Layout and styling', 'Lists and scrolling', 'Forms and inputs'] },
      { week: 'Weeks 4–5', title: 'Navigation + state', topics: ['Stack and tab navigation', 'Passing data between screens', 'State management (Provider / Zustand)'] },
      { week: 'Weeks 6–7', title: 'Real apps', topics: ['Calling REST APIs', 'Authentication', 'Local storage', 'Image and file handling'] },
      { week: 'Week 8', title: 'Push + polish', topics: ['Push notifications', 'App icons and splash screens', 'Performance basics'] },
      { week: 'Weeks 9–10', title: 'Capstone + ship', topics: ['Capstone app', 'TestFlight setup', 'Google Play internal track', 'App store assets'] },
    ],
    projects: [
      'A weather/news app in Week 5',
      'A capstone app of your choice — habit trackers, social apps, and small marketplaces have all shipped',
    ],
    whatsIncluded: [
      '10 weeks of live classes (recorded)',
      'Private cohort Slack',
      'Weekly code reviews',
      'TestFlight + Play internal submission support',
      'Certificate of completion',
    ],
    whatsNotIncluded: [
      'Apple Developer (~$99/yr) and Google Play one-time ($25) account fees',
      'Public app store launch (we get you to internal testing — public review is yours)',
    ],
    refundPolicy: REFUND_COHORT,
    faq: [
      { q: 'Should I pick Flutter or React Native?', a: 'Flutter if you want the smoothest "look the same on iOS + Android" out of the box. React Native if you already know JavaScript or plan to share code with a web app.' },
      { q: 'Do I need a Mac?', a: 'No — you can build and test on Android from a Windows or Linux machine. To ship to iOS, you\'ll either need a Mac later or use a cloud build service.' },
    ],
  },
  {
    id: 'mobile-dev-mentor',
    category: 'Mobile App Development',
    tier: 'mentorship',
    title: 'Mobile App Development — 1-on-1 Mentorship',
    summary: 'Private mobile development mentorship — build your own app alongside the program, with weekly 1-on-1 sessions and detailed code reviews on every screen.',
    icon: 'smartphone',
    priceNgn: 450_000,
    durationWeeks: 10,
    durationLabel: '10 weeks (flexible pacing)',
    format: MENTOR_FORMAT,
    classSize: MENTOR_CLASS_SIZE,
    weeklyCommitment: '7–12 hours / week',
    prerequisites: COMMON_PREREQS,
    outcomes: [
      'Same as the cohort, but tailored to a real app you want to build',
      'Architectural review of your app',
      'Submission to TestFlight + Play internal',
    ],
    syllabus: [
      { week: 'Phase 1', title: 'Foundations', topics: ['Stack choice', 'UI primitives', 'Navigation'] },
      { week: 'Phase 2', title: 'State + APIs', topics: ['State management', 'API integration', 'Auth'] },
      { week: 'Phase 3', title: 'Polish', topics: ['Push notifications', 'Performance', 'Icons + splash'] },
      { week: 'Phase 4', title: 'Ship', topics: ['TestFlight', 'Play internal', 'App store assets'] },
    ],
    projects: ['A real cross-platform app of your choice, submitted to TestFlight + Play internal'],
    whatsIncluded: [
      'Weekly 1-on-1 live sessions (60–90 min)',
      'Async Slack/WhatsApp access',
      'Detailed code reviews on every screen',
      'Personalised roadmap',
      'Certificate of completion',
    ],
    refundPolicy: REFUND_MENTORSHIP,
  },

  /* ════════════ 5. DATA ANALYSIS ════════════ */
  {
    id: 'data-analysis-cohort',
    category: 'Data Analysis',
    tier: 'cohort',
    title: 'Data Analysis — Cohort',
    summary: 'Excel → SQL → Python → Power BI. Learn to turn messy data into clear answers and dashboards your team will actually use.',
    icon: 'bar-chart',
    priceNgn: 180_000,
    durationWeeks: 10,
    durationLabel: '10 weeks',
    format: COHORT_FORMAT,
    classSize: COHORT_CLASS_SIZE,
    weeklyCommitment: '5–7 hours / week',
    prerequisites: [
      ...COMMON_PREREQS,
      'Comfortable using a spreadsheet — that\'s the only baseline',
    ],
    outcomes: [
      'Clean, transform, and analyse data confidently in Excel, SQL, and Python',
      'Build dashboards in Power BI that decision-makers actually use',
      'Tell a clear story with data — not just charts, but conclusions',
      'Land a junior data analyst role with a real portfolio',
    ],
    syllabus: [
      { week: 'Weeks 1–2', title: 'Excel for analysts', topics: ['Pivot tables and lookups', 'Power Query basics', 'Conditional logic', 'Charting and dashboards in Excel'] },
      { week: 'Weeks 3–4', title: 'SQL fundamentals', topics: ['SELECT, WHERE, JOIN', 'Aggregations and grouping', 'Window functions', 'Common analyst patterns'] },
      { week: 'Weeks 5–6', title: 'Python for data', topics: ['Pandas basics', 'Cleaning messy data', 'Visualisation with matplotlib / seaborn', 'Jupyter workflow'] },
      { week: 'Weeks 7–8', title: 'Power BI', topics: ['Connecting data sources', 'DAX measures', 'Interactive dashboards', 'Publishing and sharing'] },
      { week: 'Week 9', title: 'Storytelling with data', topics: ['What the audience actually needs', 'Narrative structure', 'Common chart mistakes'] },
      { week: 'Week 10', title: 'Capstone', topics: ['Analyse a real dataset end-to-end', 'Build a dashboard', 'Present your findings'] },
    ],
    projects: [
      'A sales analysis dashboard in Excel (Week 2)',
      'A SQL case study (Week 4)',
      'A capstone Power BI dashboard from a real dataset',
    ],
    whatsIncluded: [
      '10 weeks of live classes (recorded)',
      'Private cohort Slack',
      'Weekly exercises with feedback',
      'Capstone project review',
      'Certificate of completion',
    ],
    refundPolicy: REFUND_COHORT,
    faq: [
      { q: 'Do I need a statistics background?', a: 'No. Whatever stats you need we teach as it comes up.' },
      { q: 'Is this data analysis or data science?', a: 'This is the analyst path — SQL, Excel, Python, dashboards. Machine learning is a separate track on the client services side.' },
    ],
  },
  {
    id: 'data-analysis-mentor',
    category: 'Data Analysis',
    tier: 'mentorship',
    title: 'Data Analysis — 1-on-1 Mentorship',
    summary: 'Private data analysis mentorship — bring your own dataset (work or personal) and we\'ll build your skills around real problems instead of textbook examples.',
    icon: 'bar-chart',
    priceNgn: 350_000,
    durationWeeks: 10,
    durationLabel: '10 weeks (flexible pacing)',
    format: MENTOR_FORMAT,
    classSize: MENTOR_CLASS_SIZE,
    weeklyCommitment: '5–8 hours / week',
    prerequisites: COMMON_PREREQS,
    outcomes: [
      'Same as the cohort, applied to your own data',
      'A portfolio dashboard built on real (not textbook) data',
      'Confidence to handle ambiguous business questions',
    ],
    syllabus: [
      { week: 'Phase 1', title: 'Excel + SQL', topics: ['Pivots and Power Query', 'SQL essentials', 'Window functions'] },
      { week: 'Phase 2', title: 'Python for analysis', topics: ['Pandas', 'Cleaning', 'Visualisation'] },
      { week: 'Phase 3', title: 'Dashboards', topics: ['Power BI', 'DAX', 'Publishing'] },
      { week: 'Phase 4', title: 'Your data', topics: ['End-to-end analysis on your dataset', 'Dashboard polish', 'Presenting findings'] },
    ],
    projects: ['A polished dashboard on real data you choose'],
    whatsIncluded: [
      'Weekly 1-on-1 live sessions (60–90 min)',
      'Async Slack/WhatsApp access',
      'Detailed feedback on every exercise',
      'Personalised learning plan',
      'Certificate of completion',
    ],
    refundPolicy: REFUND_MENTORSHIP,
  },

  /* ════════════ 6. RESEARCH WRITING ════════════ */
  {
    id: 'research-writing-cohort',
    category: 'Research Writing',
    tier: 'cohort',
    title: 'Research Writing — Cohort',
    summary: 'Learn to plan, structure, and write academic papers that pass supervisor review and plagiarism checks. Covers topic refinement, literature review, methodology, and writing style.',
    icon: 'book-open',
    priceNgn: 120_000,
    durationWeeks: 8,
    durationLabel: '8 weeks',
    format: COHORT_FORMAT,
    classSize: COHORT_CLASS_SIZE,
    weeklyCommitment: '4–6 hours / week',
    prerequisites: [
      ...COMMON_PREREQS,
      'You should currently be working on (or about to start) a paper, project, or dissertation',
    ],
    outcomes: [
      'Refine a vague topic into a sharp research question',
      'Write a literature review your supervisor takes seriously',
      'Choose and justify an appropriate methodology',
      'Cite cleanly in APA, MLA, Chicago, or Harvard',
      'Stay under 10% similarity on plagiarism checks',
    ],
    syllabus: [
      { week: 'Week 1', title: 'Picking a topic that works', topics: ['Topic vs research question', 'What makes a topic researchable', 'Avoiding scope traps'] },
      { week: 'Weeks 2–3', title: 'Literature review', topics: ['Finding good sources', 'Reading academically', 'Synthesising vs summarising', 'Reference managers (Zotero / Mendeley)'] },
      { week: 'Week 4', title: 'Methodology', topics: ['Quantitative vs qualitative vs mixed', 'Picking the right method', 'Justifying your choice'] },
      { week: 'Weeks 5–6', title: 'Writing the chapters', topics: ['Academic voice', 'Sentence and paragraph craft', 'Linking arguments', 'Common Nigerian-undergrad mistakes'] },
      { week: 'Week 7', title: 'Citations + ethics', topics: ['APA / MLA / Chicago / Harvard', 'Quoting vs paraphrasing', 'Avoiding plagiarism', 'Ethics committee basics'] },
      { week: 'Week 8', title: 'Polish + defence prep', topics: ['Self-editing checklist', 'Handling supervisor feedback', 'Preparing for your defence'] },
    ],
    projects: [
      'A 1,500-word literature review on your topic by Week 3',
      'A full chapter draft (methodology or introduction) by Week 7',
    ],
    whatsIncluded: [
      '8 weeks of live classes (recorded)',
      'Private cohort Slack',
      'Written feedback on your chapter drafts',
      'A citation-style cheat sheet',
      'Certificate of completion',
    ],
    refundPolicy: REFUND_COHORT,
    faq: [
      { q: 'I\'m a postgraduate — is this too basic?', a: 'The cohort covers undergrad to MSc level. For PhD-chapter or journal-manuscript depth, take the mentorship tier.' },
      { q: 'Will you write my paper for me?', a: 'No — we teach you to write it. If you need a paper written for you, that\'s a separate service on the agency side.' },
    ],
  },
  {
    id: 'research-writing-mentor',
    category: 'Research Writing',
    tier: 'mentorship',
    title: 'Research Writing — 1-on-1 Mentorship',
    summary: 'Private research writing mentorship for postgraduates and serious final-year students — work directly with a mentor on YOUR thesis, chapter by chapter.',
    icon: 'book-open',
    priceNgn: 280_000,
    durationWeeks: 8,
    durationLabel: '8 weeks (flexible pacing)',
    format: MENTOR_FORMAT,
    classSize: MENTOR_CLASS_SIZE,
    weeklyCommitment: '5–8 hours / week',
    prerequisites: [
      ...COMMON_PREREQS,
      'You have an active paper, dissertation, or journal manuscript in progress',
    ],
    outcomes: [
      'A polished chapter (or full paper, depending on length) by the end',
      'Methodology + analysis approach validated by an outside reader',
      'Citation and reference list ready for submission',
      'Defence/viva preparation if relevant',
    ],
    syllabus: [
      { week: 'Phase 1', title: 'Topic + literature', topics: ['Sharpening your research question', 'Literature gap analysis', 'Reference manager setup'] },
      { week: 'Phase 2', title: 'Methodology', topics: ['Method selection', 'Justification', 'Ethics if applicable'] },
      { week: 'Phase 3', title: 'Writing', topics: ['Chapter drafting', 'Editing for academic voice', 'Citation clean-up'] },
      { week: 'Phase 4', title: 'Submission + defence', topics: ['Final polish', 'Defence/viva prep', 'Handling examiner feedback'] },
    ],
    projects: ['Your own chapter, paper, or manuscript — drafted and polished alongside the mentorship'],
    whatsIncluded: [
      'Weekly 1-on-1 live sessions (60–90 min)',
      'Async access for stuck-points',
      'Detailed written feedback on every draft',
      'Reference manager setup if needed',
      'Certificate of completion + reference letter on request',
    ],
    refundPolicy: REFUND_MENTORSHIP,
  },

  /* ════════════ 7. UI/UX DESIGN ════════════ */
  {
    id: 'uiux-cohort',
    category: 'UI/UX Design',
    tier: 'cohort',
    title: 'UI/UX Design — Cohort',
    summary: 'Learn product design from research through wireframes to high-fidelity Figma prototypes. Build a portfolio that gets noticed by hiring managers.',
    icon: 'palette',
    priceNgn: 150_000,
    durationWeeks: 8,
    durationLabel: '8 weeks',
    format: COHORT_FORMAT,
    classSize: COHORT_CLASS_SIZE,
    weeklyCommitment: '5–7 hours / week',
    prerequisites: [
      ...COMMON_PREREQS,
      'No design background needed — we start at zero',
    ],
    outcomes: [
      'Run a basic user-research session and synthesise findings',
      'Wireframe, prototype, and design in Figma to a professional standard',
      'Apply visual design fundamentals — type, colour, spacing, hierarchy',
      'Build a portfolio of 3 case studies hiring managers actually read',
    ],
    syllabus: [
      { week: 'Week 1', title: 'What product design really is', topics: ['UX vs UI vs product design', 'The design process', 'How designers fit into teams'] },
      { week: 'Week 2', title: 'User research basics', topics: ['User interviews', 'Personas — useful or not', 'Synthesising research'] },
      { week: 'Week 3', title: 'Information architecture + flows', topics: ['Site maps and user flows', 'Card sorting', 'Navigation patterns'] },
      { week: 'Weeks 4–5', title: 'Figma + wireframes', topics: ['Figma essentials', 'Auto layout', 'Components and variants', 'Wireframing'] },
      { week: 'Week 6', title: 'Visual design', topics: ['Typography', 'Colour systems', 'Spacing and grid', 'Accessibility basics'] },
      { week: 'Week 7', title: 'Prototyping + handoff', topics: ['Interactive prototypes', 'Design tokens', 'Working with developers'] },
      { week: 'Week 8', title: 'Portfolio + case studies', topics: ['Writing a case study', 'Showcasing your process', 'Portfolio review'] },
    ],
    projects: [
      'A mobile app redesign case study (Week 4)',
      'A SaaS dashboard design (Week 6)',
      'A capstone project of your choice — fully designed in Figma',
    ],
    whatsIncluded: [
      '8 weeks of live classes (recorded)',
      'Private cohort Slack',
      'Weekly design critique sessions',
      'Portfolio review at the end',
      'Certificate of completion',
    ],
    whatsNotIncluded: [
      'Figma Pro subscription (the free tier is enough for the program)',
    ],
    refundPolicy: REFUND_COHORT,
    faq: [
      { q: 'Will I be junior-designer-ready after this?', a: 'Yes — you\'ll have the Figma skills, the process knowledge, and a portfolio with 3 case studies. The interviews are yours to win.' },
      { q: 'Do I need a drawing or art background?', a: 'No. Product design is a craft you learn — visual taste develops with practice.' },
    ],
  },
  {
    id: 'uiux-mentor',
    category: 'UI/UX Design',
    tier: 'mentorship',
    title: 'UI/UX Design — 1-on-1 Mentorship',
    summary: 'Private design mentorship — your goals, your portfolio, your pace. Get the detailed critique on your work that group cohorts can\'t give you.',
    icon: 'palette',
    priceNgn: 300_000,
    durationWeeks: 8,
    durationLabel: '8 weeks (flexible pacing)',
    format: MENTOR_FORMAT,
    classSize: MENTOR_CLASS_SIZE,
    weeklyCommitment: '5–8 hours / week',
    prerequisites: COMMON_PREREQS,
    outcomes: [
      'Same as the cohort, with deeper portfolio critique',
      'A portfolio of 3 polished case studies',
      'Targeted prep if you\'re job-hunting (CV + design interview practice)',
    ],
    syllabus: [
      { week: 'Phase 1', title: 'Foundations', topics: ['UX process', 'Research basics', 'Information architecture'] },
      { week: 'Phase 2', title: 'Figma + craft', topics: ['Figma mastery', 'Visual design fundamentals', 'Components and tokens'] },
      { week: 'Phase 3', title: 'Real projects', topics: ['Case study #1', 'Case study #2', 'Critique and iteration'] },
      { week: 'Phase 4', title: 'Portfolio + job prep', topics: ['Portfolio polish', 'Case-study writeup', 'Design interview prep'] },
    ],
    projects: ['3 polished case studies for your portfolio'],
    whatsIncluded: [
      'Weekly 1-on-1 live sessions (60–90 min)',
      'Async Slack/WhatsApp access',
      'Detailed Figma file critique',
      'Personalised roadmap',
      'Certificate of completion',
    ],
    refundPolicy: REFUND_MENTORSHIP,
  },

  /* ════════════ 8. OFFICE AUTOMATION ════════════ */
  {
    id: 'office-automation-cohort',
    category: 'Office Automation',
    tier: 'cohort',
    title: 'Office Automation — Cohort',
    summary: 'Master the everyday tools the working world runs on — Word, Excel, PowerPoint, Outlook, and OneDrive / Google Drive. Practical, no fluff, with templates you keep.',
    icon: 'briefcase',
    priceNgn: 100_000,
    durationWeeks: 6,
    durationLabel: '6 weeks',
    format: COHORT_FORMAT,
    classSize: COHORT_CLASS_SIZE,
    weeklyCommitment: '3–5 hours / week',
    prerequisites: [
      ...COMMON_PREREQS,
      'No prior experience required — we start from "where is the Save button"',
    ],
    outcomes: [
      'Format clean, professional documents in Word — reports, CVs, proposals',
      'Build spreadsheets with formulas, lookups, conditional formatting, and pivot tables in Excel',
      'Design clear, on-brand presentations in PowerPoint',
      'Run your email + calendar like a pro using Outlook (or Gmail)',
      'Collaborate in real time using OneDrive and Google Drive — sharing, permissions, version history',
    ],
    syllabus: [
      { week: 'Week 1', title: 'Microsoft Word', topics: ['Styles, headings, and templates', 'Tables, lists, and page layout', 'Track changes and comments', 'Mail merge', 'Headers, footers, and references'] },
      { week: 'Week 2', title: 'Microsoft Excel', topics: ['Formulas and cell references', 'IF, SUMIF, COUNTIF, VLOOKUP / XLOOKUP', 'Conditional formatting', 'Sorting, filtering, and tables', 'Pivot tables and basic charts'] },
      { week: 'Week 3', title: 'Microsoft PowerPoint', topics: ['Slide layouts and the slide master', 'Type, colour, and visual hierarchy', 'Smart use of images and icons', 'Transitions and animations (without overdoing it)', 'Presenter view, rehearse-with-timings, exporting'] },
      { week: 'Week 4', title: 'Microsoft Outlook', topics: ['Inbox zero with folders + rules', 'Calendar, meeting invites, and time zones', 'Signatures, templates, and quick steps', 'Search and tasks', 'Outlook vs Gmail — what transfers'] },
      { week: 'Week 5', title: 'OneDrive & Google Drive', topics: ['Cloud storage 101 — where things actually live', 'Sharing files and folders correctly', 'Real-time collaboration in Word / Docs / Sheets', 'Version history and recovery', 'Backups and syncing across devices'] },
      { week: 'Week 6', title: 'Capstone', topics: ['A real workplace scenario combining all five tools', 'Build a report + spreadsheet + deck + shared drive', 'Polish, present, and hand over'] },
    ],
    projects: [
      'A polished CV and a 1-page cover letter in Word',
      'A working budget or sales tracker in Excel (with pivot table)',
      'A 10-slide pitch deck in PowerPoint',
      'A shared team workspace in OneDrive or Google Drive',
    ],
    whatsIncluded: [
      '6 weeks of live classes (recorded if you miss one)',
      'A library of practical templates you keep forever',
      'Private cohort group for questions',
      'Weekly hands-on exercises with feedback',
      'Certificate of completion',
    ],
    whatsNotIncluded: [
      'Microsoft 365 or Google Workspace subscription fees (the free tiers cover the program)',
      'Macros / VBA — covered separately if there\'s demand',
    ],
    refundPolicy: REFUND_COHORT,
    faq: [
      { q: 'I already use Word and Excel daily — is this for me?', a: 'If you\'ve never used pivot tables, VLOOKUP, mail merge, or slide masters, you\'ll learn a lot. We move fast on the basics for working professionals.' },
      { q: 'Do I need Microsoft 365?', a: 'No. The free tiers of Office online and Google Workspace are enough to follow along. We point out where the desktop versions add value.' },
      { q: 'Will this help me get a job?', a: 'It puts "advanced Microsoft Office" on your CV in a way you can actually back up in an interview. For most admin, finance, and operations roles, that genuinely matters.' },
    ],
  },
  {
    id: 'office-automation-mentor',
    category: 'Office Automation',
    tier: 'mentorship',
    title: 'Office Automation — 1-on-1 Mentorship',
    summary: 'Private Office training built around your actual work — your spreadsheets, your reports, your inbox chaos. Best fit if you have specific problems to solve, not just skills to learn.',
    icon: 'briefcase',
    priceNgn: 200_000,
    durationWeeks: 6,
    durationLabel: '6 weeks (flexible pacing)',
    format: MENTOR_FORMAT,
    classSize: MENTOR_CLASS_SIZE,
    weeklyCommitment: '3–6 hours / week',
    prerequisites: COMMON_PREREQS,
    outcomes: [
      'Same as the cohort, applied to YOUR actual documents and spreadsheets',
      'Custom Excel workbooks built around your real workflows',
      'Inbox + calendar system tailored to how you actually work',
      'Templates designed for your team or business',
    ],
    syllabus: [
      { week: 'Phase 1', title: 'Word + PowerPoint', topics: ['Document templates for your work', 'Report and proposal patterns', 'Branded slide deck mastery'] },
      { week: 'Phase 2', title: 'Excel', topics: ['Formulas and lookups against your data', 'Pivot tables on your real spreadsheets', 'Dashboards', 'Optional: intro to macros'] },
      { week: 'Phase 3', title: 'Outlook + cloud', topics: ['Inbox zero on your actual inbox', 'Calendar + meeting workflow', 'OneDrive / Google Drive setup for your team'] },
      { week: 'Phase 4', title: 'Your capstone', topics: ['One real workplace problem solved end-to-end', 'Documented playbook you can re-use'] },
    ],
    projects: [
      'A real workbook, report, or workflow from your job — rebuilt to a professional standard alongside the mentorship',
    ],
    whatsIncluded: [
      'Weekly 1-on-1 live sessions (60–90 min)',
      'Async Slack / WhatsApp access for stuck-points',
      'Custom templates designed around your work',
      'Personalised learning roadmap',
      'Certificate of completion',
    ],
    refundPolicy: REFUND_MENTORSHIP,
  },
];

/* ───── Lookup helpers ───────────────────────────────────────────────── */

export function getTutoringTrack(id: string): TutoringTrack | undefined {
  return tutoringCatalog.find((t) => t.id === id);
}

/**
 * Group the catalog for the student-facing page. Returns an array of
 * categories, each with its tracks in a stable order (cohort first,
 * mentorship second, then by subTrack for Software Development).
 */
export function groupedTutoringCatalog() {
  const order = [
    'Mobile App Development',
    'Software Development',
    'Data Analysis',
    'Research Writing',
    'UI/UX Design',
    'Office Automation',
  ];
  return order
    .map((category) => ({
      category,
      tracks: tutoringCatalog
        .filter((t) => t.category === category)
        .sort((a, b) => {
          // subTrack groups together; within a subTrack, cohort before mentorship.
          if (a.subTrack !== b.subTrack) {
            return (a.subTrack || '').localeCompare(b.subTrack || '');
          }
          return a.tier === 'cohort' ? -1 : 1;
        }),
    }))
    .filter((g) => g.tracks.length > 0);
}

/**
 * Default installment eligibility — same floor used for client services.
 * Server-side guard in paystack.controller calls this so a malicious
 * client can't trick the API into splitting an ineligible item.
 */
export const TUTORING_INSTALLMENT_FLOOR_NGN = 200_000;

export function isTutoringInstallmentEligible(track: TutoringTrack): boolean {
  if (track.installmentEligible === false) return false;
  if (track.installmentEligible === true) return true;
  return track.priceNgn >= TUTORING_INSTALLMENT_FLOOR_NGN;
}
