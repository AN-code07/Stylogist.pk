import React from 'react';
import { FiCpu, FiFeather, FiGlobe, FiShield } from 'react-icons/fi';

export default function CoreValues() {
  const values = [
    {
      id: 1,
      icon: <FiCpu size={32} strokeWidth={1.5} />,
      title: "AI-Driven Curation",
      description: "Our proprietary algorithm learns your unique aesthetic to recommend pieces that perfectly align with your personal style profile."
    },
    {
      id: 2,
      icon: <FiFeather size={32} strokeWidth={1.5} />,
      title: "Premium Craftsmanship",
      description: "We partner exclusively with top-tier artisans and brands to ensure every fabric, stitch, and detail meets luxury standards."
    },
    {
      id: 3,
      icon: <FiGlobe size={32} strokeWidth={1.5} />,
      title: "Sustainable Ethos",
      description: "Fashion with a conscience. We prioritize brands that utilize eco-friendly materials and ethical manufacturing processes."
    },
    {
      id: 4,
      icon: <FiShield size={32} strokeWidth={1.5} />,
      title: "Secure & Seamless",
      description: "From browsing to unboxing, enjoy a frictionless experience with secure checkouts and dedicated premium customer care."
    }
  ];

  return (
    <section className="bg-white py-10 border-t border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <span className="w-8 h-0.5 bg-[#007074]"></span>
            <span className="text-[#007074] text-xs font-bold tracking-widest uppercase">The Stylogist Difference</span>
            <span className="w-8 h-0.5 bg-[#007074]"></span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-[#222222] font-serif mb-6">
            Our Core <span className="text-[#007074]">Values</span>
          </h2>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {values.map((value) => (
            <div 
              key={value.id} 
              className="group flex flex-col items-center text-center p-8 rounded-md bg-[#F7F3F0] hover:bg-[#007074] transition-colors duration-500 border border-[#E0E0E0] hover:border-[#007074] shadow-md hover:shadow-xl"
            >
              {/* Icon Container */}
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-white text-[#007074] mb-6 shadow-sm group-hover:scale-110 transition-transform duration-500">
                {value.icon}
              </div>
              
              <h3 className="text-lg font-bold text-[#222222] group-hover:text-white mb-4 transition-colors duration-500">
                {value.title}
              </h3>
              
              <p className="text-sm text-gray-600 group-hover:text-white/90 leading-relaxed transition-colors duration-500">
                {value.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}