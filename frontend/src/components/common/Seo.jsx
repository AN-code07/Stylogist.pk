import { useEffect } from 'react';

export default function Seo({ title, description, image, type = 'website', canonical, jsonLd, jsonLdId = 'seo-jsonld' }) {
  useEffect(() => {
    if (title) document.title = title;

    const setMeta = (selector, attr, value) => {
      if (!value) return null;
      let tag = document.head.querySelector(selector);
      if (!tag) {
        tag = document.createElement('meta');
        const [a, v] = selector.replace(/^meta\[/, '').replace(/\]$/, '').split('=');
        tag.setAttribute(a, v.replace(/"/g, ''));
        document.head.appendChild(tag);
      }
      tag.setAttribute(attr, value);
      return tag;
    };

    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:type"]', 'content', type);
    setMeta('meta[property="og:image"]', 'content', image);
    setMeta('meta[name="twitter:card"]', 'content', image ? 'summary_large_image' : 'summary');

    let canonicalHref = canonical;
    if (!canonicalHref && typeof window !== 'undefined') {
      const { origin, pathname } = window.location;
      canonicalHref = `${origin}${pathname}`;
    }

    if (canonicalHref) {
      let link = document.head.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonicalHref);
    }

    // JSON-LD HYDRATION LOGIC
    // Non-destructive on purpose: only overwrite/create when we have real
    // jsonLd. Never remove an existing script — it may have been emitted by
    // the Vercel prerender (api/product.js) and the crawler needs it to
    // stay put. Removing it during loading/error states is what caused
    // Google Rich Results to report "Product not found".
    if (jsonLd) {
      let script = document.head.querySelector(`script[data-seo="${jsonLdId}"]`);
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-seo', jsonLdId);
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    }
  }, [title, description, image, type, canonical, jsonLd, jsonLdId]);

  return null;
}