import React, { useState } from 'react';
import ComonButton from '../../commonpages/ComonButton';
import { FaStar } from 'react-icons/fa';

export default function DealHeader() {
    const [activeTab, setActiveTab] = useState('women');

    // Dynamic Data based on toggle
    const collections = {
        women: {
            season: "Summer",
            discount: "70%",
            subtitle: "Just Dropped",
            desc: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. Discover the women's exclusive.",
            image: "https://static.vecteezy.com/system/resources/thumbnails/057/324/265/small_2x/a-woman-holding-shopping-bags-free-png.png", // Fashion models
        },
        men: {
            season: "Winter",
            discount: "50%",
            subtitle: "New Arrivals",
            desc: "Elevate your everyday look. Discover premium tailoring, relaxed fits, and winter essentials designed exclusively for the modern gentleman.",
            image: "https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=1887&auto=format&fit=crop", // Men's fashion
        }
    };

    const currentData = collections[activeTab];

    return (
        <section className="w-full bg-white pt-12 pb-4 overflow-hidden font-sans">
            <div className="container mx-auto px-4 md:px-8 relative">

                {/* ========================================= */}
                <div className="absolute right-4 h-30 w-40 top-4 md:right-10 md:-top-6 z-40 group">

                    <img src="https://img.freepik.com/premium-photo/sale-text-black-background-3d-illustration_357568-782.jpg?ga=GA1.1.2142144714.1772005373&semt=ais_hybrid&w=740&q=80" className='h-full w-full ' alt="" />
                </div>
                
                {/* TOP HUGE HEADING */}
                {/* ========================================= */}
                <h1
                    key={`title-${activeTab}`}
                    className="text-[3.5rem] md:text-7xl  max-w-6xl   font-bold text-[#222222] leading-[1.1] tracking-tight mb-8 relative z-10 animate-fade-in-up"
                >
                    New <span className='text-[#007074]'>{currentData.season}</span> <br /> Collection
                </h1>

                {/* ========================================= */}
                {/* MAIN DARK BANNER */}
                {/* ========================================= */}
                <div className="relative bg-[#111111] rounded-md w-full min-h-[400px] mt-24 flex flex-col md:flex-row">

                    {/* LEFT CONTENT (Toggle & Text) */}
                    <div className="w-full md:w-1/2 p-8  flex flex-col relative z-20 ">

                        {/* The Toggle Switch (Matches image structure) */}
                        <div className="flex bg-white/10 backdrop-blur-sm p-1 rounded-md w-max mx-auto md:mx-0 mt-8 md:mt-12">
                            <button
                                onClick={() => setActiveTab('women')}
                                className={`px-6 py-2 rounded text-sm font-bold transition-all duration-300 ${activeTab === 'women' ? 'bg-[#007074] text-white' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                For Women
                            </button>
                            <button
                                onClick={() => setActiveTab('men')}
                                className={`px-6 py-2 rounded text-sm font-bold transition-all duration-300 ${activeTab === 'men' ? 'bg-[#007074] text-white' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                For Men
                            </button>
                        </div>

                        {/* Bottom Inner Text */}
                        <div key={`desc-${activeTab}`} className=" mt-10  animate-fade-in-up text-center md:text-left">
                            <h3 className="text-white text-3xl font-serif font-bold mb-4">{currentData.subtitle}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto md:mx-0">
                                {currentData.desc}
                            </p>
                            <div className='flex gap-7 justify-start'>
                                <ComonButton padding='px-3 py-2' btntitle="Shop Now" className="mt-8" />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT CONTENT (Overlapping Image) */}
                    <div className="w-full md:w-1/2 relative h-[352px] z-10">
                        {/* Image breaks out of the top and bottom of the black box on desktop */}
                        <img
                            key={`img-${activeTab}`}
                            src={currentData.image}
                            alt="Collection"
                            className="absolute -top-12 md:-top-32 bottom-0 md:-bottom-12 right-4 md:right-10 w-[90%] md:w-[85%] h-[calc(100%+48px)] md:h-[calc(100%+176px)] object-cover object-top  rounded-3xl drop-shadow-[0_20px_50px_rgba(0,112,116,0.5)] animate-fade-in-scale border-4 border-white md:border-none"
                        />
                    </div>

                </div>

                {/* ========================================= */}
                {/* BRAND LOGOS ROW */}
                {/* ========================================= */}
                <div className="mt-24 pt-12 border-t border-gray-100 flex flex-wrap justify-center md:justify-between items-center gap-10 grayscale opacity-60">
                    <span className="text-2xl font-bold font-serif italic text-[#222222]">H&M</span>
                    <span className="text-2xl font-black tracking-tighter text-[#222222]">OBEY</span>
                    <span className="text-2xl font-bold text-[#222222] flex items-center gap-2">
                        <svg className="w-6 h-6 text-[#007074]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                        shopify
                    </span>
                    <span className="text-2xl font-black uppercase tracking-widest text-[#222222]">Lacoste</span>
                    <span className="text-2xl font-bold text-red-600">Levi's</span>
                    <span className="text-2xl font-bold text-[#222222]">amazon</span>
                </div>

            </div>

            {/* Tailwind Custom Keyframes */}
            <style jsx="true">{`
              /* Added the missing slide animations back! */
              @keyframes slideLeft {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              @keyframes slideRight {
                0% { transform: translateX(-50%); }
                100% { transform: translateX(0); }
              }
              .animate-slide-left {
                animation: slideLeft 6s linear infinite;
              }
              .animate-slide-right {
                animation: slideRight 6s linear infinite;
              }

              /* Your existing animations */
              @keyframes fadeInUp {
                0% { opacity: 0; transform: translateY(20px); }
                100% { opacity: 1; transform: translateY(0); }
              }
              @keyframes fadeInScale {
                0% { opacity: 0; transform: scale(0.95); }
                100% { opacity: 1; transform: scale(1); }
              }
              .animate-fade-in-up {
                animation: fadeInUp 0.5s ease-out forwards;
              }
              .animate-fade-in-scale {
                animation: fadeInScale 0.6s ease-out forwards;
              }
            `}</style>
        </section>
    );
}