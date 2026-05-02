import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductsPage from '../components/products/ProductsPage';
import Seo from '../components/common/Seo';
import useFilterStore from '../store/useFilterStore';

// Dedicated /search route. The query lives in the URL as `?search=` only
// because search is the *intent* of the page — the user typed/landed with
// it. Once captured, it's pushed into the FilterStore which (per the
// architecture rules) clears every other filter so the search isn't
// silently narrowed by stale state.
//
// All other filter knobs are body-only and never enter the URL.
export default function SearchResults() {
  const [params] = useSearchParams();
  const q = (params.get('search') || params.get('q') || '').trim();
  const applySearch = useFilterStore((s) => s.applySearch);
  const clearSearch = useFilterStore((s) => s.clearSearch);

  // Sync the URL query into the FilterStore on mount + whenever it changes.
  // applySearch resets every other filter (architecture rule 2).
  useEffect(() => {
    if (q) applySearch(q);
    else clearSearch();
    return () => { clearSearch(); };
  }, [q, applySearch, clearSearch]);

  const seo = useMemo(() => {
    if (!q) {
      return {
        title: 'Search · Stylogist',
        description: 'Search the Stylogist catalogue.',
      };
    }
    return {
      title: `Search results for "${q}" · Stylogist`,
      description: `Browse Stylogist products matching "${q}". Free shipping and cash on delivery across Pakistan.`,
    };
  }, [q]);

  const jsonLd = useMemo(() => {
    if (!q) return null;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return {
      '@context': 'https://schema.org',
      '@type': 'SearchResultsPage',
      name: `Search results for "${q}"`,
      url: `${origin}/search?search=${encodeURIComponent(q)}`,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${origin}/search?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    };
  }, [q]);

  return (
    <>
      <Seo
        title={seo.title}
        description={seo.description}
        type="website"
        canonical={
          typeof window !== 'undefined' && q
            ? `${window.location.origin}/search?search=${encodeURIComponent(q)}`
            : undefined
        }
        jsonLd={jsonLd}
        jsonLdId="search-results"
      />
      {!q && <NoIndexHint />}
      <ProductsPage scopeType="all" />
    </>
  );
}

function NoIndexHint() {
  React.useEffect(() => {
    const tag = document.createElement('meta');
    tag.setAttribute('name', 'robots');
    tag.setAttribute('content', 'noindex, follow');
    tag.setAttribute('data-noindex-search', '1');
    document.head.appendChild(tag);
    return () => {
      document.head.querySelectorAll('meta[data-noindex-search="1"]').forEach((n) => n.remove());
    };
  }, []);
  return null;
}
