import {
  Code2, BarChart3, BookOpen, Layers,
  type LucideIcon,
} from 'lucide-react';

// Each capability is something E-Bringgs both TEACHES (students enroll to
// learn it) and DELIVERS (clients hire us to build it for them). The landing
// page surfaces a short card; the detail page expands into the two audience
// tracks with concrete value props for each side.

export interface CapabilityTrack {
  /** Sub-headline shown above the body, e.g. "Learn it" or "Hire us to build it". */
  kicker: string;
  /** One-sentence promise to this audience. */
  promise: string;
  /** 3-5 concrete reasons + bullets. */
  bullets: string[];
  /** Where the CTA button takes the audience. */
  ctaLabel: string;
  ctaHref: string;
}

export interface Capability {
  slug: string;
  title: string;
  /** ~12-word summary used on the landing card. */
  tagline: string;
  /** ~30-word elevator pitch used at the top of the detail page. */
  intro: string;
  icon: LucideIcon;
  /** Tailwind text color class for the icon + accent. */
  color: string;
  /** Tailwind bg class for the icon chip. */
  bg: string;
  /** Tailwind gradient used as the detail-page hero background. */
  heroGradient: string;
  /** Hero image path under /public. */
  img: string;
  /** Languages, frameworks, and tools, same stack students learn that
   *  client projects ship on. */
  techStack: string[];
  student: CapabilityTrack;
  client: CapabilityTrack;
}

/**
 * Dark-surface accent per capability, shared by the services index and the
 * per-capability detail page so the colour a card introduces is the colour
 * that page continues in.
 *
 * The `color`/`bg` fields on Capability above are the light-theme pair and are
 * still used by anything not yet redesigned — these are deliberately separate
 * rather than a replacement. Full literal class strings, because Tailwind
 * cannot see interpolated class names.
 */
export interface DarkAccent {
  /** Text colour for links, kickers and the icon glyph. */
  text: string;
  /** Icon tile: translucent fill + border + glyph colour. */
  tile: string;
  /** rgba for the hero's radial glow, used in an inline style. */
  glow: string;
}

export const darkAccents: Record<string, DarkAccent> = {
  'software-development': {
    text: 'text-cyan-400',
    tile: 'bg-cyan-400/10 border-cyan-400/30 text-cyan-400',
    glow: 'rgba(34,211,238,0.12)',
  },
  'data-analytics': {
    text: 'text-blue-400',
    tile: 'bg-blue-400/10 border-blue-400/30 text-blue-400',
    glow: 'rgba(96,165,250,0.12)',
  },
  'research-support': {
    text: 'text-amber-400',
    tile: 'bg-amber-400/10 border-amber-400/30 text-amber-400',
    glow: 'rgba(251,191,36,0.12)',
  },
  'ux-product-design': {
    text: 'text-purple-400',
    tile: 'bg-purple-400/10 border-purple-400/30 text-purple-400',
    glow: 'rgba(192,132,252,0.12)',
  },
};

export const fallbackAccent: DarkAccent = {
  text: 'text-cyan-400',
  tile: 'bg-cyan-400/10 border-cyan-400/30 text-cyan-400',
  glow: 'rgba(34,211,238,0.12)',
};

export const getAccent = (slug: string): DarkAccent => darkAccents[slug] ?? fallbackAccent;

export const capabilities: Capability[] = [
  {
    slug: 'software-development',
    title: 'Software Development',
    tagline: 'Full-stack web & mobile apps, and the cohorts that teach you to build them.',
    intro:
      'From single-page apps to production-grade APIs, we ship software for clients and teach the same stack to students who want to break into tech.',
    icon: Code2,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    heroGradient: 'from-teal-600 to-cyan-700',
    img: '/images/services/software-dev.jpg',
    techStack: [
      'HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'React Native',
      'Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'Tailwind CSS', 'Git', 'Docker',
    ],
    student: {
      kicker: 'For students, learn to build',
      promise:
        'Join a structured cohort that takes you from your first commit to a deployed full-stack app you can show employers.',
      bullets: [
        'Live classes with senior engineers, not pre-recorded videos collecting dust',
        'Build real projects (e-commerce store, dashboard, chat app), not toy tutorials',
        'Pair-programming sessions and code reviews on every assignment',
        'Career support: portfolio reviews, resume help, and intro to clients hiring',
        'Earn a verifiable certificate once you finish your capstone',
      ],
      ctaLabel: 'See upcoming cohorts',
      ctaHref: '/courses',
    },
    client: {
      kicker: 'For clients, we build it for you',
      promise:
        'A dedicated squad designs, builds, and ships your web or mobile product on a timeline you can plan around.',
      bullets: [
        'Modern, maintainable stacks, TypeScript on both ends',
        'Fixed-scope MVPs or ongoing retainers for live products',
        'Weekly demos so you always know where your money is going',
        'Production-ready: CI/CD, monitoring, and docs handed over with the codebase',
        'Optional hire-out-of-cohort: bring on a graduate as a paid junior on your team',
      ],
      ctaLabel: 'Request a project quote',
      ctaHref: '/contact',
    },
  },
  {
    slug: 'data-analytics',
    title: 'Data Analytics',
    tagline: 'Turn messy data into decisions, for clients, and for students learning the craft.',
    intro:
      'We help businesses make data-driven decisions and train the next generation of analysts with the same tools used in industry.',
    icon: BarChart3,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    heroGradient: 'from-emerald-600 to-teal-700',
    img: '/images/services/data-analysis.jpg',
    techStack: [
      'Python', 'SQL', 'Pandas', 'NumPy', 'Excel', 'Power BI', 'Tableau',
      'Looker Studio', 'PostgreSQL', 'Jupyter', 'Git',
    ],
    student: {
      kicker: 'For students, learn the craft',
      promise:
        'Master the data analyst stack, Python, SQL, Pandas, and dashboards, through hands-on projects with real datasets.',
      bullets: [
        'Work with messy, real-world data (sales, customer churn, public health)',
        'Build dashboards in Power BI / Tableau employers actually use',
        'Write production-grade SQL for queries that scale',
        'Office hours with practicing data analysts',
        'Portfolio piece: a published analysis you can link from your CV',
      ],
      ctaLabel: 'Enroll in the data cohort',
      ctaHref: '/courses',
    },
    client: {
      kicker: 'For clients, see what your data is telling you',
      promise:
        'We audit your data, build the dashboards and pipelines, and turn raw numbers into decisions your team can act on this week.',
      bullets: [
        'Customer segmentation, sales analysis, performance reporting',
        'Power BI / Looker / Metabase dashboards with live data refresh',
        'Data pipeline cleanup: dedupe, normalize, document',
        'Plain-English readouts your non-technical team can act on',
        'Hand-off documentation so your team can maintain it after we leave',
      ],
      ctaLabel: 'Talk to a data consultant',
      ctaHref: '/contact',
    },
  },
  {
    slug: 'research-support',
    title: 'Research Support',
    tagline: 'Academic research help for students, and research-grade analysis for organizations.',
    intro:
      'Whether you are a student facing a dissertation deadline or an organization that needs rigorous research, we provide statistical analysis, literature reviews, and methodology support.',
    icon: BookOpen,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    heroGradient: 'from-amber-600 to-orange-700',
    img: '/images/services/research.jpg',
    techStack: [
      'SPSS', 'R', 'Stata', 'NVivo', 'Excel', 'Zotero', 'Mendeley', 'LaTeX',
    ],
    student: {
      kicker: 'For students, finish your project with confidence',
      promise:
        'One-on-one support from researchers who have walked the road, from topic selection to viva-voce prep.',
      bullets: [
        'Topic refinement and proposal review',
        'Statistical analysis in SPSS, R, or Stata, and you understand what we did',
        'Literature review acceleration: search strategies, citation management',
        'Defence prep: mock viva sessions with subject-matter experts',
        'Strict confidentiality and plagiarism-free deliverables',
      ],
      ctaLabel: 'Book a research consultation',
      ctaHref: '/contact',
    },
    client: {
      kicker: 'For organizations, research you can publish or act on',
      promise:
        'Need a market study, evaluation report, or policy brief? We deliver rigorous research with the analysis and write-up done to publication standard.',
      bullets: [
        'Market sizing, user research, and competitive landscape studies',
        'Program evaluation with quantitative + qualitative methods',
        'White papers and policy briefs ready for stakeholders',
        'Data collection: surveys, interviews, focus groups',
        'Co-authorship and citation transparency when you publish',
      ],
      ctaLabel: 'Commission a research project',
      ctaHref: '/contact',
    },
  },
  {
    slug: 'ux-product-design',
    title: 'UX / Product Design',
    tagline: 'Design products people love, and learn the craft from designers shipping today.',
    intro:
      'For students we teach the full product-design loop end-to-end. For clients, we design interfaces, flows, and brand systems that make your product the obvious choice.',
    icon: Layers,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    heroGradient: 'from-purple-600 to-fuchsia-700',
    img: '/images/services/ux-design.jpg',
    techStack: [
      'Figma', 'FigJam', 'Adobe XD', 'Illustrator', 'Photoshop', 'Notion', 'Miro',
    ],
    student: {
      kicker: 'For students, learn product design end-to-end',
      promise:
        'From user research to a polished Figma prototype, learn the workflow product designers actually use at funded startups.',
      bullets: [
        'Figma fundamentals → advanced auto-layout and component systems',
        'User research: interviews, surveys, and turning insights into screens',
        'Wireframing, prototyping, and usability testing',
        'Hand-off: how to brief developers and review what they build',
        'Capstone: design a full product and present it to a panel of mentors',
      ],
      ctaLabel: 'See design cohorts',
      ctaHref: '/courses',
    },
    client: {
      kicker: 'For clients, design that converts',
      promise:
        'Whether you are pre-launch or rebuilding a tired interface, we design product experiences that lift activation, retention, and revenue.',
      bullets: [
        'Product strategy + flow design before a pixel is pushed',
        'Brand systems, design tokens, and a Figma library your team can use forever',
        'Usability testing with real users from your target market',
        'Marketing site + product UI handled by the same team for consistency',
        'Optional: paired with our engineering team for design-to-ship in one engagement',
      ],
      ctaLabel: 'Start a design project',
      ctaHref: '/contact',
    },
  },
];

export const getCapability = (slug: string): Capability | undefined =>
  capabilities.find((c) => c.slug === slug);
