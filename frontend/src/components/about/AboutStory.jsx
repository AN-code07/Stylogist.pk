import React from 'react';

export default function AboutStory() {
  return (
    <section className="bg-[#F7F3F0] py-10 relative overflow-hidden">
      
      {/* Decorative Dotted Pattern Backgrounds (Teal accents) */}
      <div 
        className="absolute top-10 right-10 w-64 h-64 opacity-[0.08] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#007074 2px, transparent 2px)', backgroundSize: '24px 24px' }}
      ></div>
   
      <div 
        className="absolute bottom-10 left-10 w-64 h-64 opacity-[0.05] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#007074 2px, transparent 2px)', backgroundSize: '24px 24px' }}
      ></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        
        {/* Overlapping Flex Container */}
        <div className="flex flex-col lg:flex-row items-stretch">
            {/* ========================================= */}
          <div className="lg:w-[60%] z-10">
            {/* White card with sharp top corners and sweeping bottom-right curve */}
            <div className="bg-white h-full p-8 md:p-12 lg:p-16 lg:pr-24 rounded-tl-md rounded-tr-md lg:rounded-tr-none rounded-bl-md rounded-br-[80px] lg:rounded-br-[140px] shadow-xl border border-[#E9DBD1]">
              
              <div className="flex items-center gap-2 mb-5">
                <span className="w-8 h-0.5 bg-[#007074]"></span>
                <p className="text-[#007074] text-xs md:text-sm font-bold tracking-widest uppercase">
                  Welcome to Stylogist
                </p>
              </div>
              
              <h2 className="text-3xl font-bold text-[#222222] font-serif leading-tight mb-8">
                Where Fashion Meets  &nbsp;
                <span className="text-[#007074]">Intelligence!</span>
              </h2>
              
              <div className="space-y-5 text-gray-600 text-sm md:text-base text-justify leading-relaxed">
                <p>
                  At Stylogist.pk, we believe that shopping should be more than just transactions. It should be an experience that empowers individuals to express their unique identity and elevate their everyday lifestyle.
                </p>
                <p>
                  As a pioneering fashion technology platform, we are committed to delivering exceptional editorial curation that goes beyond expectations. With a focus on AI-driven innovation, personalized style solutions, and unwavering quality, we strive to provide the best premium experience for our valued customers. Join us on this exciting journey and discover a new level of styling excellence.
                </p>
              </div>

            </div>
          </div>

          {/* ========================================= */}
          {/* RIGHT: IMAGE CONTAINER (Tucked behind card) */}
          {/* ========================================= */}
          {/* lg:-ml-24 pulls the image to the left so it sits UNDER the text card's curved corner */}
          <div className="lg:w-[50%] lg:-ml-24 z-0 mt-8 lg:mt-0 lg:pt-12 lg:pb-12 group">
            <div className="w-full h-[400px] lg:h-full relative rounded-md overflow-hidden shadow-2xl border border-gray-100">
              
              {/* Full color, high-quality image with a subtle zoom on hover */}
              <img 
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop" 
                alt="Stylogist Editorial Team" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              
              {/* Very subtle light overlay to blend into the overall bright theme */}
              <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-700"></div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}