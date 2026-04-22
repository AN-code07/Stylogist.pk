import React, { useState, useEffect, useRef, memo } from 'react';
import { FiTrendingUp, FiArrowRight, FiPackage, FiAlertCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useProducts } from '../../features/products/useProductHooks';
import StorefrontProductCard from '../common/StorefrontProductCard';

// Trending row — reused on Home and /deals. Products surface here when an
// admin checks "Trending" in Product Manage. We pull 8 so the grid can
// stay populated across breakpoints (2 → 4 cols).
export default function TrendingProducts() {
  const { data, isLoading, isError } = useProducts({
    trending: 'true',
    limit: 8,
    sort: 'bestSelling',
  });
  const items = data?.items || [];

  return (
    <section className="w-full bg-[#FDFDFD] py-10 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[40%] h-full bg-[#007074]/5 blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 lg:mb-16 gap-8">
          
          {/* ANIMATED HEADER TEXT */}
          <ScrollReveal className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-[#007074]/10 text-[#007074] text-[10px] font-black tracking-[0.2em] uppercase mb-4">
              <FiTrendingUp className="animate-pulse" /> Most Wanted Now
            </div>
            <h2 className="text-2xl lg:text-5xl font-serif font-black text-[#222] tracking-tight">
              Trending <span className="italic text-[#007074]">Right Now</span>
            </h2>
            <p className="text-gray-400 mt-5 max-w-lg text-sm lg:leading-relaxed lg:uppercase tracking-wide font-medium">
              Join the movement with our most-coveted essentials, styled by you.
            </p>
          </ScrollReveal>

          {/* ANIMATED LINK */}
          <ScrollReveal delay={100} className="lg:mt-6 md:mt-0 flex justify-center">
            <Link
              to="/category"
              className="inline-flex items-center gap-3 text-[9px] lg:text-[11px] font-black uppercase tracking-[0.3em] text-[#222] hover:text-[#007074] transition-all group pb-1 border-b border-gray-100"
            >
              Explore Trending
              <FiArrowRight className="group-hover:translate-x-2 transition-transform" />
            </Link>
          </ScrollReveal>
        </div>

        {isError ? (
          <ScrollReveal>
            <FallbackState icon={<FiAlertCircle size={28} />} message="Couldn't load trending products." />
          </ScrollReveal>
        ) : isLoading ? (
          <SkeletonGrid count={4} />
        ) : items.length === 0 ? (
          <ScrollReveal>
            <FallbackState
              icon={<FiPackage size={28} />}
              message="No trending products yet. Tag a product as Trending in the admin dashboard to surface it here."
            />
          </ScrollReveal>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 lg:gap-10">
            {items.slice(0, 4).map((p, i) => (
              /* ANIMATED STAGGERED CARDS */
              <ScrollReveal key={p._id} delay={i * 100} className="h-full">
                <StorefrontProductCard product={p} index={i} variant="trending" />
              </ScrollReveal>
            ))}
          </div>
        )}

        {/* ANIMATED DIVIDER */}
        <ScrollReveal delay={200} className="mt-20 w-full flex justify-center">
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-[#007074]/30 to-transparent" />
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

// Wrapped in memo to prevent unnecessary re-renders
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

// Wrapped in memo to prevent unnecessary re-renders
const FallbackState = memo(function FallbackState({ icon, message }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-12 text-center text-slate-500 text-sm">
      <div className="mx-auto text-slate-300 mb-3 w-fit">{icon}</div>
      <p className="max-w-md mx-auto">{message}</p>
    </div>
  );
});