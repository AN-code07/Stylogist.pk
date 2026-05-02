import { create } from 'zustand';

// Single source of truth for the product listing filter state.
//
// Architectural rules (mirror the backend contract):
//
//   - Category lives in the URL via `/category/:slug` and is treated as a
//     scope, not a filter — it determines which collection the user is
//     browsing. We mirror it into the store so other consumers (header,
//     breadcrumb, cart suggestions) can read it without re-deriving the route.
//
//   - Brand and ingredient anchors come from `/brand/:slug` and
//     `/ingredient/:slug` and behave identically to category — they pin a
//     SEO scope. Multi-select brand/ingredient filters layered ON TOP live
//     here and never touch the URL.
//
//   - Every other knob (price, sort, in-stock, deal-only, multi-select
//     ingredients, multi-select brands) is body-only. Persisting these in
//     the URL would multiply pages with identical content and hurt SEO.
//
//   - Search is exclusive: applying a search query nukes every other filter
//     (category scope is preserved if the user is already inside a category;
//     anchors from /brand/:slug or /ingredient/:slug are also preserved so
//     "search inside this brand" still works).
//
// Components MUST NOT keep parallel filter state — they read from this
// store and dispatch through the actions below. Same store, same shape,
// across the storefront.
const initial = {
  // SEO scope (mirrored from URL params; never written by user actions)
  scope: { type: 'all', slug: '', label: '' }, // type: 'all' | 'category' | 'brand' | 'ingredient'

  // Body-only filters
  brands: [],          // array of brand slugs
  ingredients: [],     // array of ingredient slugs
  ingredientLogic: 'or', // 'or' | 'and'
  minPrice: '',
  maxPrice: '',
  inStock: false,
  onSale: false,
  rating: 0,           // minimum rating
  sort: 'newest',      // 'newest' | 'priceLow' | 'priceHigh' | 'rating' | 'bestSelling'
  search: '',
  page: 1,
};

const useFilterStore = create((set, get) => ({
  ...initial,

  /* SEO scope (set by the route component on mount) */
  setScope: (scope) =>
    set(() => ({
      scope: { type: scope.type || 'all', slug: scope.slug || '', label: scope.label || '' },
      page: 1,
    })),

  /* Body-only filter actions */
  toggleBrand: (slug) =>
    set((s) => ({
      brands: s.brands.includes(slug) ? s.brands.filter((b) => b !== slug) : [...s.brands, slug],
      page: 1,
    })),

  setBrands: (brands) => set(() => ({ brands: [...new Set(brands)], page: 1 })),

  toggleIngredient: (slug) =>
    set((s) => ({
      ingredients: s.ingredients.includes(slug)
        ? s.ingredients.filter((i) => i !== slug)
        : [...s.ingredients, slug],
      page: 1,
    })),

  setIngredients: (ingredients) => set(() => ({ ingredients: [...new Set(ingredients)], page: 1 })),

  setIngredientLogic: (logic) =>
    set(() => ({ ingredientLogic: logic === 'and' ? 'and' : 'or', page: 1 })),

  setPriceRange: (min, max) =>
    set(() => ({ minPrice: min ?? '', maxPrice: max ?? '', page: 1 })),

  setInStock: (v) => set(() => ({ inStock: !!v, page: 1 })),
  setOnSale: (v) => set(() => ({ onSale: !!v, page: 1 })),
  setRating: (v) => set(() => ({ rating: Number(v) || 0, page: 1 })),
  setSort: (v) => set(() => ({ sort: v || 'newest', page: 1 })),
  setPage: (n) => set(() => ({ page: Math.max(1, Number(n) || 1) })),

  /* Search clears every other filter (rule 2). Scope is preserved so the
     user can still scope "search jeans inside the Levi's brand". */
  applySearch: (query) =>
    set((s) => ({
      ...initial,
      scope: s.scope,
      search: (query || '').trim(),
    })),

  clearSearch: () => set(() => ({ search: '', page: 1 })),

  /* Reset every body-only filter while keeping the SEO scope intact. */
  resetFilters: () =>
    set((s) => ({
      ...initial,
      scope: s.scope,
    })),

  /* Returns the canonical request payload for `/products/search`. Single
     formatter so every consumer talks to the API the same way. */
  buildPayload: () => {
    const s = get();
    const payload = {
      sort: s.sort,
      page: s.page,
      limit: 12,
    };

    // Scope → matching filter key on the backend
    if (s.scope.type === 'category' && s.scope.slug) payload.categorySlug = s.scope.slug;
    else if (s.scope.type === 'brand' && s.scope.slug) payload.brandSlug = s.scope.slug;
    else if (s.scope.type === 'ingredient' && s.scope.slug) payload.ingredientSlug = s.scope.slug;

    // Body-only filters
    if (s.brands.length) payload.brands = s.brands;
    if (s.ingredients.length) {
      payload.ingredients = s.ingredients;
      payload.ingredientLogic = s.ingredientLogic;
    }
    if (s.minPrice) payload.minPrice = Number(s.minPrice);
    if (s.maxPrice) payload.maxPrice = Number(s.maxPrice);
    if (s.inStock) payload.inStock = true;
    if (s.onSale) payload.onSale = true;
    if (s.rating) payload.rating = s.rating;
    if (s.search) payload.search = s.search;

    return payload;
  },
}));

export default useFilterStore;
