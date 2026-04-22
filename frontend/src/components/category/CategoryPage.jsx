import React, { useEffect, useMemo, useRef, useState, memo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FiFilter, FiChevronRight, FiStar, FiLoader, FiPackage,
  FiChevronLeft, FiX, FiRefreshCw, FiAlertCircle, FiHeart, FiShoppingCart,
  FiChevronDown, FiCheck, FiSearch
} from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
import { useProducts } from '../../features/products/useProductHooks';
import { useCategories } from '../../features/categories/useCategoryHooks';
import { useBrands } from '../../features/brands/useBrandHooks';
import useWishlistStore from '../../store/useWishlistStore';
import { resolveImageUrl } from '../../utils/imageUrl';

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

  const [category, setCategory] = useState(() => searchParams.get('category') || '');
  const [brand, setBrand] = useState(() => searchParams.get('brand') || '');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [dealOnly, setDealOnly] = useState(false);
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [page, setPage] = useState(1);
  const [filtersOpenMobile, setFiltersOpenMobile] = useState(false);

  useEffect(() => {
    const next = new URLSearchParams();
    if (category) next.set('category', category);
    if (brand) next.set('brand', brand);
    if (search) next.set('search', search);
    setSearchParams(next, { replace: true });
  }, [category, brand, search, setSearchParams]);

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
    <div className="w-full bg-white min-h-screen font-sans text-slate-900 overflow-x-hidden">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-5">
        <ScrollReveal className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link to="/" className="hover:text-[#007074]">Home</Link>
          <FiChevronRight size={11} />
          <span className="text-slate-900 font-medium">Shop</span>
          {category && (
            <>
              <FiChevronRight size={11} />
              <span className="text-[#007074]">{activeCategoryName}</span>
            </>
          )}
        </ScrollReveal>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-20 flex flex-col lg:flex-row gap-8">
        
        {/* Mobile Filters Toggle */}
        <ScrollReveal>
          <button
            onClick={() => setFiltersOpenMobile(true)}
            className="lg:hidden inline-flex items-center gap-2 self-start px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700"
          >
            <FiFilter size={15} /> Filters
          </button>
        </ScrollReveal>

        {/* Sidebar filters (ANIMATED ON SCROLL) */}
        <ScrollReveal as="aside" delay={100} className={`
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
                <FancyDropdown
                  value={brand}
                  onChange={changeFilter(setBrand)}
                  placeholder="All brands"
                  searchable
                  options={brands.map((b) => ({ value: b._id, label: b.name }))}
                />
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
        </ScrollReveal>

        {/* Main Product Area */}
        <main className="flex-1 min-w-0">
          
          {/* Header (ANIMATED ON SCROLL) */}
          <ScrollReveal delay={200} className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-8">
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
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-52">
                <FancyDropdown
                  value={category}
                  onChange={(v) => { changeFilter(setCategory)(v); }}
                  placeholder="All categories"
                  searchable
                  options={topCategories.map((c) => ({ value: c._id, label: c.name }))}
                />
              </div>
              <div className="w-44">
                <FancyDropdown
                  value={sort}
                  onChange={(v) => { setSort(v); setPage(1); }}
                  placeholder="Sort by"
                  options={SORT_OPTIONS.map((o) => ({ value: o.id, label: o.label }))}
                />
              </div>
            </div>
          </ScrollReveal>

          {isError ? (
            <ScrollReveal className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <FiAlertCircle className="mx-auto text-red-500 mb-3" size={28} />
              <h3 className="text-sm font-semibold text-slate-900">Couldn't load products</h3>
              <button
                onClick={() => refetch()}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#007074] text-white rounded-lg text-sm font-medium hover:bg-[#005a5d]"
              >
                <FiRefreshCw size={14} /> Try again
              </button>
            </ScrollReveal>
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
            <ScrollReveal className="bg-slate-50 border border-slate-200 rounded-xl p-16 text-center">
              <FiPackage size={28} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-base font-semibold text-slate-900">No products match your filters</h3>
              <p className="text-sm text-slate-500 mt-1">Try removing a filter or widening your price range.</p>
              <button
                onClick={resetFilters}
                className="mt-4 px-4 py-2 bg-[#007074] text-white rounded-lg text-sm font-medium hover:bg-[#005a5d]"
              >
                Reset filters
              </button>
            </ScrollReveal>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {items.map((p, idx) => (
                  /* Wrap EACH item in ScrollReveal so they cascade as the user scrolls */
                  <ScrollReveal key={p._id} delay={(idx % 4) * 100} className="h-full">
                    <ProductCard product={p} />
                  </ScrollReveal>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <ScrollReveal className="mt-10 flex items-center justify-center gap-2">
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
                </ScrollReveal>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

/* ----------- Utility Hooks & Components ----------- */

/**
 * ScrollReveal Wrapper Component
 */
function ScrollReveal({ children, className = "", as: Component = "div", delay = 0 }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -50px 0px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Component
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transform transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </Component>
  );
}

function FilterSection({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

// React.memo speeds up re-renders when tweaking filters
const FilterPill = memo(function FilterPill({ active, onClick, children }) {
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
});

// React.memo drastically improves frontend speed when interacting with inputs
const ProductCard = memo(function ProductCard({ product }) {
  const to = `/product/${product.slug}`;
  const discount =
    product.maxPrice && product.minPrice && product.maxPrice > product.minPrice
      ? Math.round(((product.maxPrice - product.minPrice) / product.maxPrice) * 100)
      : product.discountPercentage || 0;

  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const wishlistItems = useWishlistStore((s) => s.items);
  const inWishlist = wishlistItems.some((w) => w.productId === product._id);

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({
      productId: product._id,
      slug: product.slug,
      name: product.name,
      image: product.image || null,
      price: product.minPrice || 0,
      brandName: product.brand?.name,
    });
  };

  return (
    <div className="group flex flex-col relative w-full h-full">
      <div className="relative aspect-[6/4] sm:aspect-[3/4] sm:rounded-[1.75rem] bg-white border border-gray-100 p-2 shadow-sm transition-all duration-500 group-hover:shadow-xl group-hover:-translate-y-1 overflow-hidden">
        <div className="w-full h-full bg-[#F7F3F0] rounded-md sm:rounded-[1.25rem] overflow-hidden relative">
          <Link to={to} className="block w-full h-full">
            {product.image ? (
              <img
                src={resolveImageUrl(product.image)}
                alt={product.name}
                width="300"
                height="300"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <FiPackage size={36} />
              </div>
            )}
          </Link>

          {discount > 0 && (
            <div className="absolute top-3 left-3 bg-[#007074] text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-md z-10">
              -{discount}%
            </div>
          )}
          {product.totalStock === 0 && (
            <div className="absolute top-3 left-3 bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-md z-10">
              Sold out
            </div>
          )}

          <button
            type="button"
            onClick={handleWishlist}
            className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/90 backdrop-blur-md shadow-sm transition-all hover:scale-110"
          >
            <FiHeart size={16} className={inWishlist ? 'fill-red-500 text-red-500' : 'text-gray-500'} />
          </button>

          <div className="absolute bottom-3 left-3 right-3 translate-y-12 group-hover:translate-y-0 transition-all duration-500 z-20">
            <Link
              to={to}
              className="w-full bg-[#222]/95 backdrop-blur-md text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2 hover:bg-[#007074] shadow-xl"
            >
              <FiShoppingCart size={14} /> Quick View
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-4 px-1 text-center">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1 block">
          {product.brand?.name || '—'}
        </span>
        <Link to={to}>
          <h3 className="text-[13px] sm:text-[14px] font-bold text-[#222] hover:text-[#007074] transition-colors leading-tight line-clamp-1 mb-2">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-[14px] font-black text-[#007074]">{formatPKR(product.minPrice)}</span>
          {product.maxPrice && product.maxPrice !== product.minPrice && (
            <span className="text-[11px] text-gray-300 line-through font-bold">
              {formatPKR(product.maxPrice)}
            </span>
          )}
        </div>
        {product.averageRating > 0 && (
          <div className="flex justify-center items-center gap-0.5 mt-2.5">
            {[...Array(5)].map((_, i) => (
              <FaStar
                key={i}
                className={`w-2.5 h-2.5 ${i < Math.round(product.averageRating) ? 'text-yellow-400' : 'text-gray-200'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

function FancyDropdown({ value, onChange, options, placeholder, searchable = false }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const filtered = useMemo(() => {
    if (!searchable || !search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search, searchable]);

  const selectedLabel = options.find((o) => o.value === value)?.label || '';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm text-left flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-[#007074]/20 focus:border-[#007074] transition-colors"
      >
        <span className={selectedLabel ? 'text-slate-900 truncate' : 'text-slate-400'}>
          {selectedLabel || placeholder}
        </span>
        <FiChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-slate-100 bg-slate-50">
              <div className="relative">
                <FiSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-full pl-8 pr-2 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007074]/20"
                />
              </div>
            </div>
          )}
          <ul className="max-h-60 overflow-y-auto py-1">
            <li>
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${!value ? 'text-[#007074] font-medium' : 'text-slate-700'}`}
              >
                {placeholder}
              </button>
            </li>
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-xs text-slate-400">No matches.</li>
            )}
            {filtered.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false); setSearch(''); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between ${
                    o.value === value ? 'text-[#007074] font-medium' : 'text-slate-700'
                  }`}
                >
                  <span className="truncate">{o.label}</span>
                  {o.value === value && <FiCheck size={14} />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
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