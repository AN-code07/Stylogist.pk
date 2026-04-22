import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiZap } from 'react-icons/fi';

export default function AboutHeader() {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const customStyles = `
    @keyframes slowZoom {
      0% { transform: scale(1); }
      100% { transform: scale(1.1); }
    }
  `;

  // Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="relative w-full min-h-[520px] md:min-h-[600px] lg:min-h-[70vh] flex items-center justify-center overflow-hidden bg-[#111] py-20 md:py-28"
    >
      {/* LCP PRELOAD */}
      <link
        rel="preload"
        as="image"
        href="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070&auto=format&fit=crop"
      />

      <style>{customStyles}</style>

      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070&auto=format&fit=crop"
          alt="About Stylogist"
          loading="eager"
          fetchPriority="high"
          className="w-full h-full object-cover animate-[slowZoom_20s_linear_infinite_alternate]"
        />

        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#007074]/40 via-black/20 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
      </div>

      {/* CONTENT */}
      <div
        className={`relative z-10 max-w-4xl mx-auto px-6 sm:px-8 lg:px-10 text-center flex flex-col items-center transition-all duration-1000 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* Tagline */}
        <div
          className={`flex items-center gap-2 py-2 px-5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[9px] sm:text-[10px] font-black tracking-[0.3em] uppercase mb-6 transition-all duration-700 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <FiZap className="text-[#007074] animate-pulse" />
          The Stylogist Vision
        </div>

        {/* Heading */}
        <h1
          className={`text-4xl sm:text-5xl md:text-6xl font-serif font-black text-white leading-[1] tracking-tight mb-6 drop-shadow-2xl transition-all duration-700 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          Redefining <br />
          <span className="italic text-[#007074]">Modern Rituals</span>
        </h1>

        {/* Divider */}
        <div
          className={`w-16 sm:w-20 h-[1px] bg-gradient-to-r from-transparent via-[#007074] to-transparent mb-6 transition-all duration-700 delay-400 ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          }`}
        />

        {/* Description */}
        <p
          className={`text-sm sm:text-base md:text-lg text-gray-300 leading-relaxed max-w-2xl font-medium uppercase tracking-widest drop-shadow-md mb-10 transition-all duration-700 delay-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          At Stylogist.pk, we blend{' '}
          <span className="text-white font-black">Neural Style Intelligence</span>{' '}
          with artisan-grade fashion to curate a shopping experience as unique as your own DNA.
        </p>

        {/* Buttons */}
        <div
          className={`flex flex-col sm:flex-row items-center gap-4 sm:gap-6 transition-all duration-700 delay-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <Link
            to="/category"
            className="group bg-white text-[#111] px-8 py-3 rounded-full font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#007074] hover:text-white transition-all duration-500 shadow-xl active:scale-95 flex items-center gap-2"
          >
            Explore Collection
            <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            to="/contact"
            className="bg-white/5 backdrop-blur-lg border border-white/20 text-white px-8 py-3 rounded-full font-black text-[11px] uppercase tracking-[0.2em] hover:bg-white hover:text-[#111] transition-all duration-500 shadow-lg"
          >
            Partner With Us
          </Link>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex-col items-center gap-2 opacity-40">
        <div className="w-[1px] h-10 bg-gradient-to-b from-[#007074] to-transparent" />
        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white rotate-90 translate-y-6">
          Scroll
        </span>
      </div>
    </section>
  );
}