import React, { useEffect, useState } from "react";
import { FiShoppingBag, FiClock, FiStar, FiArrowRight } from "react-icons/fi";
import { Link } from "react-router-dom";

export default function DealsOfDay() {
    // Multiple products across different categories
    const deals = [
        {
            id: 501,
            name: "Designer Leather Handbag",
            category: "Accessories",
            originalPrice: 18500,
            salePrice: 12999,
            rating: 4.9,
            totalStock: 150,
            soldStock: 132,
            image: "https://img.freepik.com/free-photo/girl-coat_1303-4435.jpg?ga=GA1.1.2142144714.1772005373&semt=ais_hybrid&w=740&q=80",
        },
        {
            id: 502,
            name: "Onyx Chronograph Watch",
            category: "Men's Watches",
            originalPrice: 24000,
            salePrice: 14500,
            rating: 4.8,
            totalStock: 80,
            soldStock: 65,
            image: "https://img.freepik.com/free-photo/friends-going-hiking-winter_23-2150198170.jpg?ga=GA1.1.2142144714.1772005373&semt=ais_hybrid&w=740&q=80",
        },
        {
            id: 503,
            name: "Silk Evening Gown",
            category: "Women's Apparel",
            originalPrice: 22000,
            salePrice: 15400,
            rating: 5.0,
            totalStock: 45,
            soldStock: 39,
            image: "https://img.freepik.com/premium-photo/red-dress-from-red-dress-company_916191-4766.jpg?ga=GA1.1.2142144714.1772005373&semt=ais_hybrid&w=740&q=80",
        },
        {
            id: 504,
            name: "Suede Chelsea Boots",
            category: "Footwear",
            originalPrice: 11500,
            salePrice: 7900,
            rating: 4.7,
            totalStock: 120,
            soldStock: 85,
            image: "https://img.freepik.com/free-photo/young-woman-white-jacket-holding-hat_1303-24750.jpg?ga=GA1.1.2142144714.1772005373&semt=ais_hybrid&w=740&q=80",
        }
    ];

    // Global Countdown logic for the entire Deals section
    const [timeLeft, setTimeLeft] = useState(43200); // 12 hours in seconds

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return {
            hrs: String(hrs).padStart(2, "0"),
            mins: String(mins).padStart(2, "0"),
            secs: String(secs).padStart(2, "0"),
        };
    };

    const { hrs, mins, secs } = formatTime(timeLeft);

    return (
        <section className="relative bg-[#cfa34217] py-10 px-4 sm:px-6 lg:px-8 overflow-hidden">
            {/* Subtle Background Glow */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#007074]/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-10 w-72 h-72 bg-[#007074]/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative z-10">

                {/* HEADER & GLOBAL TIMER */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 border-b border-[#007074]/30 pb-8 gap-8">
                    <div>
                        <span className="sm:inline-flex hidden  items-center gap-2 text-[#007074] text-xs font-bold tracking-widest uppercase mb-3 bg-[#007074]/0 px-3 py-1.5 rounded-md border border-[#007074]/20">
                            <FiClock className="animate-pulse" />
                            Flash Sale
                        </span>
                        <h2 className="text-xl md:text-3xl font-bold font-serif text-black leading-tight">
                            Deals of the <span className="text-[#007074]">Day</span>
                        </h2>
                        <p className="text-gray-400 sm:mt-3 mt-4 text-sm md:text-base max-w-lg">
                            Exceptional discounts across all premium categories. These offers vanish when the timer hits zero.
                        </p>
                    </div>

                    {/* Sleek Global Timer */}
                    <div className="sm:flex absolute top-0 right-0   items-end gap-3">

                        {/* Desktop Timer */}
                        <div className="hidden sm:flex flex-col items-center gap-2">
                            <div className="text-right mr-2">
                                <p className="text-black font-bold tracking-wider">Offer Ends In</p>
                            </div>
                            <div className="flex ">
                                {[
                                    { value: hrs, label: "HRS" },
                                    { value: mins, label: "MIN" },
                                    { value: secs, label: "SEC" }
                                ].map((unit, index) => (
                                    <div key={index} className="text-center px-1">
                                        <div className="bg-[#1a1a1a] border border-gray-700 w-10 h-10 flex items-center justify-center rounded-md shadow-lg">
                                            <span className="text-xl font-bold text-white font-mono">
                                                {unit.value}
                                            </span>
                                        </div>
                                        <span className="text-[10px] uppercase tracking-widest text-gray-500 mt-1.5">
                                            {unit.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Mobile Timer Button */}
                        <div className="sm:hidden">
                            <button className="flex items-center gap-2 bg-[#007074] text-white px-4 py-2 rounded-md text-sm font-semibold shadow-md">
                                <FiClock />
                                {hrs}:{mins}:{secs}
                            </button>
                        </div>

                    </div>
                </div>

                {/* PRODUCTS GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {deals.map((product) => {
                        const discount = Math.round(((product.originalPrice - product.salePrice) / product.originalPrice) * 100);
                        const stockPercentage = (product.soldStock / product.totalStock) * 100;
                        const isLowStock = stockPercentage > 85; // If 85% is sold, it's low stock

                        return (
                            <div key={product.id} className="bg-white rounded-md shadow shadow-md  group overflow-hidden flex flex-col hover:border-[#007074]/50 transition-colors duration-300">

                                {/* Image Container */}
                                <div className="relative h-[200px] overflow-hidden">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700  border-b-1 border-white"
                                    />
                                    {/* Formal Discount Badge */}
                                    <div className="absolute top-4 right-4 bg-red-500 text-white h-6 w-10 rounded text-center shadow-lg">
                                        <span className="text-xs font-bold tracking-widest uppercase"> {discount}%</span>
                                    </div>
                                </div>

                                {/* Content Container */}
                                <div className="p-5 flex flex-col flex-1">

                                    {/* Category & Rating */}
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[9px] font-bold tracking-widest uppercase text-[#007074]">{product.category}</span>
                                        <div className="flex items-center gap-1">
                                            <FiStar className="fill-yellow-400 text-yellow-400 w-2 h-3" />
                                            <span className="text-[9px] font-bold text-[#007074]">{product.rating}</span>
                                        </div>
                                    </div>

                                    <h3 className="text-md font-bold text-black mb-4 line-clamp-1 transition-colors">
                                        {product.name}
                                    </h3>

                                    {/* Pricing */}
                                    <div className="flex items-end justify-between gap-3 mb-5">
                                        <span className="text-sm font-bold text-[#007074]">
                                            Rs. {product.salePrice.toLocaleString()}
                                        </span>
                                        <span className="text-sm line-through text-gray-600 mb-0.5">
                                            Rs. {product.originalPrice.toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Spacer to push stock/button to bottom if titles vary in height */}
                                    <div className="mt-auto"></div>

                                    {/* Add to Cart Button */}
                                    <Link
                                        to={`/product/${product.id}`}
                                        className="flex items-center justify-center gap-2 w-full bg-[#007074] border border-[#007074] text-white px-4 hover:transform hover:scale-105 shadow-lg py-2 rounded-md hover:text-white text-sm uppercase font-semibold text-[12px]   transition-all duration-300 active:scale-95"
                                    >
                                        <FiShoppingBag />
                                        <span>Add to Cart</span>
                                    </Link>

                                </div>
                            </div>
                        );
                    })}
                </div>


            </div>
        </section>
    );
}