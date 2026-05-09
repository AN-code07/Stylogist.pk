import React from 'react';
import { Link } from 'react-router-dom';
import { FiChevronRight, FiAward } from 'react-icons/fi';
import { useBrands } from '../features/brands/useBrandHooks';
import Seo from '../components/common/Seo';

// All-brands index. Each card links to /brand/:slug so search engines see a
// flat, crawlable tree of brand landing pages.
export default function AllBrandsPage() {
  const { data: brands = [], isLoading } = useBrands({ active: 'true' });
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="bg-[#FDFDFD] min-h-screen">
      <Seo
        title="All Brands — Stylogist"
        description="Discover every brand available on HarbalMart.pk. Authentic products with free shipping and cash on delivery."
        canonical={`${origin}/brands`}
      />

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-14">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold mb-6">
          <Link to="/" className="hover:text-[#007074]">Home</Link>
          <FiChevronRight size={11} />
          <span className="text-[#222]">Brands</span>
        </nav>

        <header className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-block bg-[#007074]/10 text-[#007074] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.25em] mb-3">
            Shop by brand
          </span>
          <h1 className="font-serif text-3xl md:text-5xl font-black text-[#222] tracking-tight">
            All <span className="italic text-[#007074]">brands</span>
          </h1>
          <p className="text-gray-500 mt-3">
            Hand-picked, authentic brands. Click any to view their full catalogue.
          </p>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : brands.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-14 text-center">
            <FiAward size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No brands yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {brands.map((b) => (
              <Link
                key={b._id}
                to={`/brand/${b.slug}`}
                className="group bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 bg-[#F7F3F0] rounded-2xl flex items-center justify-center mb-3 overflow-hidden">
                  {b.logo ? (
                    <img src={b.logo} alt={b.name} loading="lazy" decoding="async" className="w-full h-full object-contain p-2" />
                  ) : (
                    <FiAward size={28} className="text-gray-300" />
                  )}
                </div>
                <span className="font-serif text-base font-black text-[#222] group-hover:text-[#007074] transition-colors leading-tight">
                  {b.name}
                </span>
                {b.description && (
                  <span className="text-xs text-gray-500 mt-1 line-clamp-2">{b.description}</span>
                )}
                <span className="mt-3 text-[10px] font-black uppercase tracking-[0.25em] text-[#007074] inline-flex items-center gap-1">
                  Shop now <FiChevronRight size={11} />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
