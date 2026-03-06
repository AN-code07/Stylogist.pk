import React, { useState } from 'react';
import ComonButton from '../../commonpages/ComonButton';
import { FaBolt } from 'react-icons/fa';
import { Link } from 'react-router-dom';

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
            image: "https://static.vecteezy.com/system/resources/thumbnails/059/006/878/small_2x/a-man-in-a-brown-sweater-and-beige-trousers-holds-a-coat-his-thoughtful-pose-exudes-autumn-sophistication-and-classic-fashion-free-png.png", // Men's fashion
        }
    };

    const currentData = collections[activeTab];

    return (
        <section className="w-full bg-white pt- pb-4 overflow-hidden font-sans">
            <div className="container mx-auto px-4 md:px-8 relative">



                {/* ========================================= */}
                <div className="absolute h-42 w-[240px] md:w-[280px] top-4 left-4 md:flex hidden md:-top-6 z-40 group hover:scale-105 transition-transform duration-300">

                    {/* The Background Template Image */}
                    <div className='h-full w-full bg-cover bg-center  bg-no-repeat relative overflow-hidden rounded-xl  transform -rotate-18 ' style={{
                        background: 'url(https://static.vecteezy.com/system/resources/thumbnails/033/356/539/small_2x/flash-sale-promotion-banner-template-design-with-space-free-png.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}>

                        {/* Tilted Text Overlay Container */}
                        <div className="absolute inset-0 flex items-center justify-center z-10 transform -rotate-12 transition-transform duration-500 group-hover:-rotate-6">

                            {/* The Slanted Text Box */}
                            <div className=" text-white py-4 px-6 rounded-2xl w-[90%] flex flex-col items-center justify-center">


                                {/* Text Layout */}
                                <div className="text-center">
                                    <p className="text-[#007074] text-[10px] md:text-xs font-bold tracking-widest uppercase mb-[-4px]">
                                        Exclusive
                                    </p>
                                    <h3 className="text-white text-3xl  leading-none tracking-tighter my-2 font-semibold  ">
                                        HOT<span className="text-white ml-1">DEALS</span>
                                    </h3>
                                    <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest bg-[#007074] text-white px-4 py-1 rounded-full mt-1.5 border border-[#222222] ">
                                        Up To {currentData.discount} OFF
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Background Pulse Effect inside the template area */}
                        <div className="absolute inset-0 bg-[#007074]/10 animate-pulse rounded-xl"></div>

                    </div>
                </div>


                {/* ========================================= */}
                {/* TILTED "HOT DEALS" POSTER BANNER          */}
                <h1
                    key={`title-${activeTab}`}
                    className="text-2xl  md:text-[3.4rem] text-center font-bold text-[#222222] leading-[1.1] tracking-tight mt-10 md:mb-8 relative z-10 animate-fade-in-up "
                >
                    New <span className='text-[#007074]'>{currentData.season}</span>  Collection
                </h1>
                {/* MAIN DARK BANNER */}
                {/* ========================================= */}
                <div className="relative bg-[#111111] rounded-md w-full min-h-[400px] md:mt-24 mt-10 flex flex-col md:flex-row">

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
                            <div className='flex gap-7 mt-3 justify-start'>
                                <Link to='/category'>
                                    <button className="bg-[#007074] text-white px-6 py-2 rounded-md cursor-pointer hover:bg-[#005a5a] transition-colors duration-300">
                                        Shop Now
                                    </button>
                                </Link>
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
                {/* Container: needs relative and overflow-hidden */}
                <div className="pt-12 border-t border-gray-100 w-full overflow-hidden relative brand-slider-container bg-white">

                    {/* --- LEFT SIDE BLUR/FADE OVERLAY --- */}
                    {/* Note: Change 'from-white' to match your section's background color if it is not white */}
                    <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>

                    {/* --- RIGHT SIDE BLUR/FADE OVERLAY --- */}
                    <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

                    {/* The Scrolling Track (Pauses on hover via CSS) */}
                    <div className="flex w-max animate-scroll-logos relative z-0">

                        {/* --- First Set of Logos --- */}
                        <div className="flex items-center gap-16 px-8">
                            <span className="text-2xl font-bold font-serif italic text-[#222222] grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer">H&M</span>
                            <span className="text-2xl font-black tracking-tighter text-[#222222] grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer">OBEY</span>
                            <span className="text-2xl font-bold text-[#222222] flex items-center gap-2 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer">
                                {/* Keep this internal SVG as it is the Shopify logo, not part of the edge blur effect */}
                                <svg className="w-6 h-6 text-[#007074]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                                shopify
                            </span>
                            <span className="text-2xl font-black uppercase tracking-widest text-[#222222] grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer">Lacoste</span>
                            <span className="text-2xl font-bold text-red-600 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer">Levi's</span>
                            <span className="text-2xl font-bold text-[#222222] grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer">amazon</span>
                        </div>

                        {/* --- Second Set of Logos (Duplicated for a seamless infinite loop) --- */}
                        <div className="flex items-center gap-16 px-8">
                            <span className="text-2xl font-bold font-serif italic text-[#222222] grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer">H&M</span>
                            <span className="text-2xl font-black tracking-tighter text-[#222222] grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer">OBEY</span>
                            <span className="text-2xl font-bold text-[#222222] flex items-center gap-2 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer">
                                <svg className="w-6 h-6 text-[#007074]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                                shopify
                            </span>
                            <span className="text-2xl font-black uppercase tracking-widest text-[#222222] grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer">Lacoste</span>
                            <span className="text-2xl font-bold text-red-600 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer">Levi's</span>
                            <span className="text-2xl font-bold text-[#222222] grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer">amazon</span>
                        </div>

                        {/* --- Third Set of Logos --- */}
                        <div className="flex items-center gap-16 px-8">
                            <span className="text-2xl font-bold font-serif italic text-[#222222] grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer">H&M</span>
                            <span className="text-2xl font-black tracking-tighter text-[#222222] grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer">OBEY</span>
                            <span className="text-2xl font-bold text-[#222222] flex items-center gap-2 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer">
                                <svg className="w-6 h-6 text-[#007074]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                                shopify
                            </span>
                            <span className="text-2xl font-black uppercase tracking-widest text-[#222222] grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer">Lacoste</span>
                            <span className="text-2xl font-bold text-red-600 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer">Levi's</span>
                            <span className="text-2xl font-bold text-[#222222] grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer">amazon</span>
                        </div>

                    </div>
                </div>


            </div>

            {/* Tailwind Custom Keyframes */}
            <style jsx="true">{`
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

              /* NEW LOGO SCROLLING ANIMATIONS */
              @keyframes scrollLogos {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .animate-scroll-logos {
                animation: scrollLogos 20s linear infinite;
              }
              
              /* PAUSE ON HOVER LOGIC */
              .brand-slider-container:hover .animate-scroll-logos {
                animation-play-state: paused;
              }
            `}</style>
        </section >
    );
}