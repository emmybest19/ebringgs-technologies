import { useEffect } from 'react';

interface SEOOptions {
  title: string;
  description?: string;
  image?: string;
  /**
   * Site / app name appended after the title. Each app sets its own
   * (e.g. "E-Bringgs Technologies", "E-Bringgs · Teacher Portal").
   */
  siteName?: string;
  /**
   * Canonical URL for the page (without trailing slash). When provided we set
   * <link rel="canonical"> and og:url.
   */
  url?: string;
  /**
   * If true, sets <meta name="robots" content="noindex, nofollow">.
   * Useful for admin/teacher portals and auth pages.
   */
  noIndex?: boolean;
  /**
   * og:type — defaults to "website". Use "article" for blog posts.
   */
  type?: 'website' | 'article';
}

const DEFAULT_SITE = 'E-Bringgs Technologies';

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

export function useSEO({
  title,
  description,
  image,
  siteName,
  url,
  noIndex,
  type = 'website',
}: SEOOptions) {
  useEffect(() => {
    const site = siteName ?? DEFAULT_SITE;
    const fullTitle = title === site ? site : `${title} | ${site}`;
    document.title = fullTitle;

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

    setOG('og:title', fullTitle);
    setOG('og:site_name', site);
    setOG('og:type', type);
    if (description) setOG('og:description', description);
    if (image) setOG('og:image', image);
    if (url) setOG('og:url', url);

    setTwitter('twitter:card', image ? 'summary_large_image' : 'summary');
    setTwitter('twitter:title', fullTitle);
    if (description) setTwitter('twitter:description', description);
    if (image) setTwitter('twitter:image', image);

    if (url) upsertLink('canonical', url);

    if (noIndex !== undefined) {
      upsertMeta(
        'meta[name="robots"]',
        () => {
          const m = document.createElement('meta');
          m.name = 'robots';
          return m;
        },
        noIndex ? 'noindex, nofollow' : 'index, follow',
      );
    }

    return () => {
      document.title = site;
    };
  }, [title, description, image, siteName, url, noIndex, type]);
}
