import React, { memo } from 'react';
import { FiTarget, FiEye, FiZap, FiShield } from 'react-icons/fi';
import Reveal from '../animation/Reveal';

const VisionStory = () => {
  return (
    <section className="bg-[#FDFDFD] py-10 lg:pb-8 relative overflow-hidden font-sans border-t border-gray-50">

      {/* BACKGROUND (kept same, no render cost impact) */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#007074]/5 rounded-full blur-[100px] pointer-events-none" />
      <div
        className="absolute bottom-10 left-10 w-64 h-64 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#007074 1px, transparent 1px), linear-gradient(90deg, #007074 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      <div className="container mx-auto px-6 relative z-10 max-w-6xl">

        {/* HEADER */}
        <Reveal delay={100}>
          <div className="mb-10 lg:mb-20 text-center max-w-3xl mx-auto">

            <div className="inline-block bg-[#007074]/10 text-[#007074] text-[10px] font-black px-4 py-1 rounded-full mb-4 uppercase tracking-[0.3em]">
              Purpose & Direction
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-black text-[#222] tracking-tight mb-6">
              Mission <span className="italic text-[#007074]">& Vision</span>
            </h2>

            <p className="text-gray-400 text-sm md:text-base lg:uppercase lg:tracking-widest leading-relaxed font-medium">
              Redefining the digital frontier of personalized fashion through innovation, integrity, and artisan-grade curation.
            </p>

          </div>
        </Reveal>

        <div className="space-y-4 lg:space-y-32">

          {/* MISSION */}
          <Reveal delay={100}>
            <div className="flex flex-col lg:flex-row items-center gap-7 lg:gap-20">

              <div className="w-full lg:w-1/2 relative group">

                <div className="absolute -top-4 -left-4 w-24 h-24 border-t-2 border-l-2 border-[#007074]/30 rounded-tl-[2rem] z-0" />

                <div className="relative z-10 bg-white rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden">

                  <div className="rounded-[2rem] overflow-hidden bg-[#F7F3F0]">

                    <img
                      src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1932&auto=format&fit=crop"
                      alt="Stylogist Mission"
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                      className="w-full h-[250px] lg:h-[400px] object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105"
                    />

                  </div>

                </div>

                <div className="absolute -bottom-6 -right-6 bg-[#222] text-white p-5 rounded-2xl shadow-xl z-20 hidden md:block">
                  <FiZap className="text-[#007074] mb-2" size={20} />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Active <br />Curation
                  </p>
                </div>

              </div>

              <div className="w-full lg:w-1/2">
                <div className="space-y-4 lg:space-y-6">

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#007074] shadow-sm">
                      <FiTarget size={20} />
                    </div>
                    <h3 className="text-2xl font-serif font-black text-[#222]">
                      Our Mission
                    </h3>
                  </div>

                  <p className="text-gray-500 text-sm md:text-base leading-relaxed font-medium">
                    At <span className="text-[#222] font-black">HarbalMart.pk</span>, our mission is to empower every customer with ultimate style confidence.
                  </p>

                </div>
              </div>

            </div>
          </Reveal>

          {/* VISION */}
          <Reveal delay={100}>
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

              <div className="w-full lg:w-1/2 order-2 lg:order-1">

                <div className="space-y-6">

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#007074] shadow-sm">
                      <FiEye size={20} />
                    </div>
                    <h3 className="text-2xl font-serif font-black text-[#222]">
                      Our Vision
                    </h3>
                  </div>

                  <p className="text-gray-500 text-sm md:text-base leading-relaxed font-medium">
                    Our vision is to redefine global e-commerce by creating a seamless, transparent experience.
                  </p>

                  <div className="inline-flex items-center gap-4 py-3 px-6 bg-[#222] rounded-full text-white shadow-xl shadow-black/10">
                    <FiShield className="text-[#007074]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                      Industry Standard 2026
                    </span>
                  </div>

                </div>

              </div>

              <div className="w-full lg:w-1/2 order-1 lg:order-2 relative group">

                <div className="absolute -bottom-4 -right-4 w-24 h-24 border-b-2 border-r-2 border-[#007074]/30 rounded-br-[2rem] z-0" />

                <div className="relative z-10 bg-white p-2 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden">

                  <div className="rounded-[2rem] overflow-hidden bg-[#F7F3F0]">

                    <img
                      src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop"
                      alt="Stylogist Vision"
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                      className="w-full h-[250px] lg:h-[400px] object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105"
                    />

                  </div>

                </div>

              </div>

            </div>
          </Reveal>

        </div>
      </div>
    </section>
  );
};

export default memo(VisionStory);