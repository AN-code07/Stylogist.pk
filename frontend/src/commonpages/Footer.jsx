import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FiMail, 
  FiPhoneCall, 
  FiMapPin, 
  FiInstagram, 
  FiFacebook, 
  FiTwitter, 
  FiArrowRight 
} from 'react-icons/fi';

export default function Footer() {
  const shopLinks = [
    { name: "Women's Collection", path: "/category/women" },
    { name: "Men's Collection", path: "/category/men" },
    { name: "Luxury Accessories", path: "/category" },
    { name: "Premium Footwear", path: "/category" },
    // { name: "New Arrivals", path: "/deals" },
    { name: "Hot Deals", path: "/deals" },
  ];

  const customerCareLinks = [
    { name: "My Account", path: "/account" },
    { name: "Track Order", path: "/track-order" },
    { name: "Shipping & Delivery", path: "/shipping" },
    { name: "Returns & Exchanges", path: "/returns" },
    { name: "Size Guide", path: "/size-guide" },
    { name: "FAQs", path: "/faq" },
  ];

  return (
    <footer className="w-full bg-[#111111] text-white pt-10 pb-8 ">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          {/* Column 1: Brand Info (Spans 4 cols on large screens) */}
          <div className="lg:col-span-4">
            <Link to="/" className="flex items-center space-x-2 group mb-6">
              <div className="w-10 h-10 bg-[#007074] rounded-md flex items-center justify-center">
                <span className="text-white text-2xl font-bold font-serif">S</span>
              </div>
              <span className="text-2xl font-bold text-white uppercase tracking-widest">
                tylogist<span className="text-[#007074]">.pk</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-sm">
              Your ultimate destination for premium fashion, curated by AI and tailored for the modern, sophisticated lifestyle. Elevate your everyday elegance.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-gray-400">
                <FiMapPin className="text-[#007074]" size={18} />
                <span className="text-sm">Stylogist HQ, Fashion Avenue, Pakistan</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400">
                <FiPhoneCall className="text-[#007074]" size={18} />
                <span className="text-sm">+92 300 123 4567</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400">
                <FiMail className="text-[#007074]" size={18} />
                <span className="text-sm">support@stylogist.pk</span>
              </div>
            </div>
          </div>

          {/* Column 2: Shop Links (Spans 2 cols) */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6">
              Shop Categories
            </h3>
            <ul className="space-y-4">
              {shopLinks.map((link, index) => (
                <li key={index}>
                  <Link 
                    to={link.path} 
                    className="text-gray-400 text-sm hover:text-[#007074] inline-block transform hover:translate-x-1 transition-all ease-in-out duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Customer Care (Spans 2 cols) */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6">
              Customer Care
            </h3>
            <ul className="space-y-4">
              {customerCareLinks.map((link, index) => (
                <li key={index}>
                  <Link 
                    to={link.path} 
                    className="text-gray-400 text-sm hover:text-[#007074]  inline-block transform hover:translate-x-1 transition-all ease-in-out duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Newsletter & Socials (Spans 4 cols) */}
          <div className="lg:col-span-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6">
              Join The Insider Club
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Subscribe to our newsletter and get 10% off your first premium purchase, plus early access to new drops.
            </p>
            
            <form className="mb-8" onSubmit={(e) => e.preventDefault()}>
              <div className="relative flex items-center">
                <input 
                  type="email" 
                  placeholder="Enter your email address" 
                  className="w-full bg-[#222222] border border-gray-700 text-white px-4 py-3.5 rounded-md focus:outline-none focus:border-[#007074] text-sm transition-colors pr-14"
                  required
                />
                <button 
                  type="submit" 
                  className="absolute right-1.5 p-2 bg-[#007074] text-white rounded-md hover:bg-[#005a5d] transition-colors"
                  aria-label="Subscribe"
                >
                  <FiArrowRight size={18} />
                </button>
              </div>
            </form>

            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4">
              Follow Us
            </h3>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 rounded-md bg-[#222222] flex items-center justify-center text-gray-400 hover:bg-[#007074] hover:text-white transition-all duration-300">
                <FiInstagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-md bg-[#222222] flex items-center justify-center text-gray-400 hover:bg-[#007074] hover:text-white transition-all duration-300">
                <FiFacebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-md bg-[#222222] flex items-center justify-center text-gray-400 hover:bg-[#007074] hover:text-white transition-all duration-300">
                <FiTwitter size={18} />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar (Divider, Copyright, Legal, Payments) */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          
          <div className="text-gray-500 text-xs text-center md:text-left">
            &copy; {new Date().getFullYear()} Stylogist.pk. All Rights Reserved.
          </div>

          <div className="flex items-center space-x-6 text-gray-500 text-xs">
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>

          {/* Secure Payment Badges (CSS simulated for now) */}
          <div className="flex items-center space-x-2">
            <div className="bg-[#222222] border border-gray-700 text-gray-400 text-[10px] font-bold px-3 py-1.5 rounded-md uppercase tracking-wider">
              Visa
            </div>
            <div className="bg-[#222222] border border-gray-700 text-gray-400 text-[10px] font-bold px-3 py-1.5 rounded-md uppercase tracking-wider">
              Mastercard
            </div>
            <div className="bg-[#222222] border border-gray-700 text-[#007074] text-[10px] font-bold px-3 py-1.5 rounded-md uppercase tracking-wider">
              Cash on Delivery
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}