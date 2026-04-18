import React, { useEffect, useMemo, useState } from 'react';
import { FiHeart, FiChevronLeft, FiChevronRight, FiShoppingCart } from 'react-icons/fi';
import { FaStar, FaShoppingBag } from 'react-icons/fa';
import { Link } from 'react-router-dom';

export default function FeaturedProducts() {
  const [wishlist, setWishlist] = useState([]);
  const [desktopPage, setDesktopPage] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [isMobileView, setIsMobileView] = useState(false);

  const featuredProducts = [
    {
      id: 1,
      name: 'Midnight Elegance Maxi Dress',
      brand: 'Stylogist Couture',
      shortDesc: 'Pure silk with a tailored silhouette',
      originalPrice: 12999,
      salePrice: 8999,
      rating: 4.8,
      image: 'https://plus.unsplash.com/premium_photo-1661632739714-4b25476dbc17?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      isNew: true,
    },
    {
      id: 2,
      name: 'Minimalist Ceramic Watch',
      brand: 'Nordic Time',
      shortDesc: 'Japanese movement, scratch-proof ceramic',
      originalPrice: 5999,
      salePrice: 3999,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop',
      isNew: false,
    },
    {
      id: 3,
      name: 'Radiance Vitamin C Serum',
      brand: 'Glow Botanica',
      shortDesc: 'Advanced formula for a natural glow',
      originalPrice: 4500,
      salePrice: 3200,
      rating: 5.0,
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=1974&auto=format&fit=crop',
      isNew: true,
    },
    {
      id: 4,
      name: 'Gold Minimalist Hoop Earrings',
      brand: 'Accessories Co.',
      shortDesc: '18k gold plated, hypoallergenic',
      originalPrice: 3499,
      salePrice: 1999,
      rating: 4.3,
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1974&auto=format&fit=crop',
      isNew: false,
    },
  ];

  const productsPerPage = 4;
  const totalDesktopPages = Math.ceil(featuredProducts.length / productsPerPage);

  const displayedDesktopProducts = useMemo(() => {
    return featuredProducts.slice(
      desktopPage * productsPerPage,
      (desktopPage + 1) * productsPerPage
    );
  }, [desktopPage, featuredProducts]);

  useEffect(() => {
    const checkScreen = () => setIsMobileView(window.innerWidth < 1024);
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  const toggleWishlist = (productId) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const ProductCard = ({ product, index }) => (
    <div
      className="group flex flex-col relative w-full animate-[slideUp_0.5s_ease-out_forwards]"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Framed Image Container */}
      <div className="relative aspect-[6/4] sm:aspect-[3/4] sm:rounded-[2rem] bg-white border border-gray-100 p-2 shadow-sm transition-all duration-500 group-hover:shadow-xl group-hover:-translate-y-1 overflow-hidden">
        <div className="w-full h-full bg-[#F7F3F0] rounded-md sm:rounded-[1.5rem] overflow-hidden relative">
          <Link to={`/product/${product.id}`} className="block w-full h-full">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-110"
            />
          </Link>

          {/* New Arrival Badge */}
          {product.isNew && (
            <div className="absolute top-3 left-3 bg-[#007074] text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-md z-10">
              New
            </div>
          )}

          {/* Floating Actions */}
          <button
            onClick={() => toggleWishlist(product.id)}
            aria-label={wishlist.includes(product.id) ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/90 backdrop-blur-md shadow-sm transition-all hover:scale-110"
          >
            <FiHeart
              aria-hidden="true"
              size={16}
              className={wishlist.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-500'}
            />
          </button>

          {/* Quick Add Bar */}
          <div className="absolute bottom-3 left-3 right-3 translate-y-12 group-hover:translate-y-0 transition-all duration-500 z-20">
            <button className="w-full bg-[#222]/95 backdrop-blur-md text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2 hover:bg-[#007074] shadow-xl">
              <FiShoppingCart size={14} /> Quick Add
            </button>
          </div>
        </div>
      </div>

      {/* Product Information */}
      <div className="mt-5 px-1 text-center">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1 block">
          {product.brand}
        </span>
        <Link to={`/product/${product.id}`}>
          <h3 className="text-[14px] font-bold text-[#222] hover:text-[#007074] transition-colors leading-tight line-clamp-1 mb-2">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-center gap-3">
          <span className="text-[15px] font-black text-[#007074]">
            Rs. {product.salePrice.toLocaleString()}
          </span>
          <span className="text-[12px] text-gray-300 line-through font-bold">
            Rs. {product.originalPrice.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-center items-center gap-0.5 mt-2.5">
           {[...Array(5)].map((_, i) => (
             <FaStar key={i} className={`w-2.5 h-2.5 ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-100'}`} />
           ))}
        </div>
      </div>
    </div>
  );

  return (
    <section className="w-full bg-[#FDFDFD] py-10 overflow-hidden relative">
      {/* Premium Background Accent */}
      <div className="absolute top-0 left-0 w-full h-full bg-[#F7F3F0]/30 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10 max-w-6xl">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-10 gap-8">
          <div className="text-center md:text-left">
            <div className="inline-block bg-[#007074]/10 text-[#007074] text-[10px] font-black px-3 py-1 rounded-full mb-4 uppercase tracking-[0.2em]">
              Curated Selection
            </div>
            <h2 className="text-2xl md:text-5xl font-serif font-black text-[#222] tracking-tight">
              Featured <span className="italic text-[#007074]">Collection</span>
            </h2>
            <p className="text-gray-500 mt-2 sm:mt-5 max-w-lg text-sm sm:leading-relaxed sm:uppercase tracking-wide font-medium">
              Handpicked arrivals designed to elevate your everyday ritual.
            </p>
          </div>

          <div className="sm:flex hidden items-center justify-center space-x-3">
            <button
              onClick={() => setDesktopPage((prev) => (prev === 0 ? totalDesktopPages - 1 : prev - 1))}
              aria-label="Previous featured products"
              className="w-12 h-12 flex items-center justify-center cursor-pointer rounded-full border border-gray-100 bg-white text-[#222] hover:bg-[#222] hover:text-white transition-all duration-500 shadow-sm hover:shadow-xl"
            >
              <FiChevronLeft aria-hidden="true" size={20} />
            </button>
            <button
              onClick={() => setDesktopPage((prev) => (prev === totalDesktopPages - 1 ? 0 : prev + 1))}
              aria-label="Next featured products"
              className="w-12 h-12 flex items-center justify-center cursor-pointer rounded-full border border-gray-100 bg-white text-[#222] hover:bg-[#222] hover:text-white transition-all duration-500 shadow-sm hover:shadow-xl"
            >
              <FiChevronRight aria-hidden="true" size={20} />
            </button>
          </div>
        </div>

        {/* Desktop Grid */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-4 gap-8">
            {displayedDesktopProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden">
          <div className="max-w-[280px] mx-auto transition-all duration-700">
             <ProductCard product={featuredProducts[mobileIndex]} index={0} />
          </div>
          <div className="flex items-center justify-center gap-3 mt-6">
            {featuredProducts.map((_, index) => (
              <button
                key={index}
                onClick={() => setMobileIndex(index)}
                aria-label={`Show featured product ${index + 1}`}
                aria-current={index === mobileIndex ? 'true' : 'false'}
                className={`h-1 rounded-full transition-all duration-500 ${
                  index === mobileIndex ? 'w-10 bg-[#007074]' : 'w-4 bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-8">
          <Link
            to="/category"
            className="inline-flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-[#222] hover:text-[#007074] transition-all group"
          >
            Explore All Products
            <div className="w-10 h-[1px] bg-gray-200 group-hover:w-16 group-hover:bg-[#007074] transition-all duration-500" />
            <FiChevronRight className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}