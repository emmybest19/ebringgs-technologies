import { useEffect } from 'react';

interface SEOOptions {
  title: string;
  description?: string;
  image?: string;
}

const BASE_TITLE = 'E-Bringgs Technologies';

export function useSEO({ title, description, image }: SEOOptions) {
  useEffect(() => {
    // Page title
    document.title = title === BASE_TITLE ? BASE_TITLE : `${title} | ${BASE_TITLE}`;

    // Meta description
    let metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    if (description) metaDesc.content = description;

    // OG tags
    const setOG = (property: string, content: string) => {
      let tag = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.content = content;
    };

    setOG('og:title', document.title);
    if (description) setOG('og:description', description);
    if (image) setOG('og:image', image);
    setOG('og:type', 'website');

    return () => {
      document.title = BASE_TITLE;
    };
  }, [title, description, image]);
}
