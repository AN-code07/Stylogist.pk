import React from 'react';
import { Link } from 'react-router-dom';
import { FiChevronRight, FiBookOpen, FiArrowRight } from 'react-icons/fi';
import { useIngredients } from '../features/ingredients/useIngredientHooks';
import Seo from '../components/common/Seo';

// All-ingredients index. Each row exposes a "View Details" CTA per spec
// that routes to the ingredient SEO page (/ingredient/:slug). The page
// itself in turn drives users to the filtered product listing.
export default function AllIngredientsPage() {
  const { data, isLoading } = useIngredients({ active: 'true', includeCount: 'true', limit: 200 });
  const ingredients = data?.items ?? [];
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="bg-[#FDFDFD] min-h-screen">
      <Seo
        title="All Ingredients — Stylogist"
        description="Explore every ingredient we feature. Learn the benefits, see products formulated with each, and shop with free delivery."
        canonical={`${origin}/ingredients`}
      />

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-14">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold mb-6">
          <Link to="/" className="hover:text-[#007074]">Home</Link>
          <FiChevronRight size={11} />
          <span className="text-[#222]">Ingredients</span>
        </nav>

        <header className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-block bg-[#007074]/10 text-[#007074] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.25em] mb-3">
            Powered by ingredients
          </span>
          <h1 className="font-serif text-3xl md:text-5xl font-black text-[#222] tracking-tight">
            All <span className="italic text-[#007074]">ingredients</span>
          </h1>
          <p className="text-gray-500 mt-3">
            Click any ingredient to learn what it does and shop the products formulated with it.
          </p>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : ingredients.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-14 text-center">
            <FiBookOpen size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No ingredients yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ingredients.map((i) => (
              <article
                key={i._id}
                className="group bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all flex gap-4"
              >
                <div className="w-20 h-20 shrink-0 bg-[#F7F3F0] rounded-xl flex items-center justify-center overflow-hidden">
                  {i.image ? (
                    <img src={i.image} alt={i.name} loading="lazy" decoding="async" className="w-full h-full object-contain p-2" />
                  ) : (
                    <FiBookOpen size={24} className="text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <h2 className="font-serif text-lg font-black text-[#222] tracking-tight line-clamp-1">{i.name}</h2>
                  {i.metaDescription && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{i.metaDescription}</p>
                  )}
                  <div className="mt-auto pt-3 flex items-center justify-between gap-3">
                    {typeof i.productCount === 'number' && (
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                        {i.productCount} {i.productCount === 1 ? 'product' : 'products'}
                      </span>
                    )}
                    <Link
                      to={`/ingredient/${i.slug}`}
                      className="inline-flex items-center gap-1.5 bg-[#222] text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#007074] transition-colors"
                    >
                      View details
                      <FiArrowRight size={11} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
