import React, { useState, useEffect } from 'react';
import { FiArrowRight, FiShoppingBag, FiStar, FiChevronRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function NewArrivals() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Updated Data with Stylogist Branding
  const newArrivals = [
    {
      id: 201,
      name: "Midnight Silk Wrap Dress",
      brand: "Stylogist Couture",
      category: "Women's Apparel",
      price: 14500,
      rating: 5.0,
      image: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=1974&auto=format&fit=crop",
      description: "Fluid silk satin that drapes beautifully, featuring a modern cowl neckline."
    },
    {
      id: 202,
      name: "Radiance Vitamin C Serum",
      brand: "Stylogist Beauty",
      category: "Skincare",
      price: 3200,
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=1974&auto=format&fit=crop",
      description: "Advanced formula for a natural glow, packed with premium antioxidants."
    },
    {
      id: 203,
      name: "Classic Oxford Cotton Shirt",
      brand: "Stylogist Men",
      category: "Men's Apparel",
      price: 4500,
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1976&auto=format&fit=crop",
      description: "A timeless classic tailored from a premium water-resistant cotton blend."
    },
    {
      id: 204,
      name: "Gold Minimalist Hoop Earrings",
      brand: "Accessories Co.",
      category: "Accessories",
      price: 1999,
      rating: 4.7,
      image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1974&auto=format&fit=crop",
      description: "18k gold plated, hypoallergenic design for everyday minimalist elegance."
    }
  ];

  useEffect(() => {
    let interval;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setActiveIndex((prevIndex) => (prevIndex + 1) % newArrivals.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, newArrivals.length]);

  const handleItemClick = (index) => {
    setActiveIndex(index);
    setIsAutoPlaying(false);
  };

  return (
    <section className="w-full bg-white py-10 overflow-hidden">
      <div className="container mx-auto px-6 max-w-6xl">

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-12 lg:gap-16 items-center">

          {/* LEFT SIDE: CONTENT & INTERACTIVE MENU (5 Columns) */}
          <div className="md:col-span-5 flex flex-col justify-center">
            {/* Header */}
            <div className="mb-12">
              <div className="inline-block bg-[#007074]/10 text-[#007074] text-[10px] font-black px-3 py-1 rounded-full mb-4 uppercase tracking-[0.2em]">
                Fresh Drops
              </div>
              <h2 className="text-2xl sm:text-2xl lg:text-4xl font-serif font-black text-[#222] leading-tight tracking-tight">
                The <span className="italic text-[#007074]">New Editorials</span>
              </h2>
              <p className="text-gray-400 mt-6 text-sm sm:leading-relaxed sm:uppercase tracking-wide font-medium">
                Explore the latest additions to our premium collection, curated to elevate your everyday ritual.
              </p>
            </div>

            {/* Interactive Product List */}
            <div className="flex flex-col space-y-5 lg:space-y-8 relative border-l border-gray-100 pl-8 ml-1">
              {/* Animated active indicator line */}
              <div
                className="absolute left-[-1px] w-[2px] bg-[#007074] transition-all duration-700 h-[15%] sm:h-[5%] cubic-bezier(0.16, 1, 0.3, 1)"
                style={{
                  // height: '25%', 
                  top: `${activeIndex * 25}%`
                }}
              />

              {newArrivals.map((product, index) => (
                <div
                  key={product.id}
                  className="cursor-pointer group"
                  onClick={() => handleItemClick(index)}
                >
                  <p className={`text-[9px] font-black tracking-[0.2em] uppercase transition-colors duration-500 ${activeIndex === index ? 'text-[#007074]' : 'text-gray-300'
                    }`}>
                    {product.category}
                  </p>
                  <h3 className={`text-sm lg:text-lg mt-2 font-serif font-black transition-all duration-500 transform ${activeIndex === index ? 'text-[#222] translate-x-2' : 'text-gray-400 group-hover:text-gray-600'
                    }`}>
                    {product.name}
                  </h3>
                </div>
              ))}
            </div>


          </div>

          {/* RIGHT SIDE: CINEMATIC IMAGE SHOWCASE (7 Columns) */}
          <div className="md:col-span-7 relative h-[250px] md:h-[400px] rounded-md overflow-hidden shadow-2xl group border border-gray-100 p-2 bg-white">
            <div className="w-full h-full  sm:rounded-[2rem] overflow-hidden relative">
              {newArrivals.map((product, index) => (
                <div
                  key={`img-${product.id}`}
                  className={`absolute inset-0 w-full h-full transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) ${activeIndex === index ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-110 z-0 pointer-events-none'
                    }`}
                >
                  {/* Product Image */}
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full rounded-md object-cover transition-transform duration-1000 group-hover:scale-105"
                  />

                  {/* Gradient Overlay for content visibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Floating Glassmorphism Product Card */}
                  <div className={`absolute bottom-3 sm:bottom-8 left-8 right-8 bg-white/90 backdrop-blur-xl p-6 rounded-md sm:rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.3)] border border-white/50 transition-all duration-700 delay-200 ${activeIndex === index ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
                    }`}>
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FiStar className="fill-yellow-400 text-yellow-400 w-3 h-3" />
                          <span className="text-[10px] font-black text-[#222] tracking-widest">{product.rating} RATING</span>
                        </div>
                        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 pr-4 font-medium italic">
                          "{product.description}"
                        </p>
                      </div>

                      <div className="flex flex-col items-start lg:items-end shrink-0">
                        <span className="text-sm sm:text-xl font-serif font-black text-[#007074] mb-3">
                          Rs. {product.price.toLocaleString()}
                        </span>
                        <button className="flex items-center justify-center gap-2 bg-[#222] text-white py-1.5 px-4 sm:px-6 sm:py-2.5 rounded-full text-[10px] sm:font-black sm:uppercase tracking-[0.2em] hover:bg-[#007074] transition-all duration-300 shadow-lg active:scale-95">
                          <FiShoppingBag size={14} />
                          <span>Add to Cart</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
        {/* Global CTA */}
        <div className="mt-6 text-center mx-auto items-center justify-center lg:flex hidden sm:mt-12">
          <Link
            to="/products"
            className="inline-flex justify-center items-center sm:gap-3 text-[11px] sm:font-black uppercase tracking-[0.3em] text-[#222] hover:text-[#007074] transition-all group"
          >
            View Full Collection
            <div className="w-8 h-[1px] bg-gray-200 group-hover:w-12 group-hover:bg-[#007074] transition-all duration-500" />
            <FiChevronRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}