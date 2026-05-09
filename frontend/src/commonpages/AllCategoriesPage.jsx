import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronRight, FiPackage } from 'react-icons/fi';
import { useCategories } from '../features/categories/useCategoryHooks';
import Seo from '../components/common/Seo';

// All-categories index page. Pure SEO landing — every card links to the
// canonical category route `/category/:slug` so search engines have a clean
// crawl tree from "/categories" → individual category pages.
export default function AllCategoriesPage() {
  const { data: categories = [], isLoading } = useCategories({ active: 'true' });

  const topLevel = useMemo(() => categories.filter((c) => c.level === 0), [categories]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="bg-[#FDFDFD] min-h-screen">
      <Seo
        title="All Categories — Stylogist"
        description="Browse every category available on HarbalMart.pk. Free shipping nationwide and cash on delivery on every order."
        canonical={`${origin}/categories`}
      />

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-14">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold mb-6">
          <Link to="/" className="hover:text-[#007074]">Home</Link>
          <FiChevronRight size={11} />
          <span className="text-[#222]">Categories</span>
        </nav>

        <header className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-block bg-[#007074]/10 text-[#007074] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.25em] mb-3">
            Shop by category
          </span>
          <h1 className="font-serif text-3xl md:text-5xl font-black text-[#222] tracking-tight">
            All <span className="italic text-[#007074]">categories</span>
          </h1>
          <p className="text-gray-500 mt-3">
            Pick a category to explore curated products with free shipping and cash on delivery.
          </p>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : topLevel.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-14 text-center">
            <FiPackage size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No categories yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {topLevel.map((c) => (
              <Link
                key={c._id}
                to={`/category/${c.slug}`}
                className="group bg-white border border-gray-100 rounded-2xl p-3 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="aspect-[4/3] bg-[#F7F3F0] rounded-xl overflow-hidden flex items-center justify-center">
                  {c.image ? (
                    <img
                      src={c.image}
                      alt={c.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <FiPackage size={36} className="text-gray-300" />
                  )}
                </div>
                <div className="px-2 pt-3 pb-2 flex items-center justify-between">
                  <span className="font-serif text-base font-black text-[#222] group-hover:text-[#007074] transition-colors">
                    {c.name}
                  </span>
                  <FiChevronRight size={14} className="text-gray-400 group-hover:text-[#007074] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
