import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FiAlertCircle, FiCheck, FiChevronDown, FiArrowRight, FiPackage,
  FiBookOpen, FiShield, FiAward, FiHeart
} from 'react-icons/fi';
import {
  useIngredient,
  useIngredientProducts,
} from '../features/ingredients/useIngredientHooks';
import StorefrontProductCard from '../components/common/StorefrontProductCard';
import Seo from '../components/common/Seo';

// We render a *preview* of products on the SEO landing page (capped low so
// the page stays fast + scannable) and push users to the filtered listing for
// the full set. That listing is the canonical conversion surface.
const PREVIEW_LIMIT = 8;

export default function IngredientPage() {
  const { slug } = useParams();
  const [openFaq, setOpenFaq] = useState(0);

  const { data: ingredient, isLoading, isError } = useIngredient(slug);
  const { data: productData, isFetching } = useIngredientProducts(slug, {
    limit: PREVIEW_LIMIT,
    sort: 'bestSelling',
  });

  const items = productData?.items ?? [];
  const totalProducts = productData?.pagination?.total ?? 0;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const canonical = `${origin}/ingredient/${slug}`;
  // The crawlable filtered listing the CTA + "Explore More" links point to.
  // Uses CategoryPage's existing `?ingredients=` query param so search engines
  // can index the filtered URL without a duplicate route.
  const filteredListingHref = `/category?ingredients=${encodeURIComponent(slug)}`;

  const seoTitle = ingredient?.metaTitle?.trim() || (ingredient ? `${ingredient.name} — Skincare Products & Benefits | Stylogist` : '');
  const seoDescription = ingredient?.metaDescription?.trim() ||
    (ingredient?.description ? stripHtml(ingredient.description).slice(0, 160) : '');

  // FAQPage JSON-LD — Google rich-result eligible. We only emit when the
  // ingredient has at least one FAQ entry, otherwise the schema is invalid.
  const faqJsonLd = useMemo(() => {
    if (!ingredient?.faq?.length) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: ingredient.faq.map((q) => ({
        '@type': 'Question',
        name: q.question,
        acceptedAnswer: { '@type': 'Answer', text: q.answer },
      })),
    };
  }, [ingredient]);

  // ItemList JSON-LD for the curated grid. Uses absolute URLs so Google
  // can resolve each entry without inferring the origin.
  const itemListJsonLd = useMemo(() => {
    if (!ingredient || !items.length) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Products with ${ingredient.name}`,
      numberOfItems: items.length,
      itemListElement: items.map((p, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${origin}/product/${p.slug}`,
        name: p.name,
      })),
    };
  }, [ingredient, items, origin]);

  if (isLoading) return <SkeletonHero />;
  if (isError || !ingredient) return <NotFound slug={slug} />;

  return (
    <div className="bg-[#FDFDFD] min-h-screen">
      <Seo
        title={seoTitle}
        description={seoDescription}
        type="article"
        image={ingredient.image || undefined}
        canonical={canonical}
        jsonLd={faqJsonLd}
        jsonLdId={`ingredient-faq-${ingredient._id}`}
      />
      {itemListJsonLd && (
        <Seo
          jsonLd={itemListJsonLd}
          jsonLdId={`ingredient-itemlist-${ingredient._id}`}
        />
      )}
      {ingredient.isIndexable === false && <NoIndexHint />}

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-b from-[#F7F3F0] via-[#FDFDFD] to-[#FDFDFD] border-b border-gray-100">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-24 w-96 h-96 bg-[#007074]/8 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 left-12 w-72 h-72 bg-[#007074]/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-16 relative">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold mb-6"
          >
            <Link to="/" className="hover:text-[#007074]">Home</Link>
            <span>/</span>
            <Link to="/category" className="hover:text-[#007074]">Ingredients</Link>
            <span>/</span>
            <span className="text-[#222]">{ingredient.name}</span>
          </nav>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
            {/* Hero image */}
            <div className="md:col-span-5 order-2 md:order-1">
              <div className="aspect-square bg-white border border-gray-100 rounded-[2rem] p-3 shadow-sm relative overflow-hidden">
                <div className="w-full h-full bg-[#F7F3F0] rounded-[1.5rem] overflow-hidden flex items-center justify-center">
                  {ingredient.image ? (
                    <img
                      src={ingredient.image}
                      alt={ingredient.name}
                      width="600"
                      height="600"
                      loading="eager"
                      decoding="async"
                      fetchpriority="high"
                      className="w-full h-full object-contain p-6"
                    />
                  ) : (
                    <div className="text-center">
                      <FiBookOpen size={56} className="mx-auto text-[#007074]/40" />
                      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
                        Ingredient
                      </p>
                    </div>
                  )}
                </div>

                {ingredient.isIndexable !== false && (
                  <span className="absolute top-5 left-5 bg-[#007074] text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-[0.2em] shadow-md inline-flex items-center gap-1">
                    <FiAward size={10} /> Verified
                  </span>
                )}
              </div>
            </div>

            {/* Hero copy */}
            <div className="md:col-span-7 order-1 md:order-2">
              <span className="inline-block bg-[#007074]/10 text-[#007074] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.25em] mb-4">
                Ingredient Spotlight
              </span>
              <h1 className="font-serif text-3xl md:text-5xl font-black text-[#222] tracking-tight leading-[1.05]">
                {ingredient.name}
              </h1>

              {ingredient.description && (
                <p className="mt-5 text-gray-600 leading-relaxed text-[15px] max-w-2xl">
                  {stripHtml(ingredient.description).slice(0, 240)}
                  {stripHtml(ingredient.description).length > 240 && '…'}
                </p>
              )}

              {/* Stat strip */}
              <div className="mt-7 grid grid-cols-3 gap-3 max-w-xl">
                <Stat number={totalProducts} label="Products" />
                <Stat number={ingredient.benefits?.length || 0} label="Benefits" />
                <Stat number={ingredient.uses?.length || 0} label="Uses" />
              </div>

              {/* Hero CTA pair */}
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to={filteredListingHref}
                  className="inline-flex items-center gap-2 bg-[#222] text-white px-6 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#007074] transition-colors shadow-sm hover:shadow-lg"
                >
                  Shop {ingredient.name}
                  <FiArrowRight size={14} />
                </Link>
                <a
                  href="#benefits"
                  className="inline-flex items-center gap-2 bg-white border border-gray-200 px-6 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] text-[#222] hover:border-[#222] transition-colors"
                >
                  Learn benefits
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16 space-y-16">
        {/* ── BENEFITS + USES ─────────────────────────────────── */}
        {(ingredient.benefits?.length > 0 || ingredient.uses?.length > 0) && (
          <section id="benefits" className="scroll-mt-24">
            <header className="mb-7 text-center max-w-2xl mx-auto">
              <span className="inline-block bg-[#F7F3F0] text-[#007074] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.25em] mb-3">
                Why it matters
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-black text-[#222] tracking-tight">
                What {ingredient.name} <span className="italic text-[#007074]">does for you</span>
              </h2>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {ingredient.benefits?.length > 0 && (
                <article className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="w-10 h-10 rounded-xl bg-[#007074]/10 text-[#007074] flex items-center justify-center">
                      <FiHeart size={18} />
                    </span>
                    <h3 className="font-serif text-xl font-black text-[#222] tracking-tight">Benefits</h3>
                  </div>
                  <ul className="space-y-3">
                    {ingredient.benefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-700 leading-relaxed">
                        <span className="mt-0.5 w-5 h-5 rounded-full bg-[#007074]/10 text-[#007074] flex items-center justify-center flex-shrink-0">
                          <FiCheck size={11} strokeWidth={3} />
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              )}
              {ingredient.uses?.length > 0 && (
                <article className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="w-10 h-10 rounded-xl bg-[#007074]/10 text-[#007074] flex items-center justify-center">
                      <FiBookOpen size={18} />
                    </span>
                    <h3 className="font-serif text-xl font-black text-[#222] tracking-tight">How to use</h3>
                  </div>
                  <ol className="space-y-3">
                    {ingredient.uses.map((u, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-700 leading-relaxed">
                        <span className="mt-0.5 w-5 h-5 rounded-full bg-[#222] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <span>{u}</span>
                      </li>
                    ))}
                  </ol>
                </article>
              )}
            </div>
          </section>
        )}

        {/* ── RELATED PRODUCTS PREVIEW + CTA ──────────────────── */}
        <section>
          <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-7">
            <div>
              <span className="inline-block bg-[#F7F3F0] text-[#007074] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.25em] mb-3">
                Curated for you
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-black text-[#222] tracking-tight">
                Products with <span className="italic text-[#007074]">{ingredient.name}</span>
              </h2>
              {totalProducts > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  {totalProducts} {totalProducts === 1 ? 'product' : 'products'} available · best-sellers shown first
                </p>
              )}
            </div>
            {totalProducts > items.length && (
              <Link
                to={filteredListingHref}
                className="hidden md:inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#222] hover:text-[#007074] transition-colors group"
              >
                View all {totalProducts}
                <span className="w-8 h-px bg-gray-300 group-hover:w-12 group-hover:bg-[#007074] transition-all" />
                <FiArrowRight size={14} />
              </Link>
            )}
          </header>

          {items.length === 0 && !isFetching ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-14 text-center">
              <FiPackage size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">
                No products tagged with {ingredient.name} yet. Check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {items.map((p, idx) => (
                <StorefrontProductCard key={p._id} product={p} index={idx} />
              ))}
            </div>
          )}

          {/* Primary CTA — single canonical destination for "show me everything" */}
          {items.length > 0 && (
            <div className="mt-10 flex justify-center">
              <Link
                to={filteredListingHref}
                className="group inline-flex items-center gap-3 bg-[#222] text-white px-8 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.25em] hover:bg-[#007074] transition-colors shadow-sm hover:shadow-xl"
              >
                View all products
                {totalProducts > 0 && (
                  <span className="bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px]">
                    {totalProducts}
                  </span>
                )}
                <FiArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}
        </section>

        {/* ── LONG SEO DESCRIPTION ─────────────────────────────── */}
        {ingredient.description && (
          <section className="bg-white border border-gray-100 rounded-2xl p-6 md:p-10 shadow-sm">
            <header className="mb-6 pb-5 border-b border-gray-100">
              <span className="inline-block bg-[#F7F3F0] text-[#007074] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.25em] mb-3">
                Deep dive
              </span>
              <h2 className="font-serif text-2xl md:text-3xl font-black text-[#222] tracking-tight">
                Everything you need to know about {ingredient.name}
              </h2>
            </header>
            <div
              className="product-rich tiptap max-w-3xl"
              dangerouslySetInnerHTML={{ __html: ingredient.description }}
            />
          </section>
        )}

        {/* ── FAQ ──────────────────────────────────────────────── */}
        {ingredient.faq?.length > 0 && (
          <section>
            <header className="mb-7 text-center max-w-2xl mx-auto">
              <span className="inline-block bg-[#F7F3F0] text-[#007074] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.25em] mb-3">
                Got questions?
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-black text-[#222] tracking-tight">
                Frequently asked <span className="italic text-[#007074]">questions</span>
              </h2>
            </header>
            <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-100 shadow-sm overflow-hidden">
              {ingredient.faq.map((q, idx) => {
                const open = openFaq === idx;
                return (
                  <div key={idx}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? -1 : idx)}
                      className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-[#F7F3F0]/50 transition-colors"
                      aria-expanded={open}
                    >
                      <span className="text-sm font-bold text-[#222] leading-snug pr-4">{q.question}</span>
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          open ? 'bg-[#007074] text-white rotate-180' : 'bg-[#F7F3F0] text-[#007074]'
                        }`}
                      >
                        <FiChevronDown size={14} />
                      </span>
                    </button>
                    {open && (
                      <div className="px-6 pb-6 text-sm text-gray-600 leading-relaxed">
                        {q.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── FINAL CTA BAND ───────────────────────────────────── */}
        {totalProducts > 0 && (
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#007074] to-[#0a8c91] text-white p-8 md:p-12 shadow-lg">
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-12 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-8">
                <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.25em] mb-4">
                  <FiShield size={11} /> Quality verified
                </span>
                <h2 className="font-serif text-3xl md:text-4xl font-black tracking-tight leading-tight">
                  Discover {totalProducts} {totalProducts === 1 ? 'product' : 'products'} powered by {ingredient.name}
                </h2>
                <p className="text-white/85 mt-3 leading-relaxed">
                  Free shipping nationwide · Cash on delivery · 7-day returns. Find your perfect match today.
                </p>
              </div>
              <div className="md:col-span-4 flex md:justify-end">
                <Link
                  to={filteredListingHref}
                  className="inline-flex items-center gap-2 bg-white text-[#007074] px-7 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.25em] hover:bg-[#222] hover:text-white transition-colors shadow-lg"
                >
                  Shop now <FiArrowRight size={14} />
                </Link>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* ── helpers + subcomponents ────────────────────────────────── */

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function Stat({ number, label }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-xl px-3 py-3 text-center">
      <div className="text-xl md:text-2xl font-black text-[#007074] tabular-nums leading-none">
        {Number(number).toLocaleString()}
      </div>
      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mt-1.5">
        {label}
      </div>
    </div>
  );
}

function SkeletonHero() {
  return (
    <div className="bg-[#FDFDFD] min-h-screen">
      <div className="bg-[#F7F3F0]/40 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <div className="aspect-square bg-white border border-gray-100 rounded-[2rem] p-3">
              <div className="w-full h-full bg-[#F7F3F0] rounded-[1.5rem] animate-pulse" />
            </div>
          </div>
          <div className="md:col-span-7 space-y-4">
            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
            <div className="h-10 w-3/4 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
            <div className="h-12 w-44 bg-gray-100 rounded-xl animate-pulse mt-4" />
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-gray-100 rounded-[1.75rem] animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

function NotFound({ slug }) {
  return (
    <div className="bg-[#FDFDFD] min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <FiAlertCircle className="mx-auto text-[#007074] mb-3" size={32} />
        <h1 className="font-serif text-2xl font-black text-[#222]">Ingredient not found</h1>
        <p className="text-sm text-gray-500 mt-2">
          We couldn't find an ingredient called <code className="text-[#222]">{slug}</code>.
        </p>
        <Link
          to="/category"
          className="inline-flex items-center gap-2 mt-6 px-5 py-3 bg-[#222] text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#007074] transition-colors"
        >
          Back to shop <FiArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

function NoIndexHint() {
  // Inject `<meta name="robots" content="noindex, follow">` while this page
  // is mounted. Cleaned up on unmount so navigating away doesn't carry the
  // noindex over to other pages.
  React.useEffect(() => {
    const tag = document.createElement('meta');
    tag.setAttribute('name', 'robots');
    tag.setAttribute('content', 'noindex, follow');
    tag.setAttribute('data-ingredient-noindex', '1');
    document.head.appendChild(tag);
    return () => {
      document.head.querySelectorAll('meta[data-ingredient-noindex="1"]').forEach((n) => n.remove());
    };
  }, []);
  return null;
}
