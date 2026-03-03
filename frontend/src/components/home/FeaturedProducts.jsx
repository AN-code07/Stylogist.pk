import React, { useState, useRef, useEffect } from 'react';
import { FiHeart, FiShoppingBag, FiEye, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { FaStar, FaStarHalfAlt, FaRegStar, FaShoppingBag } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import ComonButton from '../../commonpages/ComonButton';

export default function FeaturedProducts() {
    const [hoveredProduct, setHoveredProduct] = useState(null);
    const [wishlist, setWishlist] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [slideDirection, setSlideDirection] = useState('next');

    // Data array remains the same
    const featuredProducts = [
        {
            id: 1, name: "Premium Leather Jacket", brand: "Urban Luxe", shortDesc: "Genuine leather with quilted lining",
            originalPrice: 12999, salePrice: 8999, rating: 4.5, reviews: 128,
            image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1935&auto=format&fit=crop",
            isNew: true, // Set to true to test badge
        },
        {
            id: 2, name: "Minimalist Ceramic Watch", brand: "Nordic Time", shortDesc: "Japanese movement, scratch-proof ceramic",
            originalPrice: 5999, salePrice: 3999, rating: 4.8, reviews: 256,
            image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=1976&auto=format&fit=crop",
            isNew: false,
        },
        {
            id: 3, name: "Handcrafted Leather Tote", brand: "Artisan Collection", shortDesc: "Full-grain leather, hand-stitched details",
            originalPrice: 8499, salePrice: 6499, rating: 4.7, reviews: 89,
            image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2069&auto=format&fit=crop",
            isNew: true,
        },
        {
            id: 4, name: "Aviator Sunglasses", brand: "Vista Optics", shortDesc: "Polarized lenses, UV400 protection",
            originalPrice: 3499, salePrice: 1999, rating: 4.3, reviews: 312,
            image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=2080&auto=format&fit=crop",
            isNew: false,
        },
        {
            id: 5, name: "Cashmere Blend Sweater", brand: "Cozy Luxe", shortDesc: "Ultra-soft cashmere blend, ribbed cuffs",
            originalPrice: 6999, salePrice: 4999, rating: 4.9, reviews: 67,
            image: "https://images.unsplash.com/photo-1576565418020-518393b4aa5f?q=80&w=1964&auto=format&fit=crop",
            isNew: true,
        },
        {
            id: 6, name: "Slim Fit Denim Jeans", brand: "Street Culture", shortDesc: "Stretch denim, vintage wash",
            originalPrice: 4499, salePrice: 2999, rating: 4.6, reviews: 445,
            image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1974&auto=format&fit=crop",
            isNew: false,
        }
    ];

    const productsPerPage = 4;
    const totalPages = Math.ceil(featuredProducts.length / productsPerPage);
    const displayedProducts = featuredProducts.slice(
        currentPage * productsPerPage,
        (currentPage + 1) * productsPerPage
    );

    // Improved Animation Logic
    const handlePrevPage = () => {
        if (isAnimating) return;
        setSlideDirection('prev');
        setIsAnimating(true);
        setTimeout(() => {
            setCurrentPage((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
            setIsAnimating(false);
        }, 400); // 400ms CSS transition match
    };

    const handleNextPage = () => {
        if (isAnimating) return;
        setSlideDirection('next');
        setIsAnimating(true);
        setTimeout(() => {
            setCurrentPage((prev) => (prev === totalPages - 1 ? 0 : prev + 1));
            setIsAnimating(false);
        }, 400);
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
                {[...Array(fullStars)].map((_, i) => <FaStar key={`full-${i}`} className="text-yellow-400 w-3.5 h-3.5" />)}
                {halfStar && <FaStarHalfAlt className="text-yellow-400 w-3.5 h-3.5" />}
                {[...Array(emptyStars)].map((_, i) => <FaRegStar key={`empty-${i}`} className="text-yellow-300 w-3.5 h-3.5" />)}
            </div>
        );
    };

    return (
        <section className="w-full bg-[#F7F3F0] py-10 overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
                    <div className="relative">
                        <h2 className="text-3xl md:text-5xl font-bold text-[#222222] font-serif">
                            Featured <span className="text-[#007074]">Collection</span>
                        </h2>
                        <div className="h-1.5 w-20 bg-[#007074] mt-4 rounded-full"></div>
                        <p className="text-[#666666] mt-4 max-w-xl text-lg">
                            Curated picks from our latest arrivals, handpicked for your style journey.
                        </p>
                    </div>

                    {/* Navigation Controls */}
                    <div className="flex items-center space-x-3 mt-6 md:mt-0">
                        <button
                            onClick={handlePrevPage}
                            className="p-2 cursor-pointer rounded-full border border-[#D0B9A7] bg-white text-[#007074] hover:bg-[#007074] hover:text-white hover:border-[#007074] transition-all duration-300 shadow-sm hover:shadow-lg"
                        >
                            <FiChevronLeft size={22} />
                        </button>
                        <button
                            onClick={handleNextPage}
                            className="p-2 cursor-pointer rounded-full border border-[#D0B9A7] bg-white text-[#007074] hover:bg-[#007074] hover:text-white hover:border-[#007074] transition-all duration-300 shadow-sm hover:shadow-lg"
                        >
                            <FiChevronRight size={22} />
                        </button>
                    </div>
                </div>

                {/* Product Slider Container */}
                <div className="relative overflow-hidden py-4">
                    <div
                        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 transition-transform duration-400 ease-in-out ${isAnimating
                                ? slideDirection === 'next' ? '-translate-x-full opacity-0' : 'translate-x-full opacity-0'
                                : 'translate-x-0 opacity-100'
                            }`}
                    >
                        {displayedProducts.map((product) => (
                            <div
                                key={product.id}
                                className="group relative bg-white rounded-md overflow-hidden shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(0,112,116,0.2)] transition-all duration-500 border border-[#E9DBD1]"
                                onMouseEnter={() => setHoveredProduct(product.id)}
                                onMouseLeave={() => setHoveredProduct(null)}
                            >
                                {/* Product Image Section (Fixed Height & Aspect Ratio) */}
                                <div className="relative h-[200px] w-full overflow-hidden bg-blue-400">
                                    {/* NEW BADGE - Fixed Position */}
                                    {product.isNew && (
                                        <div className="absolute top-4 left-4 z-20 bg-[#007074] text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide shadow-md">
                                            New Arrival
                                        </div>
                                    )}

                                    {/* Wishlist Heart */}
                                    <button
                                        onClick={() => toggleWishlist(product.id)}
                                        className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition-transform hover:scale-110"
                                    >
                                        <FiHeart
                                            size={20}
                                            className={wishlist.includes(product.id) ? 'fill-[#007074] text-[#007074]' : 'text-gray-600 hover:text-[#007074]'}
                                        />
                                    </button>

                                    {/* Main Image */}
                                    <div className='h-full w-full'>
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    </div>

                                 
                                </div>

                                {/* Product Info Section */}
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-2">

                                        <p className="text-[10px] text-[#007074] font-bold uppercase tracking-widest">
                                            
                                        <RatingStars  rating={product.rating} />
                                        </p>
                                    </div>

                                    <h3 className="text-xl font-bold text-[#222222] mb-1 line-clamp-1 group-hover:text-[#007074] transition-colors">
                                        {product.name}
                                    </h3>

                                    <p className="text-sm text-gray-500 mb-4 line-clamp-1">
                                        {product.shortDesc}
                                    </p>

                                    <div className="flex items-end justify-between space-x-3 mb-6">
                                        <span className="text-lg font-bold text-[#007074]">
                                            Rs. {product.salePrice.toLocaleString()}
                                        </span>
                                        <span className="text-sm text-gray-400 line-through mb-1">
                                            Rs. {product.originalPrice.toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Call to Action via Common Button */}
                                    <ComonButton padding="px-4 py-2" btntitle="Add to Cart" icon={<FaShoppingBag size={18} />} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* View All Link */}
                <div className="text-center mt-7">
                    <Link
                        to="/shop"
                        className="inline-flex items-center space-x-2 text-lg text-[#007074] font-bold hover:text-[#007074] transition-colors group"
                    >
                        <span className="border-b-2 border-transparent group-hover:border-[#007074]">View Entire Collection</span>
                        <FiChevronRight className="group-hover:translate-x-2 transition-transform" />
                    </Link>
                </div>
            </div>
        </section>
    );
}