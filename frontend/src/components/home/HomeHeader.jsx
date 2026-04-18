import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiZap } from 'react-icons/fi';

export default function HomeHeader() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop',
      brand: 'New Editorial',
      title: 'Signature Style',
      description: 'Elevate your wardrobe with our latest pieces. Meticulously crafted for the modern individual who values cutting-edge aesthetics.',
      primaryCta: 'Shop New Arrivals',
      primaryLink: '/category',
      secondaryCta: 'View Lookbook',
      secondaryLink: '/lookbook'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=2070&auto=format&fit=crop',
      brand: 'Wellness Bloom',
      title: 'Pure Radiance',
      description: 'Transform your daily routine into a luxurious ritual. Dermatologist-approved formulas designed to nourish and protect.',
      primaryCta: 'Explore Skincare',
      primaryLink: '/category',
      secondaryCta: 'Read Reviews',
      secondaryLink: '/reviews'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop',
      brand: 'Season Finale',
      title: 'Winter Elegance',
      description: 'Wrap yourself in luxury. From oversized wool coats to soft cashmere blends, discover the perfect layers for the season.',
      primaryCta: 'Claim Your Deal',
      primaryLink: '/deals',
      secondaryCta: 'Browse Collection',
      secondaryLink: '/collection'
    }
  ];

  const slideDuration = 6000;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, slideDuration);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Keep every animated property on the compositor (transform/opacity only)
  // so the slider's idle progress bar doesn't trigger layout on every frame.
  const customStyles = `
    @keyframes shimmer { 100% { transform: translateX(100%); } }
    @keyframes progress { 0% { transform: scaleX(0); } 100% { transform: scaleX(1); } }
    @keyframes textSlideUp { 0% { opacity: 0; transform: translateY(40px); } 100% { opacity: 1; transform: translateY(0); } }
  `;

  return (
    <div className="relative w-full h-[90vh] lg:h-screen overflow-hidden bg-[#111111]">
      <style>{customStyles}</style>

      {slides.map((slide, index) => {
        const isActive = index === currentSlide;
        return (
          <div key={slide.id} className={`absolute inset-0 w-full h-full transition-all duration-1000 ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            
            {/* Cinematic Background - Slow Zoom-in Scale */}
            <div
              className={`absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-[7000ms] ease-out ${isActive ? 'scale-110' : 'scale-100'}`}
              style={{ backgroundImage: `url(${slide.image})` }}
            />

            {/* Premium Dual Layer Gradients */}
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

            {/* Content Section - Centered & Premium */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-20">
              <div className="max-w-4xl">
                
                {/* Brand Label */}
                <div className={`inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black tracking-[0.3em] uppercase mb-6 transition-all duration-1000 delay-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                   <FiZap className="text-[#007074] animate-pulse" /> {slide.brand}
                </div>

                {/* Main Title - Font Serif Black */}
                <h1 className={`text-4xl sm:text-6xl  font-serif font-black text-white mb-6 tracking-tighter leading-tight drop-shadow-2xl transition-all duration-1000 delay-500 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                  {slide.title.split(' ')[0]} <span className="italic text-[#007074]">{slide.title.split(' ')[1]}</span>
                </h1>

                {/* Description - Focused & Modern */}
                <p className={`text-sm md:text-base lg:text-lg text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed uppercase  transition-all duration-1000 delay-700 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                  {slide.description}
                </p>

                {/* Action Buttons */}
                <div className={`flex flex-col sm:flex-row items-center justify-center gap-5 transition-all duration-1000 delay-[900ms] ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                  
                  <Link
                    to={slide.primaryLink}
                    className="group relative flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-4 overflow-hidden rounded-full bg-[#007074] text-white font-black uppercase tracking-[0.2em] text-[11px] transition-all duration-500 hover:shadow-[0_15px_35px_rgba(0,112,116,0.4)] active:scale-95"
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    <span className="relative z-10">{slide.primaryCta}</span>
                    <FiArrowRight className="relative z-10 group-hover:translate-x-1.5 transition-transform" />
                  </Link>

                  <Link
                    to={slide.secondaryLink}
                    className="group flex items-center justify-center w-full sm:w-auto px-10 py-4 rounded-full border border-white/30 bg-white/5 backdrop-blur-lg text-white font-black uppercase tracking-[0.2em] text-[11px] transition-all duration-500 hover:bg-white hover:text-[#222] active:scale-95 shadow-xl"
                  >
                    <span>{slide.secondaryCta}</span>
                  </Link>

                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Progress & Pagination Controls */}
      <div className="absolute sm:flex hidden bottom-10 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-6">
        
        {/* Visual Progress Dots */}
        <div className="flex items-center gap-4">
          {slides.map((_, index) => {
            const isCurrent = index === currentSlide;
            return (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={isCurrent ? 'true' : 'false'}
                className="group relative w-12 h-8 flex items-center justify-center"
              >
                <div className={`h-[2px] transition-all duration-500 rounded-full ${isCurrent ? 'w-full bg-[#007074]' : 'w-4 bg-white/30 group-hover:bg-white/60'}`} />
                {isCurrent && (
                   <div
                     className="absolute bottom-0 left-0 h-[2px] w-full bg-[#007074] animate-[progress_6s_linear_forwards] origin-left"
                     aria-hidden="true"
                   />
                )}
              </button>
            );
          })}
        </div>

        {/* Counter */}
        <div className="text-[10px] font-black text-white tracking-[0.4em] uppercase opacity-40">
          0{currentSlide + 1} <span className="mx-2">/</span> 0{slides.length}
        </div>
      </div>
    </div>
  );
}