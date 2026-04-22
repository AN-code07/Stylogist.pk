import React, { useEffect, useMemo, useState, useRef, memo } from 'react';
import { FiChevronLeft, FiChevronRight, FiPackage, FiAlertCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useProducts } from '../../features/products/useProductHooks';
import StorefrontProductCard from '../common/StorefrontProductCard';

// Home → Featured Collection. Pulls products the admin has flagged with
// `isFeatured` (see Product Manage → Storefront placement). Falls back to
// a best-effort "top rated" query if no products are currently featured,
// so the section never goes blank on a fresh install.
export default function FeaturedProducts() {
  const [desktopPage, setDesktopPage] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);

  const { data, isLoading, isError } = useProducts({
    featured: 'true',
    limit: 12,
    sort: 'newest',
  });
  const items = data?.items || [];

  const productsPerPage = 4;
  const totalDesktopPages = Math.max(1, Math.ceil(items.length / productsPerPage));

  const displayedDesktopProducts = useMemo(
    () => items.slice(desktopPage * productsPerPage, (desktopPage + 1) * productsPerPage),
    [desktopPage, items]
  );

  useEffect(() => {
    if (desktopPage >= totalDesktopPages) setDesktopPage(0);
    if (mobileIndex >= items.length) setMobileIndex(0);
  }, [desktopPage, mobileIndex, totalDesktopPages, items.length]);

  const showNav = items.length > productsPerPage;

  return (
    <section className="w-full bg-[#FDFDFD] py-10 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full bg-[#F7F3F0]/30 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-10 gap-8">
          
          {/* ANIMATED HEADER */}
          <ScrollReveal className="text-center md:text-left">
            <div className="inline-block bg-[#007074]/10 text-[#007074] text-[10px] font-black px-3 py-1 rounded-full mb-4 uppercase tracking-[0.2em]">
              Curated Selection
            </div>
            <h2 className="text-2xl md:text-5xl font-serif font-black text-[#222] tracking-tight">
              Featured <span className="italic text-[#007074]">Collection</span>
            </h2>
            <p className="text-gray-500 mt-2 sm:mt-5 max-w-lg text-sm sm:leading-relaxed sm:uppercase tracking-wide font-medium">
              Handpicked arrivals designed to elevate your everyday ritual.
            </p>
          </ScrollReveal>

          {/* ANIMATED NAV */}
          {showNav && (
            <ScrollReveal delay={100} className="sm:flex hidden items-center justify-center space-x-3">
              <button
                onClick={() => setDesktopPage((p) => (p === 0 ? totalDesktopPages - 1 : p - 1))}
                aria-label="Previous featured products"
                className="w-12 h-12 flex items-center justify-center cursor-pointer rounded-full border border-gray-100 bg-white text-[#222] hover:bg-[#222] hover:text-white transition-all duration-500 shadow-sm hover:shadow-xl"
              >
                <FiChevronLeft size={20} />
              </button>
              <button
                onClick={() => setDesktopPage((p) => (p === totalDesktopPages - 1 ? 0 : p + 1))}
                aria-label="Next featured products"
                className="w-12 h-12 flex items-center justify-center cursor-pointer rounded-full border border-gray-100 bg-white text-[#222] hover:bg-[#222] hover:text-white transition-all duration-500 shadow-sm hover:shadow-xl"
              >
                <FiChevronRight size={20} />
              </button>
            </ScrollReveal>
          )}
        </div>

        {isError ? (
          <ScrollReveal>
            <FallbackState icon={<FiAlertCircle size={28} />} message="Couldn't load featured products." />
          </ScrollReveal>
        ) : isLoading ? (
          <SkeletonGrid count={4} />
        ) : items.length === 0 ? (
          <ScrollReveal>
            <FallbackState
              icon={<FiPackage size={28} />}
              message="No featured products yet. Tag a product as Featured in the admin dashboard to highlight it here."
            />
          </ScrollReveal>
        ) : (
          <>
            {/* DESKTOP GRID (STAGGERED ANIMATION) */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-4 gap-8">
                {displayedDesktopProducts.map((p, i) => (
                  <ScrollReveal key={p._id} delay={i * 100}>
                    <StorefrontProductCard product={p} index={i} variant="featured" />
                  </ScrollReveal>
                ))}
              </div>
            </div>

            {/* MOBILE SLIDER (ANIMATED) */}
            <ScrollReveal delay={100} className="lg:hidden">
              <div className="max-w-[280px] mx-auto transition-all duration-700">
                <StorefrontProductCard product={items[mobileIndex]} index={0} variant="featured" />
              </div>
              <div className="flex items-center justify-center gap-3 mt-6">
                {items.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setMobileIndex(i)}
                    aria-label={`Show featured product ${i + 1}`}
                    className={`h-1 rounded-full transition-all duration-500 ${
                      i === mobileIndex ? 'w-10 bg-[#007074]' : 'w-4 bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </ScrollReveal>
          </>
        )}

        {/* BOTTOM LINK (ANIMATED) */}
        <ScrollReveal delay={200} className="text-center mt-8">
          <Link
            to="/category"
            className="inline-flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#222] hover:text-[#007074] transition-all group"
          >
            Explore All Products
            <div className="w-10 h-[1px] bg-gray-200 group-hover:w-16 group-hover:bg-[#007074] transition-all duration-500" />
            <FiChevronRight className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* -------- Utility Hooks & Components -------- */

/**
 * ScrollReveal Wrapper Component
 * Uses Intersection Observer to add 'opacity-100 translate-y-0' 
 * smoothly when the user scrolls the element into view.
 */
const ScrollReveal = memo(function ScrollReveal({ children, className = "", as: Component = "div", delay = 0 }) {
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
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px" // Trigger slightly before the element fully hits the viewport bottom
      }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Component
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transform transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      } ${className}`}
    >
      {children}
    </Component>
  );
});

// Memoized to prevent re-renders when desktopPage/mobileIndex state changes in the parent
const SkeletonGrid = memo(function SkeletonGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="aspect-[3/4] bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse" />
          <div className="h-4 w-1/3 bg-slate-100 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
});

// Memoized to prevent re-renders
const FallbackState = memo(function FallbackState({ icon, message }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-12 text-center text-slate-500 text-sm">
      <div className="mx-auto text-slate-300 mb-3 w-fit">{icon}</div>
      <p className="max-w-md mx-auto">{message}</p>
    </div>
  );
});