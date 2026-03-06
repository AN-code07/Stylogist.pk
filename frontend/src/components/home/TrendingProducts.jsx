import React, { useState } from 'react';
import { FiHeart, FiEye, FiTrendingUp, FiArrowRight } from 'react-icons/fi';
import { FaStar, FaStarHalfAlt, FaRegStar, FaShoppingBag } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import ComonButton from '../../commonpages/ComonButton';

export default function TrendingProducts() {
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [wishlist, setWishlist] = useState([]);

  // Sample trending products data (Top 4 for a solid row)
  const trendingProducts = [
    {
      id: 101,
      name: "Silk Satin Slip Dress",
      brand: "Elegance",
      shortDesc: "Luxurious pure silk, cowl neck",
      originalPrice: 15999,
      salePrice: 11999,
      rating: 4.9,
      reviews: 512,
      image: "https://img.freepik.com/free-photo/young-blond-lovely-woman-luxurious-red-dress-with-wide-sleeves-expressive-pose_273443-1758.jpg?ga=GA1.1.2142144714.1772005373&semt=ais_hybrid&w=740&q=80",
      isTrending: true,
    },
    {
      id: 102,
      name: "Oversized Wool Coat",
      brand: "Nordic Time",
      shortDesc: "Heavyweight wool blend, relaxed fit",
      originalPrice: 9499,
      salePrice: 7999,
      rating: 4.7,
      reviews: 340,
      image: "https://img.freepik.com/premium-photo/young-woman-standing-by-sea-against-sky-winter_1644752-20.jpg?ga=GA1.1.2142144714.1772005373&semt=ais_hybrid&w=740&q=80",
      isTrending: true,
    },
    {
      id: 103,
      name: "Classic Chelsea Boots",
      brand: "Urban Luxe",
      shortDesc: "Suede leather, elastic side panels",
      originalPrice: 8999,
      salePrice: 5999,
      rating: 4.6,
      reviews: 892,
      image: "https://img.freepik.com/free-photo/handsome-man-with-phone-bouquet-roses_158595-3618.jpg?t=st=1772777640~exp=1772781240~hmac=97d17ad1cbfe40eb1097a4e18197ba44024470aa61bc7f71ea6a38898f53c12d&w=1480",
      isTrending: true,
    },
    {
      id: 104,
      name: "Quilted Crossbody Bag",
      brand: "Artisan",
      shortDesc: "Gold-tone hardware, genuine leather",
      originalPrice: 5499,
      salePrice: 4299,
      rating: 4.8,
      reviews: 621,
      image: "https://img.freepik.com/free-photo/gorgeous-young-woman-wears-gray-skirt-coat-walking-down-street-early-evening-smiling_197531-6920.jpg?ga=GA1.1.2142144714.1772005373&semt=ais_hybrid&w=740&q=80",
      isTrending: true,
    }
  ];

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
        {[...Array(fullStars)].map((_, i) => <FaStar key={`full-${i}`} className="text-yellow-400 w-3 h-3" />)}
        {halfStar && <FaStarHalfAlt className="text-yellow-400 w-3 h-3" />}
        {[...Array(emptyStars)].map((_, i) => <FaRegStar key={`empty-${i}`} className="text-[#007074] w-3 h-3" />)}
      </div>
    );
  };

  return (
    <section className="w-full bg-[#F7F3F0] py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className=" py-1.5 px-4 rounded-md bg-[#007074]/0 text-[#007074] text-xs font-bold tracking-widest uppercase border border-[#007074]/20 flex items-center gap-2">
                Most Wanted
                <FiTrendingUp className="text-[#007074] w-4 h-4" />
              </span>
            </div>
            <h2 className="text-xl md:text-3xl font-bold text-[#222222] font-serif">
              Trending <span className="text-[#007074]">Right Now</span>
            </h2>
            <div className="h-1 w-20 bg-[#007074] mt-4 rounded-md"></div>
          </div>

          {/* View All Button */}
          <div className="mt-6 md:mt-0">
            <Link
              to="/category"
              className="group hidden sm:inline-flex items-center justify-center space-x-2 px-3 py-2 border border-[#007074] text-[#007074] font-semibold rounded-md hover:bg-[#007074] hover:text-white transition-all duration-300"
            >
              <span>Explore Trending</span>
              <FiArrowRight className="group-hover:translate-x-1.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Static Grid Layout for High Impact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {trendingProducts.map((product) => (
            <div
              key={product.id}
              className="group relative bg-white rounded-md overflow-hidden shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(0,112,116,0.2)] transition-all duration-500 border border-[#E9DBD1] flex flex-col"
              onMouseEnter={() => setHoveredProduct(product.id)}
              onMouseLeave={() => setHoveredProduct(null)}
            >
              {/* Product Image Section - Height exactly 200px */}
              <div className="relative h-[160px] sm:h-[170px] w-full overflow-hidden bg-gray-50 flex-shrink-0">

                {/* TRENDING BADGE */}
                {product.isTrending && (
                  <div className="absolute top-3 left-3 z-20 bg-[#007074] text-white text-[10px] font-bold px-3 py-1.5 rounded-md uppercase tracking-wide shadow-md flex items-center gap-1.5">
                    <FiTrendingUp size={12} /> Trending
                  </div>
                )}

                {/* Wishlist Heart */}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute top-3 right-3 z-20 p-2 rounded-md bg-white/90 backdrop-blur-sm shadow-sm transition-transform hover:scale-110"
                >
                  <FiHeart
                    size={16}
                    className={wishlist.includes(product.id) ? 'fill-[#007074] text-[#007074]' : 'text-gray-600 hover:text-[#007074]'}
                  />
                </button>

                {/* Main Image */}
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Hover Overlay Actions */}
                <div className="absolute inset-0 bg-[#007074]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 z-10 backdrop-blur-[1px]">

                </div>
              </div>

              {/* Product Info Section */}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    {product.brand}
                  </p>
                  <div className="flex items-center gap-1">
                    <RatingStars rating={product.rating} />
                    <span className="text-xs text-gray-400 ml-1">({product.reviews})</span>
                  </div>
                </div>

                <h3 className=" text-md font-bold text-black mb-4 line-clamp-1 transition-colors">
                  {product.name}
                </h3>

                <p className="text-sm text-gray-500 mb-4 line-clamp-1">
                  {product.shortDesc}
                </p>

                <div className="mt-auto">
                  <div className="flex justify-between items-end space-x-3 mb-3">
                    <span className="text-xl font-semibold text-[#007074]">
                      Rs. {product.salePrice.toLocaleString()}
                    </span>
                    {/* <span className="text-sm text-gray-400 line-through mb-0.5">
                      Rs. {product.originalPrice.toLocaleString()}
                    </span> */}
                  </div>

                  {/* Reusing your custom button */}
                  <button className=' flex items-center justify-center gap-2 w-full bg-[#007074] border border-[#007074] text-white px-4 hover:transform hover:scale-105 shadow-lg py-2 rounded-md hover:text-white text-sm uppercase font-semibold text-[12px] transition-all duration-300 active:scale-95 cursor-pointer'>
                    Add to cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}