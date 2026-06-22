import { useEffect } from 'react';

/**
 * Per-page SEO + social + structured-data sync. Mounts on the document head
 * imperatively (no react-helmet dep) and tears down JSON-LD on unmount so
 * stale schema doesn't leak across route changes.
 *
 * Cheat sheet:
 *   - `title` + `description` for plain SEO.
 *   - `image` + `imageAlt` for OG/Twitter cards.
 *   - `url` to set canonical + og:url.
 *   - `noIndex` for private/auth/payment pages.
 *   - `type: 'article'` + `article` for blog posts / case studies.
 *   - `jsonLd` for Schema.org structured data (one object or an array).
 *   - `keywords` for the keywords meta (low SEO value but cheap).
 */
interface ArticleMeta {
  author?: string;
  publishedTime?: string; // ISO 8601
  modifiedTime?: string;
  section?: string;       // category, e.g. "Engineering"
  tags?: string[];
}

interface TwitterMeta {
  /** @ebringgs handle; sets twitter:site. */
  site?: string;
  /** Article author's @handle; sets twitter:creator. */
  creator?: string;
}

interface SEOOptions {
  title: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  keywords?: string[];
  siteName?: string;
  url?: string;
  noIndex?: boolean;
  /**
   * Extra robots directives appended after the index/noindex base. Common:
   * 'max-image-preview:large', 'noarchive', 'nosnippet', 'max-snippet:-1'.
   */
  robotsExtras?: string[];
  type?: 'website' | 'article' | 'profile';
  article?: ArticleMeta;
  twitter?: TwitterMeta;
  /**
   * One Schema.org object, or an array of them. Each becomes its own
   * <script type="application/ld+json"> tag, tagged with a data-seo-jsonld
   * attribute so the next page can clean them up.
   */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** Locale string for og:locale, e.g. 'en_US'. */
  locale?: string;
}

const DEFAULT_SITE = 'E-Bringgs Technologies';
const JSONLD_ATTR = 'data-seo-jsonld';

function upsertMeta(selector: string, build: () => HTMLMetaElement, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = build();
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function upsertLink(rel: string, href: string) {
  let tag = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement('link');
    tag.rel = rel;
    document.head.appendChild(tag);
  }
  tag.href = href;
}

function removeMeta(selector: string) {
  document.head.querySelector(selector)?.remove();
}

function clearJsonLd() {
  document.head.querySelectorAll(`script[${JSONLD_ATTR}]`).forEach((s) => s.remove());
}

export function useSEO({
  title,
  description,
  image,
  imageAlt,
  keywords,
  siteName,
  url,
  noIndex,
  robotsExtras,
  type = 'website',
  article,
  twitter,
  jsonLd,
  locale = 'en_US',
}: SEOOptions) {
  useEffect(() => {
    const site = siteName ?? DEFAULT_SITE;
    const fullTitle = title === site ? site : `${title} | ${site}`;
    document.title = fullTitle;

    // Description
    if (description) {
      upsertMeta(
        'meta[name="description"]',
        () => {
          const m = document.createElement('meta');
          m.name = 'description';
          return m;
        },
        description,
      );
    }

    // Keywords (low value, but cheap)
    if (keywords && keywords.length) {
      upsertMeta(
        'meta[name="keywords"]',
        () => {
          const m = document.createElement('meta');
          m.name = 'keywords';
          return m;
        },
        keywords.join(', '),
      );
    }

    // OG + Twitter helpers
    const setOG = (property: string, content: string) =>
      upsertMeta(
        `meta[property="${property}"]`,
        () => {
          const m = document.createElement('meta');
          m.setAttribute('property', property);
          return m;
        },
        content,
      );
    const setTwitter = (name: string, content: string) =>
      upsertMeta(
        `meta[name="${name}"]`,
        () => {
          const m = document.createElement('meta');
          m.name = name;
          return m;
        },
        content,
      );

    // Open Graph
    setOG('og:title', fullTitle);
    setOG('og:site_name', site);
    setOG('og:type', type);
    setOG('og:locale', locale);
    if (description) setOG('og:description', description);
    if (image) setOG('og:image', image);
    if (imageAlt) setOG('og:image:alt', imageAlt);
    if (url) setOG('og:url', url);

    // Article-specific OG tags (only meaningful when type === 'article')
    if (article && type === 'article') {
      if (article.author) setOG('article:author', article.author);
      if (article.publishedTime) setOG('article:published_time', article.publishedTime);
      if (article.modifiedTime) setOG('article:modified_time', article.modifiedTime);
      if (article.section) setOG('article:section', article.section);
      (article.tags || []).forEach((tag, i) => {
        // Multiple article:tag entries — upsert with index-keyed selector
        upsertMeta(
          `meta[property="article:tag"][data-tag-index="${i}"]`,
          () => {
            const m = document.createElement('meta');
            m.setAttribute('property', 'article:tag');
            m.setAttribute('data-tag-index', String(i));
            return m;
          },
          tag,
        );
      });
    }

    // Twitter Card
    setTwitter('twitter:card', image ? 'summary_large_image' : 'summary');
    setTwitter('twitter:title', fullTitle);
    if (description) setTwitter('twitter:description', description);
    if (image) setTwitter('twitter:image', image);
    if (imageAlt) setTwitter('twitter:image:alt', imageAlt);
    if (twitter?.site) setTwitter('twitter:site', twitter.site);
    if (twitter?.creator) setTwitter('twitter:creator', twitter.creator);

    // Canonical
    if (url) upsertLink('canonical', url);

    // Robots
    if (noIndex !== undefined || (robotsExtras && robotsExtras.length)) {
      const parts: string[] = [];
      parts.push(noIndex ? 'noindex' : 'index');
      parts.push(noIndex ? 'nofollow' : 'follow');
      if (robotsExtras) parts.push(...robotsExtras);
      upsertMeta(
        'meta[name="robots"]',
        () => {
          const m = document.createElement('meta');
          m.name = 'robots';
          return m;
        },
        parts.join(', '),
      );
    }

    // JSON-LD structured data. Always clear what we set last time so two
    // routes with different schemas don't double-up.
    clearJsonLd();
    if (jsonLd) {
      const items = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      items.forEach((obj) => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute(JSONLD_ATTR, 'true');
        script.textContent = JSON.stringify(obj);
        document.head.appendChild(script);
      });
    }

    return () => {
      document.title = site;
      clearJsonLd();
      // Drop article:tag tags we added; static OG tags stay because the next
      // useSEO call will overwrite them in place.
      document.head
        .querySelectorAll('meta[property="article:tag"]')
        .forEach((el) => el.remove());
      // Drop article-specific tags too so a non-article page after an article
      // doesn't keep showing the old author/published time.
      ['article:author', 'article:published_time', 'article:modified_time', 'article:section']
        .forEach((p) => removeMeta(`meta[property="${p}"]`));
    };
    // Stringify objects for stable deps; arrays of strings get joined.
  }, [
    title,
    description,
    image,
    imageAlt,
    keywords?.join('|'),
    siteName,
    url,
    noIndex,
    robotsExtras?.join('|'),
    type,
    article ? JSON.stringify(article) : '',
    twitter ? JSON.stringify(twitter) : '',
    jsonLd ? JSON.stringify(jsonLd) : '',
    locale,
  ]);
}

/**
 * Re-exported builders for common Schema.org shapes. Kept here so callers
 * import everything from `@ebringgs/ui` rather than memorising JSON shapes.
 */
export const schema = {
  organization: (overrides: Partial<Record<string, unknown>> = {}) => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'E-Bringgs Technologies',
    url: 'https://ebringgs.com',
    logo: 'https://ebringgs.com/logo-mark.png',
    sameAs: [] as string[],
    ...overrides,
  }),
  website: (url = 'https://ebringgs.com') => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url,
    name: 'E-Bringgs Technologies',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${url}/blog?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }),
  breadcrumb: (items: { name: string; url: string }[]) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  }),
  blogPosting: (p: {
    headline: string;
    description?: string;
    image?: string;
    url: string;
    datePublished: string;
    dateModified?: string;
    authorName: string;
    category?: string;
    keywords?: string[];
  }) => ({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.headline,
    description: p.description,
    image: p.image,
    url: p.url,
    datePublished: p.datePublished,
    dateModified: p.dateModified ?? p.datePublished,
    author: { '@type': 'Person', name: p.authorName },
    publisher: {
      '@type': 'Organization',
      name: 'E-Bringgs Technologies',
      logo: { '@type': 'ImageObject', url: 'https://ebringgs.com/logo-mark.png' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': p.url },
    articleSection: p.category,
    keywords: p.keywords?.join(', '),
  }),
  faqPage: (faqs: { q: string; a: string }[]) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }),
  service: (s: {
    name: string;
    description: string;
    url: string;
    areaServed?: string;
    serviceType?: string;
  }) => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: s.name,
    description: s.description,
    url: s.url,
    provider: {
      '@type': 'Organization',
      name: 'E-Bringgs Technologies',
      url: 'https://ebringgs.com',
    },
    areaServed: s.areaServed ?? 'Worldwide',
    serviceType: s.serviceType,
  }),
  course: (c: {
    name: string;
    description: string;
    url: string;
    provider?: string;
  }) => ({
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: c.name,
    description: c.description,
    url: c.url,
    provider: {
      '@type': 'Organization',
      name: c.provider ?? 'E-Bringgs Technologies',
      sameAs: 'https://ebringgs.com',
    },
  }),
  credential: (c: {
    name: string;
    recipientName: string;
    issuedOn: string;
    credentialId: string;
    url: string;
    issuerName?: string;
  }) => ({
    '@context': 'https://schema.org',
    '@type': 'EducationalOccupationalCredential',
    name: c.name,
    credentialCategory: 'certificate',
    dateCreated: c.issuedOn,
    identifier: c.credentialId,
    url: c.url,
    recognizedBy: {
      '@type': 'Organization',
      name: c.issuerName ?? 'E-Bringgs Technologies',
      url: 'https://ebringgs.com',
    },
    recipient: { '@type': 'Person', name: c.recipientName },
  }),
};
