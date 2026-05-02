import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight, FiHome, FiShoppingBag } from "react-icons/fi";

export default function PageNotFound() {
  const navigate = useNavigate();

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center bg-[#F7F3F0] px-6 overflow-hidden">

      {/* Background big 404 */}
      <div className="absolute text-[160px] md:text-[280px] font-black text-[#e7f3f3] select-none pointer-events-none">
        404
      </div>

      <div className="relative z-10 max-w-5xl text-center">

        {/* Heading */}
        <h1 className="text-4xl md:text-6xl font-serif font-black text-[#222222] mb-6">
          Oops! Page <span className="text-[#007074]">Not Found</span>
        </h1>

        {/* Description */}
        <p className="text-gray-600 text-lg max-w-xl mx-auto mb-10">
          The page you’re looking for might have been removed, renamed,
          or is temporarily unavailable. Let’s get you back to shopping.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">

          {/* Continue Shopping */}
          <Link
            to="/products"
            className="flex items-center justify-center gap-2 bg-[#007074] text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-[#005d60] transition-all duration-300 shadow-lg"
          >
            <FiShoppingBag />
            Continue Shopping
            <FiArrowRight />
          </Link>

          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 border-2 border-[#222222] text-[#222222] px-8 py-4 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-[#222222] hover:text-white transition-all duration-300"
          >
            Go Back
          </button>

          {/* Home */}
          <Link
            to="/"
            className="flex items-center justify-center gap-2 border-2 border-[#007074] text-[#007074] px-8 py-4 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-[#007074] hover:text-white transition-all duration-300"
          >
            <FiHome />
            Home
          </Link>

        </div>

      </div>
    </section>
  );
}