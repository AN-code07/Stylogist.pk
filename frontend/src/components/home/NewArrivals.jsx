import React, { useState, useEffect } from 'react';
import { FiArrowRight, FiShoppingBag, FiStar } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function NewArrivals() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // New Arrivals Data
  const newArrivals = [
    {
      id: 201,
      name: "Emerald Silk Maxi Dress",
      category: "Women's Apparel",
      price: 14500,
      rating: 5.0,
      image: "https://img.freepik.com/free-photo/beautiful-bride-wearing-green-wedding-dress_1328-3427.jpg?ga=GA1.1.2142144714.1772005373&semt=ais_hybrid&w=740&q=80",
      description: "Fluid silk satin that drapes beautifully, featuring a modern cowl neckline."
    },
    {
      id: 202,
      name: "Textured Leather Handbag",
      category: "Accessories",
      price: 8999,
      rating: 4.8,
      image: "https://img.freepik.com/free-photo/close-up-fashion-details-stylish-woman-purple-suit-walking-city-street-spring-summer-autumn-season-fashion-trend-holding-purse_285396-7072.jpg?ga=GA1.1.2142144714.1772005373&semt=ais_hybrid&w=740&q=80",
      description: "Structured design with gold-tone hardware and a spacious interior."
    },
    {
      id: 203,
      name: "Double-Breasted Trench",
      category: "Outerwear",
      price: 18999,
      rating: 4.9,
      image: "https://img.freepik.com/premium-photo/confident-businessman-confident-young-man-full-suit-adjusting-his-sleeve-looking-away-while-standing-outdoors-with-cityscape-background_233298-669.jpg?ga=GA1.1.2142144714.1772005373&semt=ais_hybrid&w=740&q=80",
      description: "A timeless classic tailored from a premium water-resistant cotton blend."
    },
    {
      id: 204,
      name: "Suede Ankle Boots",
      category: "Footwear",
      price: 11200,
      rating: 4.7,
      image: "https://img.freepik.com/free-photo/girl-coat_1303-4419.jpg?ga=GA1.1.2142144714.1772005373&semt=ais_hybrid&w=740&q=80",
      description: "Handcrafted suede with a comfortable block heel for everyday elegance."
    }
  ];

  // Auto-play logic
  useEffect(() => {
    let interval;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setActiveIndex((prevIndex) => (prevIndex + 1) % newArrivals.length);
      }, 4000); // Changes image every 4 seconds
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, newArrivals.length]);

  // Handle manual click
  const handleItemClick = (index) => {
    setActiveIndex(index);
    setIsAutoPlaying(false); // Stop auto-playing when user manually selects
  };

  return (
    <section className="w-full bg-white py-10">
      <div className=" px-4 sm:px-6 lg:px-8">
        
        <div className="grid w-full sm:max-w-6xl mx-auto grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* LEFT SIDE: CONTENT & INTERACTIVE MENU */}
          <div className="w-full flex flex-col justify-center">
            {/* Header */}
            <div className="mb-8">
              <span className="inline-block py-1.5 px-4 rounded-md bg-[#007074]/0 text-[#007074] text-xs font-bold tracking-widest uppercase mb-3 border border-[#007074]/20">
                Fresh Drops
              </span>
              <h2 className="text-xl md:text-3xl font-bold text-[#222222] font-serif leading-tight">
                The <span className="text-[#007074]">New Editorials</span>
              </h2>
              <p className="text-gray-500 mt-3 text-base">
                Explore the latest additions to our premium collection, designed to elevate your everyday style.
              </p>
            </div>

            {/* Interactive Product List */}
            <div className="flex flex-col space-y-5 relative border-l-2 border-gray-200 pl-6 ml-2">
              {/* Animated active indicator line */}
              <div 
                className="absolute left-[-2px] w-1 bg-[#007074] transition-all duration-500 ease-out"
                style={{ 
                  height: '25%', 
                  top: `${activeIndex * 25}%` 
                }}
              />

              {newArrivals.map((product, index) => (
                <div 
                  key={product.id}
                  className="cursor-pointer group"
                  onClick={() => handleItemClick(index)}
                >
                  <p className={`text-xs font-bold tracking-widest uppercase transition-colors duration-300 ${
                    activeIndex === index ? 'text-[#007074]' : 'text-gray-400'
                  }`}>
                    {product.category}
                  </p>
                  <h3 className={`text-md mt-2 font-serif transition-all duration-300 transform ${
                    activeIndex === index ? 'text-[#222222] translate-x-2' : 'text-gray-400 group-hover:text-gray-600'
                  }`}>
                    {product.name}
                  </h3>
                </div>
              ))}
            </div>

            {/* Global CTA */}
            <div className="mt-6">
              <Link
                to="/deals"
                className="inline-flex items-center space-x-2 text-[#007074] border border-[#007074] px-3 py-2 sm:py-2 transition-all ease-in-out font-semibold text-sm sm:text-base hover:text-white hover:bg-[#007074] duration-100 group"
              >
                <span className="border-b-2 border-transparent pb-0.5">Shop All New Arrivals</span>
                <FiArrowRight className="transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* RIGHT SIDE: CINEMATIC IMAGE SHOWCASE */}
          <div className="w-full flex items-center justify-center relative h-[250px] sm:h-[450px] rounded-md overflow-hidden shadow-lg border border-gray-100">
            {newArrivals.map((product, index) => (
              <div
                key={`img-${product.id}`}
                className={`absolute inset-0 w-full h-full transition-all duration-700 ease-in-out ${
                  activeIndex === index ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105 pointer-events-none'
                }`}
              >
                {/* Product Image */}
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
                
                {/* Dark Gradient Overlay for the floating card */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Floating Glassmorphism Product Card */}
                <div className={`absolute bottom-6 left-6 right-6 md:left-8 md:right-8 bg-white/90 backdrop-blur-sm p-3 rounded-md shadow-2xl transition-all duration-700 delay-100 border-t border-white/50 ${
                  activeIndex === index ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}>
                  <div className="">
                    
                    <div className="w-full">
                      <div className="flex items-center space-x-1 mb-1.5">
                        <FiStar className="fill-[#007074] text-[#007074] w-3.5 h-3.5" />
                        <span className="text-sm font-bold text-[#222222]">{product.rating}</span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2 pr-4">
                        {product.description}
                      </p>
                      <span className="text-lg font-bold text-[#007074]">
                        Rs. {product.price.toLocaleString()}
                      </span>
                    </div>

                    <button className="flex items-center justify-center gap-2 mt-3 cursor-pointer bg-[#007074] border border-[#007074] text-white px-4 hover:transform hover:scale-105 shadow-lg py-2 rounded-md hover:text-white text-sm uppercase font-semibold text-[12px] transition-all duration-300 active:scale-95">
                      <FiShoppingBag size={18} />
                      <span>Add to Cart</span>
                    </button>
                    
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}