import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';

export default function AboutHeader() {
  return (
    <section className="relative w-full  min-h-[500px] flex justify-center items-center overflow-hidden">
      
      {/* BACKGROUND IMAGE & BLUR/COLOR OVERLAYS */}
      <div className="absolute inset-0 z-0">
        {/* The Image with a light blur */}
        <img 
          src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070&auto=format&fit=crop" 
          alt="About Stylogist" 
          className="w-full h-full object-cover blur-[3px] scale-105"
        />
        
        {/* The Teal Color Overlay (Solid on left, transparent on right) */}
        <div className="absolute inset-0 bg-gradient-to-l from-[#0070746b] via-[#00707468] to-[#007074]/30"></div>
        
        {/* Secondary dark overlay just to ensure text contrast */}
        <div className="absolute inset-0 bg-black/10"></div>
      </div>

      {/* LEFT SIDE CONTENT */}
      <div className="container text-center mx-auto px-4 sm:px-6 lg:px-8  relative z-10">
        <div className="">
          
          {/* Breadcrumb / Tag */}
          <div className="inline-flex items-center space-x-2 mb-6 animate-[fadeInUp_0.8s_ease-out]">
            <span className="w-8 h-0.5 bg-white/60"></span>
            <span className="text-white/80 text-xs font-bold tracking-widest uppercase">
              Our Story
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white font-serif leading-tight mb-6 animate-[fadeInUp_1s_ease-out]">
            Redefining Premium <br />
            {/* <span className="text-white/90 italic font-light">E-Commerce.</span> */}
          </h1>

          {/* Description */}
          <p className="text-base md:text-lg text-white/80 leading-relaxed mb-10 max-w-4xl mx-auto animate-[fadeInUp_1.2s_ease-out]">
            At Stylogist.pk, we blend cutting-edge AI technology with high-end fashion to curate a shopping experience that is as unique as your personal style. Welcome to the future of retail.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-[fadeInUp_1.4s_ease-out]">
            <Link 
              to="/category" 
              className="w-full sm:w-auto bg-white text-[#007074] px-8 py-3.5 rounded-md font-bold text-sm uppercase tracking-wider hover:bg-gray-100 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              <span>Explore Collection</span>
              <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              to="/contact" 
              className="w-full sm:w-auto bg-transparent border border-white/50 text-white px-8 py-3.5 rounded-md font-bold text-sm uppercase tracking-wider hover:bg-white/10 transition-all duration-300 flex items-center justify-center"
            >
              Get in Touch
            </Link>
          </div>

        </div>
      </div>

      {/* Tailwind Custom Animation */}
      <style jsx="true">{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}