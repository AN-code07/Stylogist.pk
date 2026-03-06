import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';

export default function HomeHeader() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Slider Data for Stylogist.pk with dual CTAs
  const slides = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop',
      title: 'Signature Style',
      subtitle: 'Discover premium fashion curated just for you by our smart AI.',
      description: 'Elevate your wardrobe with our latest editorial pieces. Meticulously crafted for the modern individual who values both cutting-edge aesthetics and everyday comfort.',
      primaryCta: 'Shop New Arrivals',
      primaryLink: '/category',
      secondaryCta: 'View Lookbook',
      secondaryLink: '/lookbook'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=2070&auto=format&fit=crop',
      title: 'Pure Radiance',
      subtitle: 'Glow naturally with our top-rated, dermatologist-approved kits.',
      description: 'Transform your daily routine into a luxurious ritual. Our organic, cruelty-free formulas are designed to deeply nourish, protect, and revitalize your skin from within.',
      primaryCta: 'Explore Skincare',
      primaryLink: '/category',
      secondaryCta: 'Read Reviews',
      secondaryLink: '/reviews'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop',
      title: 'Winter Elegance',
      subtitle: 'Cozy, elegant, and timeless. Enjoy up to 40% off on selected items.',
      description: 'Wrap yourself in luxury this season. From oversized wool coats to ultra-soft cashmere blends, discover the perfect layers to keep you warm without compromising on style.',
      primaryCta: 'Claim Your Deal',
      primaryLink: '/deals',
      secondaryCta: 'Browse Collection',
      secondaryLink: '/collection'
    }
  ];

  const slideDuration = 6000; // 6 seconds

  // Auto-play functionality
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, slideDuration);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="relative w-full h-[85vh] lg:h-screen overflow-hidden bg-[#111111]">

      {/* Slides Container */}
      {slides.map((slide, index) => {
        const isActive = index === currentSlide;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
          >
            {/* Background Image with strong cinematic slow-zoom */}
            <div
              className={`absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-[7000ms] ease-out ${isActive ? 'scale-110' : 'scale-100'
                }`}
              style={{ backgroundImage: `url(${slide.image})` }}
            />

            {/* Multi-layered Dark Gradients for perfect text contrast on ANY image */}
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

            {/* Centered Content with Staggered Animations */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-6 md:px-12 z-20">
              <div className="max-w-4xl w-full flex flex-col items-center">

                {/* Title (Fades in first) */}
                <h1
                  className={`text-4xl md:text-6xl  font-bold text-white mb-4 sm:mb-6 font-serif drop-shadow-2xl tracking-tight transition-all duration-1000 transform ${isActive ? 'translate-y-0 opacity-100 delay-300' : 'translate-y-12 opacity-0'
                    }`}
                >
                  {slide.title}
                </h1>

            
                {/* NEW: Description (Fades in third) */}
                <p className={`text-md sm:text-base md:text-lg text-gray-300 mb-8 sm:font-semibold sm:mb-10 max-w-3xl mx-auto  leading-relaxed drop-shadow-md transition-all duration-1000 transform ${isActive ? 'translate-y-0 opacity-100 delay-[600ms]' : 'translate-y-12 opacity-0'
                  }`}
                >
                  {slide.description}
                </p>

                {/* Dual CTA Buttons (Fades in third) */}
                <div
                  className={`flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full sm:w-auto transition-all duration-1000 transform ${isActive ? 'translate-y-0 opacity-100 delay-700' : 'translate-y-12 opacity-0'
                    }`}
                >
                  {/* Primary CTA (Teal) */}
                  <Link
                    to={slide.primaryLink}
                    className="group relative flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 overflow-hidden rounded-md bg-[#007074] text-white font-bold tracking-widest uppercase text-sm transition-all duration-300 hover:bg-[#005a5d] shadow-[0_0_20px_rgba(0,112,116,0.4)] hover:shadow-[0_0_30px_rgba(0,112,116,0.6)] active:scale-95"
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    <span className="relative z-10">{slide.primaryCta}</span>
                    <FiArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  {/* Secondary CTA (Glassmorphism / Outline) */}
                  <Link
                    to={slide.secondaryLink}
                    className="group flex items-center justify-center w-full sm:w-auto px-8 py-4 rounded-md border border-white/50 bg-white/10 backdrop-blur-md text-white font-bold tracking-widest uppercase text-sm transition-all duration-300 hover:bg-white hover:text-[#222222] active:scale-95"
                  >
                    <span>{slide.secondaryCta}</span>
                  </Link>
                </div>

              </div>
            </div>
          </div>
        );
      })}

      {/* Bottom Pagination & Progress Line */}
      <div className="absolute sm:flex hidden bottom-0 left-0 w-full z-30 pb-8 flex flex-col items-center">
        {/* Dots */}
        <div className="flex space-x-3 mb-4">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-500 rounded-full ${index === currentSlide
                  ? 'w-12 h-1.5 bg-[#007074]' // Active dot is wider
                  : 'w-2 h-1.5 bg-white/50 hover:bg-white'
                }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

     
      </div>

      {/* Tailwind Custom Keyframes */}
      <style jsx="true">{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}