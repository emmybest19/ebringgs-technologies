/**
 * Productized service catalog — server-authoritative source of truth for prices,
 * scope, and post-payment intake forms. The frontend fetches this via /api/services.
 *
 * `productized: true`  → buyable instantly via Checkout.
 * `productized: false` → inquiry-only (admin scopes a custom quote).
 */

export interface IntakeField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'url' | 'email' | 'select' | 'checkbox-group';
  required?: boolean;
  placeholder?: string;
  options?: string[];   // for select / checkbox-group
  helpText?: string;
}

export interface ServiceCatalogEntry {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: string;
  img?: string;
  productized: boolean;
  // pricing (NGN — full naira amount, not kobo). only meaningful when productized.
  price?: number;
  timeline?: string;
  deliverables?: string[];
  process?: string[];
  whatsIncluded?: string[];
  whatsNotIncluded?: string[];
  revisionsIncluded?: number;
  refundPolicy?: string;
  faq?: { q: string; a: string }[];
  intakeFields?: IntakeField[];
  /**
   * When true, the Checkout page may offer 1×/2×/3× installments for this
   * service. Server enforces this in `paystack.controller.initializeTransaction`
   * — clients can't trick the API into splitting an item that's ineligible.
   * Default: true for items ≥ ₦200,000 (server-side guard).
   */
  installmentEligible?: boolean;
}

export const servicesCatalog: ServiceCatalogEntry[] = [
  /* ─── Productized: buy now ──────────────────────────────────────────── */
  {
    id: '1',
    category: 'Web Development',
    title: 'Launch Page',
    description: 'A high-converting single-page website built on a modern stack — perfect for product launches, lead capture, or campaign pages.',
    icon: 'code',
    img: '/images/services/software-dev.jpg',
    productized: true,
    price: 200000,
    timeline: '7 business days from brief',
    deliverables: [
      'Single responsive landing page',
      'Mobile + tablet + desktop layouts',
      'Contact / lead-capture form',
      'Basic on-page SEO',
      'Deployed to your domain',
    ],
    process: [
      'You submit the brief',
      'We design + build (5 days)',
      'You review and request revisions (1 round)',
      'We deploy + hand over',
    ],
    whatsIncluded: [
      'Design and development',
      '1 round of revisions',
      'Deployment to a domain you provide',
      '7 days of bug-fix support post-delivery',
    ],
    whatsNotIncluded: [
      'Domain registration / hosting fees',
      'Copywriting (you provide the content)',
      'Custom illustrations or stock photos',
      'Multi-page sites (this is a single page)',
    ],
    revisionsIncluded: 1,
    refundPolicy: 'Full refund within 24 hours of purchase if work has not started. After that, refund is pro-rated based on work completed.',
    faq: [
      { q: 'Can I supply my own design?', a: 'Yes. If you have a Figma file we can build directly from it at the same price.' },
      { q: 'What if I need more than one round of revisions?', a: 'Additional revision rounds are ₦25,000 each. Most clients only need one.' },
      { q: 'Do you write the copy?', a: 'No, you provide the content. We can recommend copywriters if needed.' },
    ],
    intakeFields: [
      { name: 'businessName', label: 'Business / product name', type: 'text', required: true, placeholder: 'Acme Inc.' },
      { name: 'goal', label: 'Primary goal of this page', type: 'select', required: true, options: ['Generate leads', 'Sell a product', 'Announce a launch', 'Build credibility', 'Other'] },
      { name: 'audience', label: 'Who is the audience?', type: 'textarea', required: true, placeholder: 'Small business owners in Nigeria looking for...' },
      { name: 'brandAssets', label: 'Brand assets (logo, colors, fonts) — link to a Drive/Dropbox folder', type: 'url', required: true, placeholder: 'https://drive.google.com/...' },
      { name: 'copy', label: 'Page copy / sections you want', type: 'textarea', required: true, helpText: 'Headline, sub-headline, key features, testimonials, CTA, etc.' },
      { name: 'inspirations', label: 'Reference sites you like (one per line)', type: 'textarea', required: false, placeholder: 'https://stripe.com\nhttps://linear.app' },
      { name: 'domain', label: 'Domain to deploy to', type: 'text', required: false, placeholder: 'mybusiness.com (leave blank if not ready)' },
    ],
  },
  {
    id: '11',
    category: 'Web Development',
    title: 'Business Website',
    description: 'A complete website for a growing business — up to 6 pages (e.g. Home, About, Services, Pricing, Blog, Contact), with a payment gateway integration so you can collect money directly from your site. Built on a modern stack and deployed to your domain.',
    icon: 'code',
    img: '/images/services/software-dev.jpg',
    productized: true,
    price: 400000,
    timeline: '14 business days from brief',
    deliverables: [
      'Up to 6 fully responsive pages',
      'CMS-friendly structure (easy to edit later)',
      'Contact / lead-capture form',
      'Payment gateway integration (Paystack, Flutterwave, or Stripe)',
      'On-page SEO + analytics',
      'Deployed to your domain',
    ],
    process: [
      'You submit the brief',
      'We propose a sitemap + design direction (3 days)',
      'We design + build (8 days)',
      'You review and request revisions (2 rounds)',
      'We deploy + hand over',
    ],
    whatsIncluded: [
      'Design and development of up to 6 pages',
      'One payment gateway integration (one product, donation, or booking)',
      '2 rounds of revisions',
      'Deployment to a domain you provide',
      '14 days of bug-fix support post-delivery',
    ],
    whatsNotIncluded: [
      'Domain registration / hosting fees',
      'Copywriting (you provide the content)',
      'Custom illustrations or stock photos',
      'Full e-commerce store (cart, inventory, multiple products) — available as a custom engagement',
    ],
    revisionsIncluded: 2,
    refundPolicy: 'Full refund within 24 hours of purchase if work has not started. After that, refund is pro-rated based on work completed.',
    faq: [
      { q: 'What if my site grows beyond 6 pages?', a: 'Move up to the 7–10 page tier (₦1,000,000) or the 11–20 page tier (₦1,500,000). Or stay on this tier and add pages later at ₦40,000 each.' },
      { q: 'Is a CMS included?', a: 'We use a developer-friendly content structure so you can edit copy easily without breaking the site. A full CMS is available as a custom add-on.' },
      { q: 'What does the payment integration cover?', a: 'One payment flow on the site — selling a single product, accepting a donation, or taking a booking. You provide an account with the gateway (Paystack, Flutterwave, or Stripe) and we wire it up so customers can pay you directly. A full e-commerce store with cart and inventory is a custom add-on.' },
    ],
    intakeFields: [
      { name: 'businessName', label: 'Business / product name', type: 'text', required: true, placeholder: 'Acme Inc.' },
      { name: 'pages', label: 'Which pages do you need? (comma-separated, up to 6)', type: 'textarea', required: true, placeholder: 'Home, About, Services, Pricing, Blog, Contact' },
      { name: 'audience', label: 'Who is the audience?', type: 'textarea', required: true },
      { name: 'brandAssets', label: 'Brand assets (logo, colors, fonts) — link to a Drive/Dropbox folder', type: 'url', required: true },
      { name: 'copy', label: 'Page copy / content', type: 'textarea', required: true, helpText: 'Either paste here or share a Google Doc link.' },
      { name: 'paymentGateway', label: 'Which payment gateway should we integrate?', type: 'select', required: true, options: ['Paystack', 'Flutterwave', 'Stripe', 'Not sure — recommend one'] },
      { name: 'paymentPurpose', label: 'What will customers pay for?', type: 'select', required: true, options: ['One product / service', 'A booking or appointment', 'A donation', 'A subscription', 'Other'] },
      { name: 'inspirations', label: 'Reference sites you like (one per line)', type: 'textarea', required: false },
      { name: 'domain', label: 'Domain to deploy to', type: 'text', required: false, placeholder: 'mybusiness.com (leave blank if not ready)' },
    ],
  },
  {
    id: '17',
    category: 'Web Development',
    title: 'Growth Website',
    description: 'A step up from the Business Website — 7 to 8 pages adding case studies, team, or service detail pages, with a payment gateway integration so you can collect money directly from your site. Built on a modern stack and deployed to your domain.',
    icon: 'code',
    img: '/images/services/software-dev.jpg',
    productized: true,
    price: 600000,
    timeline: '18 business days from brief',
    deliverables: [
      'Between 7 and 8 fully responsive pages',
      'CMS-friendly structure (easy to edit later)',
      'Contact / lead-capture form',
      'Payment gateway integration (Paystack, Flutterwave, or Stripe)',
      'On-page SEO + analytics',
      'Deployed to your domain',
    ],
    process: [
      'You submit the brief',
      'We propose a sitemap + design direction (3 days)',
      'We design + build (11 days)',
      'You review and request revisions (2 rounds)',
      'We deploy + hand over',
    ],
    whatsIncluded: [
      'Design and development of 7 to 8 pages',
      'One payment gateway integration (one product, donation, or booking)',
      '2 rounds of revisions',
      'Deployment to a domain you provide',
      '14 days of bug-fix support post-delivery',
    ],
    whatsNotIncluded: [
      'Domain registration / hosting fees',
      'Copywriting (you provide the content)',
      'Custom illustrations or stock photos',
      'Full e-commerce store (cart, inventory, multiple products) — available as a custom engagement',
    ],
    revisionsIncluded: 2,
    refundPolicy: 'Full refund within 24 hours of purchase if work has not started. After that, refund is pro-rated based on work completed.',
    faq: [
      { q: 'What counts as a "page"?', a: 'A distinct route on the site with its own layout (e.g. /about, /services/web-design). A blog index counts as one page; individual blog posts share a template and do not each count separately.' },
      { q: 'What if I need 9 or 10 pages?', a: 'Move up to the Brand Website tier (₦1,000,000) — same modern stack with extra design and content depth for 9 to 10 pages.' },
      { q: 'What does the payment integration cover?', a: 'One payment flow on the site — selling a single product, accepting a donation, or taking a booking. You provide an account with the gateway (Paystack, Flutterwave, or Stripe) and we wire it up so customers can pay you directly. A full e-commerce store with cart and inventory is a custom add-on.' },
    ],
    intakeFields: [
      { name: 'businessName', label: 'Business / product name', type: 'text', required: true, placeholder: 'Acme Inc.' },
      { name: 'pages', label: 'Which pages do you need? (comma-separated, 7 to 8)', type: 'textarea', required: true, placeholder: 'Home, About, Services, Pricing, Blog, Contact, Team, Case Studies' },
      { name: 'audience', label: 'Who is the audience?', type: 'textarea', required: true },
      { name: 'brandAssets', label: 'Brand assets (logo, colors, fonts) — link to a Drive/Dropbox folder', type: 'url', required: true },
      { name: 'copy', label: 'Page copy / content', type: 'textarea', required: true, helpText: 'Either paste here or share a Google Doc link.' },
      { name: 'paymentGateway', label: 'Which payment gateway should we integrate?', type: 'select', required: true, options: ['Paystack', 'Flutterwave', 'Stripe', 'Not sure — recommend one'] },
      { name: 'paymentPurpose', label: 'What will customers pay for?', type: 'select', required: true, options: ['One product / service', 'A booking or appointment', 'A donation', 'A subscription', 'Other'] },
      { name: 'inspirations', label: 'Reference sites you like (one per line)', type: 'textarea', required: false },
      { name: 'domain', label: 'Domain to deploy to', type: 'text', required: false, placeholder: 'mybusiness.com (leave blank if not ready)' },
    ],
  },
  {
    id: '15',
    category: 'Web Development',
    title: 'Brand Website',
    description: 'A richer website for an established brand — 9 to 10 pages covering services, case studies, team, and a structured blog. Built on a modern stack and deployed to your domain.',
    icon: 'code',
    img: '/images/services/software-dev.jpg',
    productized: true,
    price: 1000000,
    timeline: '3 weeks from brief',
    deliverables: [
      'Between 9 and 10 fully responsive pages',
      'CMS-friendly structure (easy to edit later)',
      'Contact / lead-capture form',
      'On-page SEO + analytics',
      'Deployed to your domain',
    ],
    process: [
      'You submit the brief',
      'We propose a sitemap + design direction (4 days)',
      'We design + build (2 weeks)',
      'You review and request revisions (2 rounds)',
      'We deploy + hand over',
    ],
    whatsIncluded: [
      'Design and development of 9 to 10 pages',
      '2 rounds of revisions',
      'Deployment to a domain you provide',
      '14 days of bug-fix support post-delivery',
    ],
    whatsNotIncluded: [
      'Domain registration / hosting fees',
      'Copywriting (you provide the content)',
      'Custom illustrations or stock photos',
      'E-commerce / payment integrations',
    ],
    revisionsIncluded: 2,
    refundPolicy: 'Full refund within 24 hours of purchase if work has not started. After that, refund is pro-rated based on work completed.',
    faq: [
      { q: 'What counts as a "page"?', a: 'A distinct route on the site with its own layout (e.g. /about, /services/web-design). A blog index counts as one page; individual blog posts share a template and do not each count separately.' },
      { q: 'What if I need more than 10 pages?', a: 'Move up to the 11–20 page tier (₦1,500,000). For sites beyond 20 pages, request a custom quote.' },
    ],
    intakeFields: [
      { name: 'businessName', label: 'Business / product name', type: 'text', required: true, placeholder: 'Acme Inc.' },
      { name: 'pages', label: 'Which pages do you need? (comma-separated, 9 to 10)', type: 'textarea', required: true, placeholder: 'Home, About, Services, Pricing, Blog, Contact, Team, Case Studies, FAQ, Careers' },
      { name: 'audience', label: 'Who is the audience?', type: 'textarea', required: true },
      { name: 'brandAssets', label: 'Brand assets (logo, colors, fonts) — link to a Drive/Dropbox folder', type: 'url', required: true },
      { name: 'copy', label: 'Page copy / content', type: 'textarea', required: true, helpText: 'Either paste here or share a Google Doc link.' },
      { name: 'inspirations', label: 'Reference sites you like (one per line)', type: 'textarea', required: false },
      { name: 'domain', label: 'Domain to deploy to', type: 'text', required: false, placeholder: 'mybusiness.com (leave blank if not ready)' },
    ],
  },
  {
    id: '16',
    category: 'Web Development',
    title: 'Corporate Website',
    description: 'A comprehensive website for a larger organisation — 11 to 20 pages covering full marketing, service detail pages, locations, resource library, and a structured blog. Built on a modern stack and deployed to your domain.',
    icon: 'code',
    img: '/images/services/software-dev.jpg',
    productized: true,
    price: 1500000,
    timeline: '5 weeks from brief',
    deliverables: [
      'Between 11 and 20 fully responsive pages',
      'CMS-friendly structure (easy to edit later)',
      'Contact / lead-capture form',
      'On-page SEO + analytics',
      'Deployed to your domain',
    ],
    process: [
      'You submit the brief',
      'Discovery + sitemap workshop (1 week)',
      'Design direction + approval (1 week)',
      'Build (2 weeks)',
      'You review and request revisions (3 rounds)',
      'We deploy + hand over',
    ],
    whatsIncluded: [
      'Design and development of 11 to 20 pages',
      '3 rounds of revisions',
      'Deployment to a domain you provide',
      '21 days of bug-fix support post-delivery',
    ],
    whatsNotIncluded: [
      'Domain registration / hosting fees',
      'Copywriting (you provide the content)',
      'Custom illustrations or stock photos',
      'E-commerce / payment integrations',
    ],
    revisionsIncluded: 3,
    refundPolicy: 'Full refund within 24 hours of purchase if work has not started. After that, refund is pro-rated based on work completed.',
    faq: [
      { q: 'What if I need more than 20 pages?', a: 'For sites beyond 20 pages, request a custom quote — we will scope template re-use and CMS structure to keep things maintainable.' },
      { q: 'Can a full CMS be included?', a: 'Yes — bookable as a custom engagement and integrated with the site so non-technical team members can manage content.' },
    ],
    intakeFields: [
      { name: 'businessName', label: 'Business / product name', type: 'text', required: true, placeholder: 'Acme Inc.' },
      { name: 'pages', label: 'Which pages do you need? (comma-separated, 11 to 20)', type: 'textarea', required: true, placeholder: 'Home, About, Services overview, Service 1, Service 2, ..., Pricing, Blog, Contact, Team, Case Studies, FAQ, Careers, Privacy, Terms' },
      { name: 'audience', label: 'Who is the audience?', type: 'textarea', required: true },
      { name: 'brandAssets', label: 'Brand assets (logo, colors, fonts) — link to a Drive/Dropbox folder', type: 'url', required: true },
      { name: 'copy', label: 'Page copy / content', type: 'textarea', required: true, helpText: 'Either paste here or share a Google Doc link.' },
      { name: 'inspirations', label: 'Reference sites you like (one per line)', type: 'textarea', required: false },
      { name: 'domain', label: 'Domain to deploy to', type: 'text', required: false, placeholder: 'mybusiness.com (leave blank if not ready)' },
    ],
  },
  {
    id: '12',
    category: 'Web Development',
    title: 'Full-Stack Web App MVP',
    description: 'A complete web application MVP with authentication, database, and a real product workflow — built end-to-end and deployed to production.',
    icon: 'code',
    img: '/images/services/software-dev.jpg',
    productized: true,
    price: 1500000,
    timeline: '4–6 weeks from brief',
    deliverables: [
      'Modern, responsive web application frontend',
      'Backend API with database',
      'User authentication (email + password)',
      'One core product workflow end-to-end',
      'Admin panel basics',
      'Deployed to production',
    ],
    process: [
      'You submit the brief',
      'We scope the MVP feature list together (3 days)',
      'Sprint 1: foundations + auth (1 week)',
      'Sprint 2: core workflow (2 weeks)',
      'Sprint 3: admin panel + polish (1 week)',
      'Beta + handover',
    ],
    whatsIncluded: [
      '1 product workflow (e.g. booking, ordering, tracking)',
      'Authentication and basic admin',
      '2 rounds of revisions',
      'Deployment to a host you provide',
      '30 days of bug-fix support',
    ],
    whatsNotIncluded: [
      'Mobile apps (book the Mobile App MVP service)',
      'Payment integrations beyond Paystack basic',
      'Hosting / database costs',
      'Multiple distinct workflows (request a custom quote)',
    ],
    revisionsIncluded: 2,
    refundPolicy: 'Full refund within 24 hours of purchase if work has not started. Pro-rated otherwise.',
    faq: [
      { q: 'Can I get the source code?', a: 'Yes — full code ownership transfers to you on completion.' },
      { q: 'Do you do ongoing maintenance?', a: 'Available as a monthly retainer. Discuss after launch.' },
    ],
    intakeFields: [
      { name: 'productName', label: 'Product name', type: 'text', required: true },
      { name: 'productSummary', label: 'In one paragraph, what does the product do?', type: 'textarea', required: true },
      { name: 'audience', label: 'Who are the users?', type: 'textarea', required: true },
      { name: 'coreWorkflow', label: 'Describe the core user workflow step by step', type: 'textarea', required: true, helpText: 'e.g. "User signs up → creates a booking → admin confirms → user gets receipt"' },
      { name: 'mustHaveFeatures', label: 'Must-have features for launch', type: 'textarea', required: true },
      { name: 'niceToHave', label: 'Nice-to-have features (we may park these for later)', type: 'textarea', required: false },
      { name: 'brandAssets', label: 'Brand assets / design preferences', type: 'url', required: false, placeholder: 'Figma link or Drive folder (or leave blank — we will design)' },
      { name: 'inspirations', label: 'Apps / sites with similar functionality (one per line)', type: 'textarea', required: false },
    ],
  },
  {
    id: '13',
    category: 'Mobile App Development',
    title: 'Mobile App Development',
    description: 'A cross-platform mobile app for iOS and Android, built from a single codebase — your idea shipped to the app stores in weeks, not months.',
    icon: 'smartphone',
    img: '/images/general/mobile-app.jpg',
    productized: true,
    price: 1500000,
    timeline: '6 weeks from brief',
    deliverables: [
      'iOS + Android app from a single codebase',
      'Up to 8 app screens',
      'User authentication',
      'Push notifications setup',
      'Deployed to TestFlight + Google Play internal testing',
    ],
    process: [
      'You submit the brief',
      'We scope screens + flows together (3 days)',
      'Wireframes + design (1 week)',
      'Build sprint 1: foundations + auth (1 week)',
      'Build sprint 2: core screens + flows (2 weeks)',
      'Polish + store submission prep (1 week)',
    ],
    whatsIncluded: [
      'Up to 8 screens',
      'Authentication and profile management',
      'Push notifications',
      '2 rounds of revisions',
      'Submission to TestFlight + Google Play internal',
      '30 days of bug-fix support',
    ],
    whatsNotIncluded: [
      'Apple Developer / Google Play account fees (~$124/year combined)',
      'Public app store launch (we get you to internal testing)',
      'Backend/API development (book Full-Stack Web App MVP for backend)',
      'Native-only iOS or Android features (this is cross-platform)',
    ],
    revisionsIncluded: 2,
    refundPolicy: 'Full refund within 24 hours of purchase if work has not started. Pro-rated otherwise.',
    faq: [
      { q: 'Will it work on both iOS and Android?', a: 'Yes — one codebase ships to both platforms.' },
      { q: 'Do I need to provide the backend?', a: 'If your app needs server-side logic, book the Full-Stack Web App MVP alongside this, or we can integrate with an existing API you have.' },
      { q: 'Can you publish it to the app stores?', a: 'We get you all the way to TestFlight + Google Play internal testing. Full public store submission has additional Apple/Google review steps that take 1-2 extra weeks — available as an add-on.' },
    ],
    intakeFields: [
      { name: 'appName', label: 'App name', type: 'text', required: true },
      { name: 'appSummary', label: 'In one paragraph, what does the app do?', type: 'textarea', required: true },
      { name: 'audience', label: 'Who are the users?', type: 'textarea', required: true },
      { name: 'screens', label: 'List the screens you envision (one per line)', type: 'textarea', required: true, helpText: 'e.g. "Login, Home, Browse, Detail, Cart, Checkout, Profile, Settings"' },
      { name: 'platforms', label: 'Which platforms do you need?', type: 'checkbox-group', required: true, options: ['iOS', 'Android'] },
      { name: 'apiSource', label: 'Where will the data / backend come from?', type: 'select', required: true, options: ['You have an existing API', 'We build the backend (book Web App MVP)', 'No backend needed (offline-only app)', 'Not sure yet — discuss with us'] },
      { name: 'brandAssets', label: 'Brand assets / design preferences', type: 'url', required: false, placeholder: 'Figma link or Drive folder' },
      { name: 'inspirations', label: 'Similar apps you like (one per line)', type: 'textarea', required: false },
    ],
  },
  {
    id: '3',
    category: 'Data Analysis',
    title: 'Data Dashboard Setup',
    description: 'A connected interactive dashboard showing the KPIs that actually matter to your business — one place to track what is working and what is not.',
    icon: 'bar-chart',
    img: '/images/services/data-analysis.jpg',
    productized: true,
    price: 400000,
    timeline: '10 business days from brief',
    deliverables: [
      'Connected dashboard (up to 3 data sources)',
      'Up to 8 KPI charts',
      '1 automated weekly email report',
      '1-hour training session',
    ],
    process: [
      'You submit the brief + grant data access',
      'We design the dashboard (2 days)',
      'You approve the layout',
      'We build + connect data (5 days)',
      'Training call + handover',
    ],
    whatsIncluded: [
      'Up to 3 data source connections',
      'Up to 8 charts/cards',
      '1 round of layout revisions',
      '1-hour training session',
    ],
    whatsNotIncluded: [
      'BI tool license fees (where applicable)',
      'Data cleaning / migration / ETL beyond simple queries',
      'Ongoing maintenance (available as a retainer)',
    ],
    revisionsIncluded: 1,
    refundPolicy: 'Full refund within 24 hours of purchase if work has not started. Pro-rated otherwise.',
    faq: [
      { q: 'What data sources do you support?', a: 'Most common databases, spreadsheets, and SaaS platforms — including PostgreSQL, MySQL, MongoDB, Google Sheets, Stripe, and Shopify.' },
      { q: 'Do you provide hosting?', a: 'Yes — for tools we host on your behalf, we cover setup and connection. For tools you already license (e.g. Power BI), we connect to your existing subscription.' },
    ],
    intakeFields: [
      { name: 'businessName', label: 'Business name', type: 'text', required: true },
      { name: 'kpis', label: 'KPIs you want to track', type: 'textarea', required: true, helpText: 'e.g. Monthly revenue, signups, churn, top products...' },
      { name: 'dataSources', label: 'Data sources (up to 3)', type: 'checkbox-group', required: true, options: ['PostgreSQL', 'MySQL', 'MongoDB', 'Google Sheets', 'Stripe', 'Paystack', 'Shopify', 'Other'] },
      { name: 'tool', label: 'Preferred BI tool', type: 'select', required: true, options: ['Metabase (we host)', 'Power BI', 'Tableau', 'No preference — recommend one'] },
      { name: 'recipients', label: 'Who should get the weekly email report? (one email per line)', type: 'textarea', required: false },
      { name: 'accessNotes', label: 'How will you provide data access?', type: 'textarea', required: true, helpText: 'e.g. read-only DB credentials, API key, etc. Do NOT paste secrets here — we will share a secure link to upload them.' },
    ],
  },
  {
    id: '4',
    category: 'Research Writing',
    title: 'Research Writing — Undergraduate',
    description: 'End-to-end support for a BSc/HND project, term paper, or seminar paper — topic refinement, literature, methodology, analysis, and writing.',
    icon: 'book-open',
    img: '/images/services/research.jpg',
    productized: true,
    price: 100000,
    timeline: '14 business days from brief',
    deliverables: [
      'Up to 5 chapters / sections (~7,000 words)',
      'Literature review with up to 25 sources',
      'Methodology section',
      'Basic analysis & discussion',
      'Citations in your preferred style',
      'Reference list / bibliography',
    ],
    process: [
      'You submit the brief',
      'We refine topic + outline (2 days)',
      'You approve the outline',
      'We write the draft (8 days)',
      '1 round of revisions',
      'Final delivery',
    ],
    whatsIncluded: [
      'Topic refinement and outline',
      'Up to 25 cited sources',
      'Up to 7,000 words',
      '1 round of revisions',
      'Plagiarism-checked output',
    ],
    whatsNotIncluded: [
      'Original data collection (surveys, interviews, lab work)',
      'Advanced statistical analysis (book Data Analytics separately)',
      'Postgraduate-level depth (book the Postgraduate package)',
      'Submission / printing fees',
    ],
    revisionsIncluded: 1,
    refundPolicy: 'Full refund within 24 hours if work has not started. Non-refundable once the draft is delivered.',
    faq: [
      { q: 'Will it pass plagiarism checks?', a: 'Yes — we run it through Turnitin-style checks before delivery and aim for under 10% similarity.' },
      { q: 'What about ethics committee approval?', a: 'We help you draft any required ethics application, but submission and approval is your responsibility.' },
      { q: 'Do you cover all disciplines?', a: 'STEM, social sciences, business, education, and health sciences. Contact us for niche fields.' },
    ],
    intakeFields: [
      { name: 'institution', label: 'Institution / university', type: 'text', required: true, placeholder: 'e.g. University of Lagos' },
      { name: 'level', label: 'Level', type: 'select', required: true, options: ['100 / 200 level seminar', '300 / 400 level term paper', 'Final-year project (BSc / HND)', 'Other'] },
      { name: 'discipline', label: 'Discipline / department', type: 'text', required: true, placeholder: 'e.g. Public Administration, Computer Science' },
      { name: 'topic', label: 'Topic (or 2-3 ideas if not finalised)', type: 'textarea', required: true },
      { name: 'researchQuestion', label: 'Research question / objective', type: 'textarea', required: false, helpText: 'Leave blank if you want us to help frame this.' },
      { name: 'wordCount', label: 'Required word count / page count', type: 'text', required: true, placeholder: 'e.g. 5,000 words / 35 pages' },
      { name: 'citationStyle', label: 'Citation style', type: 'select', required: true, options: ['APA 7th', 'APA 6th', 'MLA', 'Chicago', 'Harvard', 'IEEE', 'My department uses something else'] },
      { name: 'submissionDeadline', label: 'Submission deadline', type: 'text', required: true, placeholder: 'e.g. 15 June 2026' },
      { name: 'supervisorNotes', label: 'Any supervisor feedback / requirements?', type: 'textarea', required: false },
    ],
  },
  {
    id: '14',
    category: 'Research Writing',
    title: 'Research Writing — Postgraduate',
    description: 'In-depth support for an MSc dissertation, PhD chapter, or journal-quality manuscript — original analysis, deeper synthesis, journal-ready output.',
    icon: 'book-open',
    img: '/images/services/research.jpg',
    productized: true,
    price: 240000,
    timeline: '4 weeks from brief',
    deliverables: [
      'Up to 12,000 words across required chapters',
      'Comprehensive literature review (50+ sources)',
      'Detailed methodology with justification',
      'Analysis with appropriate statistical depth',
      'Discussion linked to existing literature',
      'Citations in your preferred style',
      'Reference manager file (Zotero / EndNote / Mendeley)',
    ],
    process: [
      'You submit the brief',
      'We refine the research question + outline (4 days)',
      'You approve the outline',
      'We write draft chapters (2 weeks)',
      '2 rounds of revisions with supervisor-style critique',
      'Final delivery + journal formatting (if applicable)',
    ],
    whatsIncluded: [
      'Up to 12,000 words',
      '50+ peer-reviewed sources',
      'Methodology + analysis chapters',
      '2 rounds of revisions',
      'Plagiarism-checked output',
      'Reference manager file included',
    ],
    whatsNotIncluded: [
      'Original primary data collection',
      'PhD thesis end-to-end (request a custom quote — typically multi-stage)',
      'Submission / publication fees',
      'Defence / viva preparation (available as an add-on)',
    ],
    revisionsIncluded: 2,
    refundPolicy: 'Full refund within 24 hours if work has not started. Pro-rated once writing has begun.',
    faq: [
      { q: 'Can you handle a full PhD thesis?', a: 'A complete PhD thesis is multi-stage and we scope it as a custom engagement. This package is ideal for an MSc dissertation, a single PhD chapter, or a journal manuscript.' },
      { q: 'Do you do statistical analysis?', a: 'Up to standard inferential analysis (regression, ANOVA, chi-square). For complex modelling, book Data Analytics alongside.' },
      { q: 'Will the writing match my supervisor\'s expectations?', a: 'We work iteratively with your supervisor\'s feedback. Two revision rounds give space for that loop.' },
    ],
    intakeFields: [
      { name: 'institution', label: 'Institution / university', type: 'text', required: true },
      { name: 'level', label: 'Level', type: 'select', required: true, options: ['MSc / MA dissertation', 'MPhil thesis', 'PhD chapter', 'Journal manuscript', 'Conference paper'] },
      { name: 'discipline', label: 'Discipline / department', type: 'text', required: true },
      { name: 'topic', label: 'Topic / working title', type: 'textarea', required: true },
      { name: 'researchQuestion', label: 'Research question(s) / hypotheses', type: 'textarea', required: true },
      { name: 'methodology', label: 'Intended methodology', type: 'select', required: true, options: ['Quantitative', 'Qualitative', 'Mixed methods', 'Systematic review / meta-analysis', 'Theoretical / conceptual', 'Not yet decided'] },
      { name: 'dataAvailable', label: 'Do you have data, or will the work be desk-based?', type: 'select', required: true, options: ['I have data already', 'I will collect data', 'Desk-based (literature, secondary data)', 'Not sure yet'] },
      { name: 'wordCount', label: 'Required word count', type: 'text', required: true, placeholder: 'e.g. 12,000 words' },
      { name: 'chapters', label: 'Which chapters / sections do you need?', type: 'checkbox-group', required: true, options: ['Introduction', 'Literature review', 'Methodology', 'Results / analysis', 'Discussion', 'Conclusion', 'Abstract'] },
      { name: 'citationStyle', label: 'Citation style', type: 'select', required: true, options: ['APA 7th', 'APA 6th', 'MLA', 'Chicago', 'Harvard', 'Vancouver', 'IEEE', 'Journal-specific'] },
      { name: 'targetJournal', label: 'Target journal (for manuscripts)', type: 'text', required: false, placeholder: 'Leave blank if not applicable' },
      { name: 'submissionDeadline', label: 'Submission deadline', type: 'text', required: true },
      { name: 'supervisorNotes', label: 'Supervisor feedback / department guidelines', type: 'textarea', required: false },
    ],
  },

  /* ─── Larger productized packages (fixed scope, fixed price) ────────── */
  {
    id: '101',
    category: 'Web Development',
    title: 'Enterprise Web App Development',
    description: 'A larger web application beyond the MVP package — up to 3 user workflows, role-based access control, third-party integrations, and an admin panel. Built end-to-end with a modern, production-grade stack.',
    icon: 'code',
    img: '/images/services/software-dev.jpg',
    productized: true,
    price: 3500000,
    timeline: '8–10 weeks from brief',
    deliverables: [
      'Modern, responsive web application frontend',
      'Backend API with database',
      'Up to 3 distinct user workflows',
      'Role-based authentication (up to 3 roles)',
      '1 third-party integration (Paystack / Stripe / API)',
      'Full admin panel with analytics',
      'Deployed to production (your hosting)',
      'API documentation',
    ],
    process: [
      'You submit the brief',
      'Discovery call + feature scoping (1 week)',
      'Sprint 1: foundations + auth + admin (2 weeks)',
      'Sprint 2: workflow 1 (2 weeks)',
      'Sprint 3: workflow 2 + 3 (2 weeks)',
      'Sprint 4: integrations + polish (1 week)',
      'Beta + handover + training (1 week)',
    ],
    whatsIncluded: [
      'Up to 3 user workflows',
      'Role-based access (up to 3 roles)',
      '1 third-party integration',
      '3 rounds of revisions',
      'Deployment to a host you provide',
      '60 days of bug-fix support',
      'Source code ownership',
    ],
    whatsNotIncluded: [
      'Mobile apps (book the Mobile App package alongside)',
      'Hosting, database, and third-party service fees',
      'Workflows beyond the agreed 3 (additional ₦800,000 per workflow)',
      'Ongoing feature development after handover (available as a retainer)',
    ],
    revisionsIncluded: 3,
    refundPolicy: 'Full refund within 24 hours of purchase if work has not started. Pro-rated otherwise based on completed sprints.',
    faq: [
      { q: 'What if I need a 4th workflow?', a: 'Additional workflows are ₦800,000 each. We will scope them after the initial three are live.' },
      { q: 'Can you integrate with my existing API?', a: 'Yes — one integration is included. Additional integrations are ₦400,000 each.' },
      { q: 'Will I own the source code?', a: 'Yes. Full code ownership transfers to you on handover.' },
    ],
    intakeFields: [
      { name: 'productName', label: 'Product name', type: 'text', required: true },
      { name: 'productSummary', label: 'In one paragraph, what does the product do?', type: 'textarea', required: true },
      { name: 'audience', label: 'Who are the users?', type: 'textarea', required: true },
      { name: 'workflows', label: 'List the 3 core user workflows', type: 'textarea', required: true, helpText: 'e.g. "1. Customer places order. 2. Vendor fulfils order. 3. Admin tracks all orders."' },
      { name: 'roles', label: 'What roles need access?', type: 'textarea', required: true, helpText: 'e.g. "Customer, Vendor, Admin"' },
      { name: 'integration', label: 'Which third-party integration do you need first?', type: 'select', required: true, options: ['Paystack', 'Stripe', 'Email (SendGrid / Postmark)', 'SMS (Twilio / Termii)', 'Other API'] },
      { name: 'brandAssets', label: 'Brand assets (logo, colors, fonts) — link', type: 'url', required: false },
      { name: 'inspirations', label: 'Apps with similar functionality (one per line)', type: 'textarea', required: false },
    ],
  },
  {
    id: '103',
    category: 'Data Analysis',
    title: 'Machine Learning Model',
    description: 'A predictive model built on your data — from data cleaning through model selection, training, evaluation, and deployment. Delivered as a working API or notebook plus a clear report.',
    icon: 'brain',
    img: '/images/hero/data-dashboard.jpg',
    productized: true,
    price: 800000,
    timeline: '3–4 weeks from brief',
    deliverables: [
      'Trained predictive model (1 use case)',
      'Cleaned + feature-engineered dataset',
      'Jupyter notebook with full pipeline',
      'Model evaluation report with metrics',
      'Deployment script for production hosting',
      '1-hour walkthrough call',
    ],
    process: [
      'You submit the brief + data access',
      'Data exploration + cleaning (1 week)',
      'Model selection + training (1 week)',
      'Evaluation + iteration (1 week)',
      'Deployment + handover (3 days)',
    ],
    whatsIncluded: [
      '1 predictive use case (classification or regression)',
      'Dataset cleaning + feature engineering',
      'Up to 3 model architectures tested',
      'Performance report with metrics',
      '1 round of refinement',
      '1-hour training session',
    ],
    whatsNotIncluded: [
      'Multiple distinct prediction tasks (book separately)',
      'Generative AI / LLM fine-tuning (custom engagement)',
      'Ongoing model retraining (available as a retainer at ₦150,000/month)',
      'Cloud infrastructure costs',
    ],
    revisionsIncluded: 1,
    refundPolicy: 'Full refund within 24 hours of purchase if work has not started. Non-refundable once data exploration begins.',
    faq: [
      { q: 'What problems does this work for?', a: 'Classification (e.g. fraud detection, churn prediction) and regression (e.g. price prediction, demand forecasting). For computer vision or NLP, scope with us first.' },
      { q: 'Do I need to provide the data?', a: 'Yes — you provide read access to the dataset. We do not collect raw data on your behalf.' },
      { q: 'What about ongoing maintenance?', a: 'Models drift over time. We offer a monthly retainer at ₦150,000/month for retraining + monitoring.' },
    ],
    intakeFields: [
      { name: 'businessName', label: 'Business / use case name', type: 'text', required: true },
      { name: 'problem', label: 'What are you trying to predict?', type: 'textarea', required: true, helpText: 'e.g. "Whether a customer will churn in the next 30 days"' },
      { name: 'problemType', label: 'Type of prediction', type: 'select', required: true, options: ['Classification (yes/no, category)', 'Regression (a number)', 'Not sure — discuss with us'] },
      { name: 'datasetSize', label: 'How much data do you have?', type: 'select', required: true, options: ['<1,000 rows', '1,000–10,000 rows', '10,000–100,000 rows', '100,000+ rows'] },
      { name: 'dataFormat', label: 'Data format', type: 'select', required: true, options: ['CSV / Excel', 'Database (Postgres / MySQL / Mongo)', 'API endpoint', 'Other'] },
      { name: 'businessImpact', label: 'What decision will the model inform?', type: 'textarea', required: true, helpText: 'e.g. "Which customers to target with a retention offer."' },
      { name: 'dataAccess', label: 'How will you grant data access?', type: 'textarea', required: true, helpText: 'Read-only DB credentials, S3 link, etc. Do NOT paste secrets here — we will share a secure link.' },
    ],
  },
];

export function getService(id: string): ServiceCatalogEntry | undefined {
  return servicesCatalog.find((s) => s.id === id);
}

export function getProductizedService(id: string): ServiceCatalogEntry | undefined {
  const s = getService(id);
  return s && s.productized ? s : undefined;
}

/**
 * Single source of truth for whether a service can be split into installments.
 *
 *   - Explicit `installmentEligible: true|false` on a catalog entry wins.
 *   - Otherwise, default: productized + price ≥ ₦200,000 → eligible.
 *
 * Server-side guard — `paystack.controller.initializeTransaction` calls this
 * before creating a PaymentPlan so clients can't trick the API into splitting
 * an ineligible item.
 */
export const INSTALLMENT_PRICE_FLOOR_NGN = 200_000;

export function isServiceInstallmentEligible(service: ServiceCatalogEntry): boolean {
  if (service.installmentEligible === false) return false;
  if (service.installmentEligible === true) return true;
  return service.productized && (service.price ?? 0) >= INSTALLMENT_PRICE_FLOOR_NGN;
}
