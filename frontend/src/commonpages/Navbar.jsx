import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiMenu, 
  FiX, 
  FiSearch, 
  FiHeart, 
  FiShoppingCart, 
  FiUser,
  FiTruck,
  FiChevronDown
} from 'react-icons/fi';
import { FaBolt } from 'react-icons/fa';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const location = useLocation();

  // Handle scroll effect with a slightly higher threshold to prevent accidental triggering
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsOpen(false);
    setIsSearchOpen(false);
    setMobileCategoryOpen(false);
    document.body.style.overflow = 'unset';
  }, [location]);

  const toggleSearch = () => setIsSearchOpen(!isSearchOpen);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    document.body.style.overflow = !isOpen ? 'hidden' : 'unset';
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { 
      name: 'Categories', 
      path: '#',
      hasDropdown: true,
      subItems: [
        { name: 'Women', path: '/category/women' },
        { name: 'Men', path: '/category/men' },
        { name: 'Accessories', path: '/category/accessories' },
        { name: 'Beauty', path: '/category/beauty' }
      ]
    },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: 'Hot Deals', path: '/deals', highlight: true },
  ];

  const DesktopNavLinks = () => (
    <>
      {navLinks.map((link, idx) => (
        <div key={idx} className="relative group flex items-center h-full">
          {link.hasDropdown ? (
            <div className="cursor-pointer flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-gray-600 hover:text-[#007074] transition-colors py-4">
              {link.name}
              <FiChevronDown size={14} className="transition-transform duration-300 group-hover:rotate-180" />
            </div>
          ) : (
            <Link
              to={link.path}
              className={`flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider transition-colors py-4 ${
                link.highlight ? 'text-[#007074] hover:text-[#005a5d]' : 'text-gray-600 hover:text-[#007074]'
              }`}
            >
              {link.highlight && <FaBolt />}
              {link.name}
            </Link>
          )}

          <span className={`absolute bottom-0 left-0 h-0.5 transition-all duration-300 w-0 group-hover:w-full ${link.highlight ? 'bg-[#007074]' : 'bg-[#222222]'}`}></span>

          {link.hasDropdown && (
            <div className="absolute left-0 top-full w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
              <div className="bg-white border border-gray-100 rounded-md shadow-xl py-2 flex flex-col transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 mt-1">
                {link.subItems.map((sub, subIdx) => (
                  <Link
                    key={subIdx}
                    to={sub.path}
                    className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-[#007074] hover:bg-gray-50 transition-colors uppercase tracking-wider"
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </>
  );

  return (
    <>
      <div className="bg-[#222222] text-white py-2 px-4 text-center text-[10px] md:text-xs font-bold tracking-widest uppercase relative z-50">
        <div className="container mx-auto flex items-center justify-center space-x-6">
          <span className="flex items-center space-x-2">
            <FiTruck className="text-[#007074] text-sm" />
            <span>Free Shipping on Orders Rs. 5000+</span>
          </span>
        </div>
      </div>

      {/* FIX 1: Set a strict fixed height for the nav block. 
        h-[80px] when scrolled, h-[130px] when at the top.
        This stops the browser from bouncing during layout calculation. 
      */}
      <nav 
        className={`sticky top-0 z-40 w-full bg-white transition-all duration-500 ease-in-out border-b border-gray-100 ${
          isScrolled ? 'h-[72px] shadow-md' : 'h-[120px]'
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl h-full relative">

          {/* MAIN ROW: Always stays at the top of the nav container */}
          <div className="flex items-center justify-between h-[72px]">

            <Link to="/" className="flex items-center space-x-2 group shrink-0">
              <div className="w-9 h-9 bg-[#007074] rounded-md flex items-center justify-center transition-transform group-hover:scale-105">
                <span className="text-white text-xl font-bold font-serif">S</span>
              </div>
              <span className="text-xl md:text-2xl font-bold text-[#222222] uppercase tracking-widest">
                tylogist<span className="text-[#007074]">.pk</span>
              </span>
            </Link>

            {/* Desktop Center Area */}
            <div className="hidden lg:flex flex-1 items-center justify-center mx-8 relative h-full">

              {/* Big Search Bar (Unscrolled State) */}
              <div
                className={`absolute w-full max-w-lg transition-all duration-300 ease-in-out ${
                  isScrolled ? 'opacity-0 invisible pointer-events-none scale-95' : 'opacity-100 visible scale-100'
                }`}
              >
                <div className="relative cursor-pointer" onClick={toggleSearch}>
                  <input
                    type="text"
                    placeholder="Search for premium styles..."
                    className="w-full py-2.5 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-md outline-none text-sm cursor-pointer"
                    readOnly
                  />
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
              </div>

              {/* Nav Links (Scrolled State) */}
              <div
                className={`absolute w-full h-full flex justify-center space-x-8 transition-all duration-300 ease-in-out ${
                  isScrolled ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-4 pointer-events-none'
                }`}
              >
                <DesktopNavLinks />
              </div>

            </div>

            {/* Right Icons */}
            <div className="flex items-center space-x-4 md:space-x-6 shrink-0 h-full">

              <button
                onClick={toggleSearch}
                className={`text-[#222222] hover:text-[#007074] transition-all duration-300 flex items-center ${
                  isScrolled ? 'lg:w-auto lg:opacity-100 lg:scale-100' : 'lg:w-0 lg:opacity-0 lg:scale-0 overflow-hidden'
                }`}
              >
                <FiSearch size={22} />
              </button>

              <Link to="/wishlist" className="relative hidden sm:flex items-center text-[#222222] hover:text-[#007074] transition-colors h-full">
                <FiHeart size={22} />
                <span className="absolute top-[20px] -right-2 w-4 h-4 bg-[#222222] text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                  3
                </span>
              </Link>

              <Link to="/cart" className="relative flex items-center text-[#222222] hover:text-[#007074] transition-colors h-full">
                <FiShoppingCart size={22} />
                <span className="absolute top-[20px] -right-2 w-4 h-4 bg-[#007074] text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                  5
                </span>
              </Link>

              <Link to="/login" className="hidden lg:flex items-center space-x-2 text-[#222222] hover:text-[#007074] font-bold text-sm uppercase tracking-wider transition-colors pl-4 border-l border-gray-200 h-10 mt-1">
                <FiUser size={20} />
                <span>Sign In</span>
              </Link>

              <button onClick={toggleMenu} className="lg:hidden text-[#222222] hover:text-[#007074] flex items-center h-full">
                {isOpen ? <FiX size={26} /> : <FiMenu size={26} />}
              </button>

            </div>
          </div>

          {/* FIX 2: BOTTOM ROW
            Uses absolute positioning so it doesn't push the nav height abruptly when it disappears.
          */}
          <div
            className={`hidden lg:flex items-center justify-center space-x-10 h-[48px] absolute bottom-0 left-0 w-full transition-all duration-300 ease-in-out border-t border-gray-50 ${
              isScrolled ? 'opacity-0 invisible translate-y-2 pointer-events-none' : 'opacity-100 visible translate-y-0'
            }`}
          >
            <DesktopNavLinks />
          </div>

        </div>
      </nav>

      {/* ========================================= */}
      {/* COMPACT SEARCH MODAL OVERLAY */}
      {/* ========================================= */}
      <div className={`fixed inset-0 z-[100] transition-all duration-300 ${isSearchOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={toggleSearch} />

        <div className={`absolute top-0 left-0 w-full bg-white shadow-2xl transition-transform duration-500 ease-out ${isSearchOpen ? 'translate-y-0' : '-translate-y-full'}`}>
          <div className="container mx-auto px-4 py-8 lg:px-8 max-w-4xl relative">
            <button onClick={toggleSearch} className="absolute top-4 right-4 text-gray-400 hover:text-[#222222] transition-colors p-2">
              <FiX size={28} />
            </button>
            <div className="flex flex-col items-center mt-2">
              <div className="relative w-full max-w-2xl group">
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  className="w-full text-lg md:text-xl py-4 pl-12 pr-4 bg-transparent border-b-2 border-gray-200 focus:outline-none focus:border-[#007074] transition-colors text-[#222222] font-serif"
                  autoFocus={isSearchOpen}
                />
                <FiSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#007074]" size={24} />
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <span className="text-xs font-bold tracking-widest uppercase text-gray-400 py-2 mr-2">Trending:</span>
                {['Silk Dress', 'Leather Bags', 'Watches'].map((term, i) => (
                  <span key={i} className="px-4 py-1.5 bg-gray-100 rounded-md text-xs font-bold text-[#222222] cursor-pointer hover:bg-[#007074] hover:text-white transition-colors">
                    {term}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* MOBILE MENU DRAWER */}
      {/* ========================================= */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-100 z-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleMenu}
      />

      <div
        className={`fixed top-0 left-0 h-full w-[80%] max-w-sm bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="bg-[#222222] p-6 flex items-center justify-between shrink-0">
          <Link to="/login" onClick={toggleMenu} className="flex items-center space-x-3 text-white">
            <div className="w-10 h-10 bg-[#007074] rounded-md flex items-center justify-center">
              <FiUser size={20} />
            </div>
            <div>
              <p className="font-bold text-sm tracking-widest uppercase">Sign In</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">To your account</p>
            </div>
          </Link>
          <button onClick={toggleMenu} className="text-gray-400 hover:text-white">
            <FiX size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-6 space-y-8">
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Navigation</h3>
            <div className="space-y-2">
              {navLinks.map((link, idx) => (
                <div key={idx} className="border-b border-gray-100 last:border-0 pb-2">
                  {link.hasDropdown ? (
                    <>
                      <button 
                        onClick={() => setMobileCategoryOpen(!mobileCategoryOpen)}
                        className="w-full flex items-center justify-between font-bold text-sm uppercase tracking-wider text-[#222222] py-2"
                      >
                        {link.name}
                        <FiChevronDown size={18} className={`transition-transform duration-300 ${mobileCategoryOpen ? 'rotate-180 text-[#007074]' : ''}`} />
                      </button>
                      <div className={`overflow-hidden transition-all duration-300 ${mobileCategoryOpen ? 'max-h-60 mt-2' : 'max-h-0'}`}>
                        <div className="flex flex-col space-y-3 pl-4 border-l-2 border-[#007074]/20 mb-2">
                          {link.subItems.map((sub, subIdx) => (
                            <Link
                              key={subIdx}
                              to={sub.path}
                              className="text-sm font-bold text-gray-500 uppercase tracking-wider hover:text-[#007074]"
                              onClick={toggleMenu}
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <Link
                      to={link.path}
                      className={`flex items-center gap-2 font-bold text-sm uppercase tracking-wider transition-colors py-2 ${
                        link.highlight ? 'text-[#007074]' : 'text-[#222222]'
                      }`}
                      onClick={toggleMenu}
                    >
                      {link.highlight && <FaBolt />}
                      {link.name}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          <hr className="border-gray-100" />

          <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Quick Links</h3>
            <div className="space-y-4">
              <Link to="/wishlist" onClick={toggleMenu} className="flex items-center space-x-3 text-[#222222] font-bold text-sm uppercase tracking-wider">
                <FiHeart size={18} />
                <span>Wishlist (3)</span>
              </Link>
              <Link to="/cart" onClick={toggleMenu} className="flex items-center space-x-3 text-[#222222] font-bold text-sm uppercase tracking-wider">
                <FiShoppingCart size={18} />
                <span>Cart (5)</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}