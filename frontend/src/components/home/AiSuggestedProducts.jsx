import React, { useState } from 'react';
import { FiCpu, FiPlus, FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function AiSuggestedProducts() {
  const [hoveredProduct, setHoveredProduct] = useState(null);

  // A complete 'Look' curated by AI
  const curatedLook = {
    mainPiece: {
      id: 401,
      name: "Midnight Silk Slip Dress",
      price: 14500,
      match: 98,
      reason: "Matches your affinity for dark, fluid silhouettes.",
      image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1983&auto=format&fit=crop",
    },
    accessories: [
      {
        id: 402,
        name: "Matte Onyx Timepiece",
        price: 12999,
        match: 94,
        reason: "Adds the minimalist contrast you prefer.",
        image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=1976&auto=format&fit=crop",
      },
      {
        id: 403,
        name: "Quilted Leather Clutch",
        price: 8500,
        match: 91,
        reason: "Perfect texture pairing for smooth silk.",
        image: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=1915&auto=format&fit=crop",
      }
    ]
  };

  return (
    <section className="w-full bg-white py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        {/* Section Header */}
        <div className="mb-10 flex flex-col md:flex-row items-start md:items-end justify-between">
          <div>
            <h2 className="text-xl md:text-3xl font-bold text-[#222222] font-serif leading-tight">
              AI Style <span className="text-[#007074]">Analysis</span>
            </h2>
            <div className="h-1 w-16 bg-[#007074] mt-4 rounded-md"></div>
          </div>
        </div>

        {/* Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* ========================================= */}
          {/* LEFT: AI PROFILE CONSOLE (Takes up 4 columns) */}
          {/* ========================================= */}
          <div className="lg:col-span-4 bg-[#222222] rounded-md p-6 md:p-8 flex flex-col relative overflow-hidden shadow-xl border border-gray-800">
            {/* Pulsing Radar Background Effect */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#007074]/20 rounded-full blur-[80px] animate-pulse"></div>

            <div className="relative z-10 flex-1">
              <div className="flex items-center gap-3 mb-8">
                <div className="relative flex items-center justify-center w-10 h-10">
                  <span className="absolute inline-flex h-full w-full rounded-md bg-[#007074] opacity-50 animate-ping"></span>
                  <div className="relative flex items-center justify-center w-10 h-10 bg-[#007074] rounded-md text-white">
                    <FiCpu size={20} />
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-bold tracking-widest uppercase text-sm">Stylogist Engine</h3>
                  <p className="text-[#007074] text-xs font-mono">Status: Active</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">Detected Profile</p>
                  <p className="text-xl text-white font-serif font-bold">Minimalist Elegance</p>
                </div>

                {/* Simulated Data Readouts */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Color Palette Match</span>
                      <span className="text-[#007074] font-mono">92%</span>
                    </div>
                    <div className="w-full h-1 bg-gray-800 rounded-full">
                      <div className="h-full bg-[#007074] rounded-full w-[92%]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Silhouette Fit</span>
                      <span className="text-[#007074] font-mono">88%</span>
                    </div>
                    <div className="w-full h-1 bg-gray-800 rounded-full">
                      <div className="h-full bg-[#007074] rounded-full w-[88%]"></div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#111111] p-4 rounded-md border border-gray-800">
                  <p className="text-gray-400 text-sm leading-relaxed italic">
                    "Based on your recent interest in monochromatic tones and structured accessories, we have curated a complete evening look."
                  </p>
                </div>
              </div>
            </div>

            <button className="mt-8 w-full flex items-center justify-center gap-2 border border-[#007074] text-[#007074] hover:bg-[#007074] hover:text-white py-3 rounded-md transition-colors text-sm font-bold uppercase tracking-widest z-10">
              Refine Profile
            </button>
          </div>

          {/* ========================================= */}
          {/* RIGHT: CURATED LOOK BENTO GRID (Takes up 8 cols) */}
          {/* ========================================= */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Main Anchor Piece (Tall) */}
            <div 
              className="relative rounded-md overflow-hidden group h-[400px] md:h-auto md:row-span-2 shadow-lg border border-gray-100"
              onMouseEnter={() => setHoveredProduct(curatedLook.mainPiece.id)}
              onMouseLeave={() => setHoveredProduct(null)}
            >
              <img 
                src={curatedLook.mainPiece.image} 
                alt={curatedLook.mainPiece.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              {/* Glassmorphism Overlay */}
              <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-[#007074] text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
                        <FiCheckCircle size={10}/> {curatedLook.mainPiece.match}% Match
                      </span>
                      <span className="text-gray-300 text-xs font-medium italic hidden sm:block">
                        {curatedLook.mainPiece.reason}
                      </span>
                    </div>
                    <h3 className="text-white text-2xl font-bold font-serif">{curatedLook.mainPiece.name}</h3>
                    <p className="text-[#007074] text-lg font-bold mt-1">Rs. {curatedLook.mainPiece.price.toLocaleString()}</p>
                  </div>
                  <button className="bg-white text-[#222222] p-3 rounded-full hover:bg-[#007074] hover:text-white transition-colors transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 shadow-lg">
                    <FiPlus size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Accessory 1 (Top Right) */}
            <div 
              className="relative rounded-md overflow-hidden group h-[220px] shadow-sm border border-gray-100"
              onMouseEnter={() => setHoveredProduct(curatedLook.accessories[0].id)}
              onMouseLeave={() => setHoveredProduct(null)}
            >
              <img 
                src={curatedLook.accessories[0].image} 
                alt={curatedLook.accessories[0].name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 -bottom-2 p-4 bg-white/90 backdrop-blur-sm border-t border-white/50 transform translate-y-[4.5rem] group-hover:translate-y-0 transition-transform duration-500 ease-in-out">
                <div className="flex justify-between items-center mb-2">
                   <h3 className="text-[#222222] text-sm font-bold truncate pr-2">{curatedLook.accessories[0].name}</h3>
                   <span className="text-[#007074] text-xs font-bold whitespace-nowrap">{curatedLook.accessories[0].match}% Match</span>
                </div>
                <p className="text-[#007074] text-sm font-bold mb-3">Rs. {curatedLook.accessories[0].price.toLocaleString()}</p>
                <button className="w-full bg-[#222222] text-white py-2 text-xs font-bold uppercase tracking-widest rounded hover:bg-[#007074] transition-colors flex items-center justify-center gap-2">
                  <FiPlus /> Add to Look
                </button>
              </div>
            </div>

            {/* Accessory 2 (Bottom Right) */}
            <div 
              className="relative rounded-md overflow-hidden group h-[220px] shadow-sm border border-gray-100"
              onMouseEnter={() => setHoveredProduct(curatedLook.accessories[1].id)}
              onMouseLeave={() => setHoveredProduct(null)}
            >
              <img 
                src='https://img.freepik.com/free-photo/outdoor-fashion-portrait-elegant-young-woman-with-amazing-blonde-long-hairs-pretty-face-smiling-enjoy-sunny-day-posing-near-blue-vintage-car-modern-glamour-boho-outfit-bad-jewelry_291049-1147.jpg?ga=GA1.1.2142144714.1772005373&semt=ais_hybrid&w=740&q=80' 
                alt={curatedLook.accessories[1].name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 -bottom-2 p-4 bg-white/90 backdrop-blur-sm border-t border-white/50 transform translate-y-[4.5rem] group-hover:translate-y-0 transition-transform duration-500 ease-in-out">
                <div className="flex justify-between items-center mb-2">
                   <h3 className="text-[#222222] text-sm font-bold truncate pr-2">{curatedLook.accessories[1].name}</h3>
                   <span className="text-[#007074] text-xs font-bold whitespace-nowrap">{curatedLook.accessories[1].match}% Match</span>
                </div>
                <p className="text-[#007074] text-sm font-bold mb-3">Rs. {curatedLook.accessories[1].price.toLocaleString()}</p>
                <button className="w-full bg-[#222222] text-white py-2 text-xs font-bold uppercase tracking-widest rounded hover:bg-[#007074] transition-colors flex items-center justify-center gap-2">
                  <FiPlus /> Add to Look
                </button>
              </div>
            </div>

          </div>

        </div>
        
      

      </div>
    </section>
  );
}