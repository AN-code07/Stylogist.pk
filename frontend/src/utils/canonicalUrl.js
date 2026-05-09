// Canonical URL builder. Filtered listing pages (?category=, ?brand=,
// ?sort=, ?minPrice=...) generate combinatorial URLs that Google sees as
// duplicates of each other. We solve this by:
//
//   1. Whitelisting only the params that meaningfully change the rendered
//      page (category / brand / search). Pagination and sort are EXCLUDED
//      so /category?page=2 and /category?page=3 share one canonical.
//   2. Sorting the surviving params alphabetically so different query-
//      orderings collapse to the same canonical string.
//   3. Dropping default values (sort=newest, page=1) entirely.
//
// Returns an absolute URL using window.location.origin.

const DEFAULT_VALUES = {
  sort: 'newest',
  page: '1',
};

// Params we DO want in the canonical because they truly partition the
// content (different products, not just different ordering).
const CANONICAL_PARAMS = ['category', 'brand', 'search', 'ingredient', 'deal', 'featured', 'trending'];

export function buildCanonicalUrl(pathname, searchParams) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://stylogist.pk';
  const params = new URLSearchParams();

  // Accept either a URLSearchParams instance, a plain object, or a string.
  const source =
    typeof searchParams === 'string'
      ? new URLSearchParams(searchParams.startsWith('?') ? searchParams.slice(1) : searchParams)
      : searchParams instanceof URLSearchParams
      ? searchParams
      : new URLSearchParams(Object.entries(searchParams || {}));

  CANONICAL_PARAMS.forEach((key) => {
    const value = source.get(key);
    if (value && value !== DEFAULT_VALUES[key]) {
      params.set(key, value);
    }
  });

  // Alphabetize. URLSearchParams iterates insertion order, so we re-sort.
  const sorted = new URLSearchParams();
  Array.from(params.keys())
    .sort()
    .forEach((k) => sorted.set(k, params.get(k)));

  const qs = sorted.toString();
  return `${origin}${pathname}${qs ? `?${qs}` : ''}`;
}
