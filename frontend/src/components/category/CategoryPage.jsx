import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FiFilter, FiChevronRight, FiStar, FiLoader, FiPackage,
  FiChevronLeft, FiX, FiRefreshCw, FiAlertCircle
} from 'react-icons/fi';
import { useProducts } from '../../features/products/useProductHooks';
import { useCategories } from '../../features/categories/useCategoryHooks';
import { useBrands } from '../../features/brands/useBrandHooks';

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest' },
  { id: 'priceLow', label: 'Price: low to high' },
  { id: 'priceHigh', label: 'Price: high to low' },
  { id: 'rating', label: 'Top rated' },
  { id: 'bestSelling', label: 'Best selling' },
];

const formatPKR = (n) => `Rs ${Math.round(n || 0).toLocaleString()}`;

export default function CategoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Hydrate filters from URL so deep links from the navbar (e.g.
  // ?category=<id> or ?search=<term>) land on a pre-filtered view.
  const [category, setCategory] = useState(() => searchParams.get('category') || '');
  const [brand, setBrand] = useState(() => searchParams.get('brand') || '');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [dealOnly, setDealOnly] = useState(false);
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [page, setPage] = useState(1);
  const [filtersOpenMobile, setFiltersOpenMobile] = useState(false);

  // Reflect user-driven category/brand/search changes back into the URL so
  // the view is shareable and browser back/forward works naturally.
  useEffect(() => {
    const next = new URLSearchParams();
    if (category) next.set('category', category);
    if (brand) next.set('brand', brand);
    if (search) next.set('search', search);
    setSearchParams(next, { replace: true });
  }, [category, brand, search, setSearchParams]);

  // Pick up subsequent URL changes (e.g. clicking a different nav dropdown link).
  useEffect(() => {
    const urlCategory = searchParams.get('category') || '';
    const urlBrand = searchParams.get('brand') || '';
    const urlSearch = searchParams.get('search') || '';
    if (urlCategory !== category) setCategory(urlCategory);
    if (urlBrand !== brand) setBrand(urlBrand);
    if (urlSearch !== search) setSearch(urlSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const { data: categories = [] } = useCategories({ active: 'true' });
  const { data: brands = [] } = useBrands({ active: 'true' });

  const params = useMemo(() => {
    const p = { page, limit: PAGE_SIZE, sort };
    if (category) p.category = category;
    if (brand) p.brand = brand;
    if (maxPrice) p.maxPrice = maxPrice;
    if (inStockOnly) p.inStock = 'true';
    if (dealOnly) p.deal = 'true';
    if (search) p.search = search;
    return p;
  }, [page, sort, category, brand, maxPrice, inStockOnly, dealOnly, search]);

  const { data, isLoading, isError, refetch, isFetching } = useProducts(params);
  const items = data?.items ?? [];
  const pagination = data?.pagination;

  const topCategories = categories.filter((c) => c.level === 0);
  const activeCategoryName = category
    ? categories.find((c) => c._id === category)?.name
    : 'All products';

  const resetFilters = () => {
    setCategory('');
    setBrand('');
    setMaxPrice('');
    setInStockOnly(false);
    setDealOnly(false);
    setSort('newest');
    setSearch('');
    setPage(1);
  };

  const changeFilter = (fn) => (v) => {
    fn(v);
    setPage(1);
  };

  return (
    <div className="w-full bg-white min-h-screen font-sans text-slate-900">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-5">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link to="/" className="hover:text-[#007074]">Home</Link>
          <FiChevronRight size={11} />
          <span className="text-slate-900 font-medium">Shop</span>
          {category && (
            <>
              <FiChevronRight size={11} />
              <span className="text-[#007074]">{activeCategoryName}</span>
            </>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-20 flex flex-col lg:flex-row gap-8">
        {/* Sidebar filters */}
        <button
          onClick={() => setFiltersOpenMobile(true)}
          className="lg:hidden inline-flex items-center gap-2 self-start px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700"
        >
          <FiFilter size={15} /> Filters
        </button>

        <aside className={`
          ${filtersOpenMobile ? 'fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-0' : 'hidden'}
          lg:block lg:relative lg:inset-auto lg:z-auto
          lg:w-60 shrink-0
        `}>
          <div className="fixed lg:static top-0 right-0 h-full lg:h-auto w-80 lg:w-auto bg-white lg:bg-transparent overflow-y-auto lg:overflow-visible p-5 lg:p-0 shadow-xl lg:shadow-none">
            <div className="flex items-center justify-between lg:hidden mb-5">
              <h3 className="text-base font-semibold text-slate-900">Filters</h3>
              <button onClick={() => setFiltersOpenMobile(false)} className="w-8 h-8 rounded-md text-slate-400 hover:bg-slate-100 inline-flex items-center justify-center">
                <FiX size={16} />
              </button>
            </div>

            <div className="lg:sticky lg:top-8 space-y-8">
              <FilterSection title="Category">
                <FilterPill
                  active={!category}
                  onClick={() => changeFilter(setCategory)('')}
                >
                  All
                </FilterPill>
                <div className="flex flex-col gap-1.5 mt-2">
                  {topCategories.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => changeFilter(setCategory)(c._id)}
                      className={`text-left text-sm transition-colors ${
                        category === c._id ? 'text-[#007074] font-medium' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="Brand">
                <select
                  value={brand}
                  onChange={(e) => changeFilter(setBrand)(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074]"
                >
                  <option value="">All brands</option>
                  {brands.map((b) => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
              </FilterSection>

              <FilterSection title={`Max price: ${maxPrice ? formatPKR(maxPrice) : 'any'}`}>
                <input
                  type="range"
                  min="100"
                  max="100000"
                  step="100"
                  value={maxPrice || 100000}
                  onChange={(e) => changeFilter(setMaxPrice)(e.target.value)}
                  className="w-full accent-[#007074]"
                />
                {maxPrice && (
                  <button
                    onClick={() => changeFilter(setMaxPrice)('')}
                    className="text-xs text-slate-500 hover:text-[#007074] mt-1"
                  >
                    Clear
                  </button>
                )}
              </FilterSection>

              <FilterSection title="Availability">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => changeFilter(setInStockOnly)(e.target.checked)}
                    className="w-4 h-4 accent-[#007074]"
                  />
                  In stock only
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 mt-2">
                  <input
                    type="checkbox"
                    checked={dealOnly}
                    onChange={(e) => changeFilter(setDealOnly)(e.target.checked)}
                    className="w-4 h-4 accent-[#007074]"
                  />
                  On sale
                </label>
              </FilterSection>

              <button
                onClick={resetFilters}
                className="w-full py-2 text-sm text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50"
              >
                Reset filters
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-8">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">
                {search ? `Results for "${search}"` : activeCategoryName}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {pagination
                  ? `${pagination.total} ${pagination.total === 1 ? 'product' : 'products'}`
                  : ''}
                {search && (
                  <button
                    onClick={() => { setSearch(''); setPage(1); }}
                    className="ml-2 text-xs text-[#007074] hover:underline"
                  >
                    clear search
                  </button>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-500">Sort by</label>
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="bg-white border border-slate-200 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074]"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {isError ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <FiAlertCircle className="mx-auto text-red-500 mb-3" size={28} />
              <h3 className="text-sm font-semibold text-slate-900">Couldn't load products</h3>
              <button
                onClick={() => refetch()}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#007074] text-white rounded-lg text-sm font-medium hover:bg-[#005a5d]"
              >
                <FiRefreshCw size={14} /> Try again
              </button>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-[3/4] bg-slate-100 rounded-xl animate-pulse" />
                  <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse" />
                  <div className="h-4 w-1/3 bg-slate-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-16 text-center">
              <FiPackage size={28} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-base font-semibold text-slate-900">No products match your filters</h3>
              <p className="text-sm text-slate-500 mt-1">Try removing a filter or widening your price range.</p>
              <button
                onClick={resetFilters}
                className="mt-4 px-4 py-2 bg-[#007074] text-white rounded-lg text-sm font-medium hover:bg-[#005a5d]"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <PagerBtn
                    disabled={page <= 1 || isFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <FiChevronLeft size={14} />
                  </PagerBtn>
                  {pageRange(page, pagination.pages).map((n, i) =>
                    n === '…' ? (
                      <span key={`e-${i}`} className="px-2 text-slate-400 text-sm">…</span>
                    ) : (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className={`w-9 h-9 rounded-md text-sm font-medium ${
                          n === page
                            ? 'bg-[#007074] text-white'
                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {n}
                      </button>
                    )
                  )}
                  <PagerBtn
                    disabled={page >= pagination.pages || isFetching}
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  >
                    <FiChevronRight size={14} />
                  </PagerBtn>
                  {isFetching && <FiLoader className="animate-spin text-slate-400 ml-2" size={16} />}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

/* ----------- subcomponents ----------- */

function FilterSection({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function FilterPill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`text-left text-sm w-full transition-colors ${
        active ? 'text-[#007074] font-medium' : 'text-slate-600 hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  );
}

function ProductCard({ product }) {
  const to = `/product/${product.slug}`;
  const discount =
    product.maxPrice && product.minPrice && product.maxPrice > product.minPrice
      ? Math.round(((product.maxPrice - product.minPrice) / product.maxPrice) * 100)
      : product.discountPercentage || 0;

  return (
    <Link to={to} className="group block">
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <FiPackage size={36} />
          </div>
        )}
        {discount > 0 && (
          <span className="absolute top-3 left-3 bg-rose-500 text-white text-[11px] font-medium px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}
        {product.totalStock === 0 && (
          <span className="absolute top-3 right-3 bg-slate-900 text-white text-[11px] font-medium px-2 py-0.5 rounded-full">
            Sold out
          </span>
        )}
      </div>

      <div className="mt-3">
        <div className="text-[11px] text-slate-500 uppercase tracking-wider">
          {product.brand?.name || '—'}
        </div>
        <h3 className="text-sm font-medium text-slate-900 mt-1 line-clamp-1 group-hover:text-[#007074]">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-slate-900">{formatPKR(product.minPrice)}</span>
            {product.maxPrice && product.maxPrice !== product.minPrice && (
              <span className="text-xs text-slate-400">– {formatPKR(product.maxPrice)}</span>
            )}
          </div>
          {product.averageRating > 0 && (
            <div className="flex items-center gap-0.5 text-[11px] text-slate-500">
              <FiStar className="fill-amber-400 text-amber-400" size={11} />
              {product.averageRating.toFixed(1)}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function PagerBtn({ children, disabled, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="w-9 h-9 rounded-md border border-slate-200 inline-flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

// Render a compact pager: first, current±1, last, with '…' collapses.
function pageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);

  const out = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('…');
    out.push(sorted[i]);
  }
  return out;
}
