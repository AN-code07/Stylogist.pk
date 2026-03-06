import React, { useEffect, useMemo, useState } from 'react';
import { FiHeart, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { FaStar, FaStarHalfAlt, FaRegStar, FaShoppingBag } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import ComonButton from '../../commonpages/ComonButton';

export default function FeaturedProducts() {
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [desktopPage, setDesktopPage] = useState(0);

  const [mobileIndex, setMobileIndex] = useState(0);
  const [isMobileView, setIsMobileView] = useState(false);

  const featuredProducts = [
    {
      id: 1,
      name: 'Premium Leather Jacket',
      brand: 'Urban Luxe',
      shortDesc: 'Genuine leather with quilted lining',
      originalPrice: 12999,
      salePrice: 8999,
      rating: 4.5,
      reviews: 128,
      image:
        'https://img.freepik.com/free-photo/young-handsome-man-walking-down-street_1303-24594.jpg?ga=GA1.1.2142144714.1772005373&semt=ais_hybrid&w=740&q=80',
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
      reviews: 256,
      image:
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop',
      isNew: false,
    },
    {
      id: 3,
      name: 'Handcrafted Leather Tote',
      brand: 'Artisan Collection',
      shortDesc: 'Full-grain leather, hand-stitched details',
      originalPrice: 8499,
      salePrice: 6499,
      rating: 4.7,
      reviews: 89,
      image:
        'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=1938&auto=format&fit=crop',
      isNew: true,
    },
    {
      id: 4,
      name: 'Aviator Sunglasses',
      brand: 'Vista Optics',
      shortDesc: 'Polarized lenses, UV400 protection',
      originalPrice: 3499,
      salePrice: 1999,
      rating: 4.3,
      reviews: 312,
      image:
        'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=2080&auto=format&fit=crop',
      isNew: false,
    },
    {
      id: 5,
      name: 'Cashmere Blend Sweater',
      brand: 'Cozy Luxe',
      shortDesc: 'Ultra-soft cashmere blend, ribbed cuffs',
      originalPrice: 6999,
      salePrice: 4999,
      rating: 4.9,
      reviews: 67,
      image:
        'https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?q=80&w=1972&auto=format&fit=crop',
      isNew: true,
    },
    {
      id: 6,
      name: 'Slim Fit Denim Jeans',
      brand: 'Street Culture',
      shortDesc: 'Stretch denim, vintage wash',
      originalPrice: 4499,
      salePrice: 2999,
      rating: 4.6,
      reviews: 445,
      image:
        'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1926&auto=format&fit=crop',
      isNew: false,
    },
    {
      id: 7,
      name: 'Classic White Sneakers',
      brand: 'Urban Step',
      shortDesc: 'Breathable mesh, all-day comfort sole',
      originalPrice: 5499,
      salePrice: 4299,
      rating: 4.8,
      reviews: 156,
      image:
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=2012&auto=format&fit=crop',
      isNew: true,
    },
    {
      id: 8,
      name: 'Oxford Formal Shoes',
      brand: 'Heritage Walk',
      shortDesc: 'Premium calf leather, lace-up closure',
      originalPrice: 9499,
      salePrice: 7999,
      rating: 4.7,
      reviews: 92,
      image:
        'https://img.freepik.com/free-photo/red-leather-shoes-stand-light-wooden-floor_8353-691.jpg?ga=GA1.1.2142144714.1772005373&semt=ais_hybrid&w=740&q=80',
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
    const checkScreen = () => {
      setIsMobileView(window.innerWidth < 1024);
    };

    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  useEffect(() => {
    if (!isMobileView) return;

    const interval = setInterval(() => {
      setMobileIndex((prev) => (prev + 1) % featuredProducts.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isMobileView, featuredProducts.length]);

  const handlePrevDesktopPage = () => {
    setDesktopPage((prev) => (prev === 0 ? totalDesktopPages - 1 : prev - 1));
  };

  const handleNextDesktopPage = () => {
    setDesktopPage((prev) => (prev === totalDesktopPages - 1 ? 0 : prev + 1));
  };

  const handlePrevMobile = () => {
    setMobileIndex((prev) => (prev === 0 ? featuredProducts.length - 1 : prev - 1));
  };

  const handleNextMobile = () => {
    setMobileIndex((prev) => (prev === featuredProducts.length - 1 ? 0 : prev + 1));
  };

  const toggleWishlist = (productId) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const RatingStars = ({ rating }) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <div className="flex items-center space-x-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <FaStar key={`full-${i}`} className="text-yellow-400 w-3.5 h-3.5" />
        ))}
        {halfStar && <FaStarHalfAlt className="text-yellow-400 w-3.5 h-3.5" />}
        {[...Array(emptyStars)].map((_, i) => (
          <FaRegStar key={`empty-${i}`} className="text-yellow-300 w-3.5 h-3.5" />
        ))}
      </div>
    );
  };

  const ProductCard = ({ product }) => (
    <div
      className="group relative bg-white rounded-md overflow-hidden shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(0,112,116,0.2)] transition-all duration-500 border border-[#E9DBD1]"
      onMouseEnter={() => setHoveredProduct(product.id)}
      onMouseLeave={() => setHoveredProduct(null)}
    >
      <div className="relative h-[160px] sm:h-[170px] w-full overflow-hidden bg-[#eaf4f4]">
        {product.isNew && (
          <div className="absolute top-4 left-4 z-20 bg-[#007074] text-white text-xs  px-3 py-1.5 rounded-full uppercase tracking-wide shadow-md">
            New Arrival
          </div>
        )}

        <button
          onClick={() => toggleWishlist(product.id)}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition-transform hover:scale-110"
        >
          <FiHeart
            size={20}
            className={
              wishlist.includes(product.id)
                ? 'fill-[#007074] text-[#007074]'
                : 'text-gray-600 hover:text-[#007074]'
            }
          />
        </button>

         <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
        />
      </div>

      <div className="p-5 sm:p-6">
        <div className="mb-3">
          <RatingStars rating={product.rating} />
        </div>

        <h3 className="text-md font-bold text-black mb-2 line-clamp-1 transition-colors">
          {product.name}
        </h3>

        <p className="text-sm text-gray-500 mb-2 ">
          {product.shortDesc}
        </p>

        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <span className="text-base sm:text-lg font-bold text-[#007074]">
            Rs. {product.salePrice.toLocaleString()}
          </span>
          <span className="text-sm text-gray-400 line-through">
            Rs. {product.originalPrice.toLocaleString()}
          </span>
        </div>

        <button className="flex items-center justify-center gap-2 w-full bg-[#007074] border border-[#007074] text-white px-4 hover:transform hover:scale-105 shadow-lg py-2 rounded-md hover:text-white text-sm uppercase font-semibold text-[12px] transition-all duration-300 active:scale-95 cursor-pointer">
          Add to Cart
          <FaShoppingBag className="inline-block ml-2" />
        </button>
      </div>
    </div>
  );

  return (
    <section className="w-full bg-[#F7F3F0] py-10 md:py-14 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-12 gap-6">
          <div className="relative">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#222222] font-serif">
              Featured <span className="text-[#007074]">Collection</span>
            </h2>
            <div className="h-1.5 w-20 bg-[#007074] mt-4 rounded-full"></div>
            <p className="text-[#666666] mt-4 max-w-xl text-sm sm:text-base lg:text-lg">
              Curated picks from our latest arrivals, handpicked for your style journey.
            </p>
          </div>

          <div className="sm:flex items-center space-x-3  hidden">
            <button
              onClick={isMobileView ? handlePrevMobile : handlePrevDesktopPage}
              className="p-2 cursor-pointer rounded-full border border-[#D0B9A7] bg-white text-[#007074] hover:bg-[#007074] hover:text-white hover:border-[#007074] transition-all duration-300 shadow-sm hover:shadow-lg"
            >
              <FiChevronLeft size={22} />
            </button>
            <button
              onClick={isMobileView ? handleNextMobile : handleNextDesktopPage}
              className="p-2 cursor-pointer rounded-full border border-[#D0B9A7] bg-white text-[#007074] hover:bg-[#007074] hover:text-white hover:border-[#007074] transition-all duration-300 shadow-sm hover:shadow-lg"
            >
              <FiChevronRight size={22} />
            </button>
          </div>
        </div>

        <div className="hidden lg:block relative overflow-hidden py-4">
          <div className="grid grid-cols-4 gap-8">
            {displayedDesktopProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        <div className="lg:hidden relative py-4">
          <div className="max-w-sm sm:max-w-md mx-auto">
            <div className="transition-all duration-500 ease-in-out">
              <ProductCard product={featuredProducts[mobileIndex]} />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mt-6">
            {featuredProducts.map((_, index) => (
              <button
                key={index}
                onClick={() => setMobileIndex(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${index === mobileIndex ? 'w-8 bg-[#007074]' : 'w-2.5 bg-[#c7d9d9]'
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="text-center mt-7">
          <Link
            to="/category"
            className="inline-flex items-center space-x-2 text-base sm:text-lg text-[#007074] font-bold transition-colors group"
          >
            <span className="border-b-2 border-transparent group-hover:border-[#007074]">
              View more Category
            </span>
            <FiChevronRight className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}