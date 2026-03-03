import React from 'react';

export default function VisionStory() {
  return (
    <section className="bg-[#111111]/3 py-10 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        
        {/* Header Section (Exactly like your reference) */}
        <div className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#007074] font-serif mb-4">
            Mission & Vision
          </h2>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed mx-auto max-w-5xl">
            We envision being a leading force in the fashion e-commerce industry, driven by innovation, integrity, and inclusivity, creating a brighter digital future for individuals while maintaining a strong commitment to customer satisfaction and personalized styling.
          </p>
        </div>

        {/* Layout Container */}
        <div className="space-y-6">

          {/* ========================================= */}
          {/* MISSION BLOCK (Card Left, Text Right) */}
          {/* ========================================= */}
          <div className="flex flex-col md:flex-row items-center gap-10">
            
            {/* Image Card (Left) */}
            <div className="w-full md:w-1/2 relative">
              {/* Dotted Pattern Background (Top Left) */}
              <div 
                className="absolute -top-6 -left-6 w-32 h-32 z-0 opacity-50"
                style={{ backgroundImage: 'radial-gradient(#007074 2px, transparent 2px)', backgroundSize: '16px 16px' }}
              ></div>
              
              {/* Dark Padded Card with Shadow & Border */}
              <div className="relative z-10 bg-[#007074] cursor-pointer p-1 rounded-md  shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                <img
                  src="https://img.freepik.com/free-photo/people-holding-cups-coffee-studio_23-2148532480.jpg?ga=GA1.1.2142144714.1772005373&semt=ais_hybrid&w=740&q=80"
                  alt="Stylogist Mission"
                  className="w-full h-[280px] lg:h-[320px] object-cover rounded-md grayscale hover:grayscale-0 transition-all duration-700"
                />
              </div>
            </div>

            {/* Text Side (Right) - Vertical line on Left */}
            <div className="w-full md:w-1/2">
              <div className="border-l-[3px] border-[#007074] pl-6 md:pl-8">
                <h3 className="text-2xl font-bold text-[#007074] mb-4">
                  Mission
                </h3>
                <p className="text-gray-400 text-sm md:text-base text-justify leading-relaxed">
                  At Stylogist.pk, our mission is to empower our customers to achieve ultimate style confidence. We are dedicated to delivering innovative fashion solutions that cater to their unique needs. Through personalized AI services, expert curation, and cutting-edge technology, we aim to build strong, lasting relationships with our customers. Our mission is to be their trusted partner, helping them navigate their fashion journey.
                </p>
              </div>
            </div>

          </div>

          {/* ========================================= */}
          {/* VISION BLOCK (Text Left, Card Right) */}
          {/* ========================================= */}
          <div className="flex flex-col md:flex-row items-center gap-10">
            
            {/* Text Side (Left) - Vertical line on Right (Desktop), Left (Mobile) */}
            <div className="w-full md:w-1/2 order-2 md:order-1">
              <div className="border-l-[3px] md:border-l-0 md:border-r-[3px] border-[#007074] pl-6 md:pl-0 md:pr-8 md:text-start">
                <h3 className="text-2xl font-bold text-[#007074] mb-4">
                  Vision
                </h3>
                <p className="text-gray-400 text-sm md:text-base text-justify leading-relaxed">
                  Our vision at Stylogist is to redefine e-commerce by creating a seamless and personalized experience for our customers. We envision a future where premium fashion is accessible, transparent, and tailored to individual preferences. Through continuous innovation and collaboration, we strive to be at the forefront of the industry, setting new standards for customer-centric retail.
                </p>
              </div>
            </div>

            {/* Image Card (Right) */}
            <div className="w-full md:w-1/2 relative order-1 md:order-2">
              {/* Dotted Pattern Background (Bottom Right) */}
              <div 
                className="absolute -bottom-6 -right-6 w-32 h-32 z-0 opacity-50"
                style={{ backgroundImage: 'radial-gradient(#007074 2px, transparent 2px)', backgroundSize: '16px 16px' }}
              ></div>
              
              {/* Dark Padded Card with Shadow & Border */}
              <div className="relative z-10 bg-[#007074] cursor-pointer p-1 rounded-md  shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                <img
                  src="https://img.freepik.com/free-photo/couple-enjoying-online-order-they-received_23-2148455108.jpg?ga=GA1.1.2142144714.1772005373&semt=ais_hybrid&w=740&q=80"
                  alt="Stylogist Vision"
                  className="w-full h-[280px] lg:h-[320px] object-cover rounded-md grayscale hover:grayscale-0 transition-all duration-700"
                />
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}