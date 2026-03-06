import React, { useState, useMemo } from 'react';
import { 
  FiFilter, 
  FiChevronRight, 
  FiChevronDown, 
  FiStar, 
  FiX 
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import ComonButton from '../../commonpages/ComonButton';

// --- MOCK DATA ---
const MOCK_PRODUCTS = [
  { id: 1, name: "Gradient Graphic T-shirt", type: "T-shirts", style: "Casual", price: 145, originalPrice: null, rating: 4.5, sizes: ["Small", "Medium", "Large"], image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1780&auto=format&fit=crop" },
  { id: 2, name: "Polo with Tipping Details", type: "Shirts", style: "Formal", price: 180, originalPrice: null, rating: 4.5, sizes: ["Medium", "Large", "X-Large"], image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=1974&auto=format&fit=crop" },
  { id: 3, name: "Black Striped T-shirt", type: "T-shirts", style: "Casual", price: 120, originalPrice: 150, discount: 20, rating: 5.0, sizes: ["Small", "Medium"], image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1964&auto=format&fit=crop" },
  { id: 4, name: "Skinny Fit Jeans", type: "Jeans", style: "Casual", price: 240, originalPrice: 260, discount: 8, rating: 3.5, sizes: ["Medium", "Large", "X-Large"], image: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1926&auto=format&fit=crop" },
  { id: 5, name: "Checkered Shirt", type: "Shirts", style: "Casual", price: 180, originalPrice: null, rating: 4.5, sizes: ["Large", "X-Large"], image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=1925&auto=format&fit=crop" },
  { id: 6, name: "Sleeve Striped T-shirt", type: "T-shirts", style: "Casual", price: 130, originalPrice: 160, discount: 19, rating: 4.5, sizes: ["Small", "Medium", "Large"], image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1974&auto=format&fit=crop" },
  { id: 7, name: "Vertical Striped Shirt", type: "Shirts", style: "Party", price: 212, originalPrice: 232, discount: 9, rating: 5.0, sizes: ["Medium", "Large"], image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=1974&auto=format&fit=crop" },
  { id: 8, name: "Courage Graphic T-shirt", type: "T-shirts", style: "Gym", price: 145, originalPrice: null, rating: 4.0, sizes: ["Small", "Medium", "Large", "X-Large"], image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1974&auto=format&fit=crop" },
  { id: 9, name: "Loose Fit Bermuda Shorts", type: "Shorts", style: "Gym", price: 80, originalPrice: null, rating: 3.0, sizes: ["Medium", "Large"], image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=1974&auto=format&fit=crop" },
];

const CATEGORIES = ['T-shirts', 'Shorts', 'Shirts', 'Hoodie', 'Jeans'];
const SIZES = ['XX-Small', 'X-Small', 'Small', 'Medium', 'Large', 'X-Large', 'XX-Large', '3X-Large', '4X-Large'];
const DRESS_STYLES = ['Casual', 'Formal', 'Party', 'Gym'];

export default function CategoryPage() {
  // --- STATE MANAGEMENT ---
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [maxPrice, setMaxPrice] = useState(300);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState('All');
  const [sortBy, setSortBy] = useState('popular');

  // --- FILTER LOGIC ---
  const toggleSize = (size) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const filteredProducts = useMemo(() => {
    let result = MOCK_PRODUCTS;

    // Filter by Category (Type)
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.type === selectedCategory);
    }
    // Filter by Dress Style
    if (selectedStyle !== 'All') {
      result = result.filter(p => p.style === selectedStyle);
    }
    // Filter by Max Price
    result = result.filter(p => p.price <= maxPrice);
    // Filter by Sizes (Must include at least one of the selected sizes)
    if (selectedSizes.length > 0) {
      result = result.filter(p => p.sizes.some(size => selectedSizes.includes(size)));
    }

    // Sort Logic
    switch (sortBy) {
      case 'price-low':
        return result.sort((a, b) => a.price - b.price);
      case 'price-high':
        return result.sort((a, b) => b.price - a.price);
      case 'rating':
        return result.sort((a, b) => b.rating - a.rating);
      case 'popular':
      default:
        // Mock popular sorting (just ID based for now)
        return result.sort((a, b) => a.id - b.id);
    }
  }, [selectedCategory, maxPrice, selectedSizes, selectedStyle, sortBy]);

  // --- RENDER HELPERS ---
  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1 text-yellow-400 text-sm">
        {[...Array(5)].map((_, i) => (
          <FiStar key={i} fill={i < Math.floor(rating) ? "currentColor" : "none"} className={i < Math.floor(rating) ? "text-yellow-400" : "text-gray-300"} />
        ))}
        <span className="text-xs text-gray-500 ml-1">{rating}/5</span>
      </div>
    );
  };

  return (
    <div className="w-full bg-white font-sans text-[#222222]">
      
      {/* BREADCRUMBS */}
      <div className="container mx-auto px-4 md:px-8 py-6 max-w-7xl">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-[#007074]">Home</Link>
          <FiChevronRight size={14} />
          <span className="text-[#222222] font-bold">Shop</span>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 pb-24 max-w-7xl flex flex-col lg:flex-row gap-8">
        
        {/* ========================================= */}
        {/* LEFT SIDEBAR: FILTERS                     */}
        {/* ========================================= */}
        {/* Mobile Filter Overlay & Drawer */}
        <div className={`fixed inset-0 bg-black/50 z-50 lg:hidden transition-opacity duration-300 ${isMobileFilterOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={() => setIsMobileFilterOpen(false)}></div>
        
        <div className={`fixed lg:static top-0 left-0 h-full lg:h-auto w-[280px] lg:w-[260px] bg-white lg:bg-transparent z-50 lg:z-auto overflow-y-auto lg:overflow-visible p-6 lg:p-0 transition-transform duration-300 transform ${isMobileFilterOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} shrink-0`}>
          
          <div className="border border-gray-200 rounded-2xl p-5 lg:p-6 lg:sticky lg:top-28 bg-white shadow-sm">
            
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <h2 className="text-xl font-bold font-serif">Filters</h2>
              <FiFilter size={20} className="text-gray-400" />
              <button className="lg:hidden text-gray-500 hover:text-red-500" onClick={() => setIsMobileFilterOpen(false)}>
                <FiX size={24} />
              </button>
            </div>

            {/* Categories (Types) */}
            <div className="mb-6 pb-6 border-b border-gray-100 space-y-3">
              <button 
                onClick={() => setSelectedCategory('All')}
                className={`flex items-center justify-between w-full text-sm hover:text-[#007074] transition-colors ${selectedCategory === 'All' ? 'text-[#007074] font-bold' : 'text-gray-600'}`}
              >
                All Products <FiChevronRight size={16} />
              </button>
              {CATEGORIES.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center justify-between w-full text-sm hover:text-[#007074] transition-colors ${selectedCategory === cat ? 'text-[#007074] font-bold' : 'text-gray-600'}`}
                >
                  {cat} <FiChevronRight size={16} />
                </button>
              ))}
            </div>

            {/* Price Range Slider */}
            <div className="mb-6 pb-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">Price</h3>
                <FiChevronDown size={18} />
              </div>
              <div className="px-2">
                <input 
                  type="range" 
                  min="50" 
                  max="300" 
                  value={maxPrice} 
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#007074]"
                />
                <div className="flex justify-between text-sm font-bold mt-3 text-gray-700">
                  <span>$50</span>
                  <span className="text-[#007074]">Up to ${maxPrice}</span>
                </div>
              </div>
            </div>

            {/* Size Pills */}
            <div className="mb-6 pb-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">Size</h3>
                <FiChevronDown size={18} />
              </div>
              <div className="flex flex-wrap gap-2">
                {SIZES.map(size => (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-colors border ${
                      selectedSizes.includes(size) 
                        ? 'bg-[#222222] text-white border-[#222222]' 
                        : 'bg-[#F7F3F0] text-gray-600 border-transparent hover:border-[#007074]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Dress Style */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">Dress Style</h3>
                <FiChevronDown size={18} />
              </div>
              <div className="space-y-3">
                <button 
                  onClick={() => setSelectedStyle('All')}
                  className={`flex items-center justify-between w-full text-sm hover:text-[#007074] transition-colors ${selectedStyle === 'All' ? 'text-[#007074] font-bold' : 'text-gray-600'}`}
                >
                  All Styles <FiChevronRight size={16} />
                </button>
                {DRESS_STYLES.map(style => (
                  <button 
                    key={style}
                    onClick={() => setSelectedStyle(style)}
                    className={`flex items-center justify-between w-full text-sm hover:text-[#007074] transition-colors ${selectedStyle === style ? 'text-[#007074] font-bold' : 'text-gray-600'}`}
                  >
                    {style} <FiChevronRight size={16} />
                  </button>
                ))}
              </div>
            </div>

            {/* Apply Button (Mobile only logic, but good UX to have) */}
            <button 
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full bg-[#222222] text-white rounded-full py-3.5 text-sm font-bold hover:bg-[#007074] transition-colors"
            >
              Apply Filter
            </button>
          </div>
        </div>

        {/* ========================================= */}
        {/* RIGHT SIDE: PRODUCT GRID                  */}
        {/* ========================================= */}
        <div className="flex-1">
          
          {/* Header row: Title & Sort */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <h1 className="text-3xl md:text-4xl font-bold font-serif">
              {selectedCategory !== 'All' ? selectedCategory : (selectedStyle !== 'All' ? selectedStyle : 'All Products')}
            </h1>
            
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-500 hidden md:block">
                Showing {filteredProducts.length} Products
              </span>
              
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Sort by:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="font-bold bg-transparent focus:outline-none cursor-pointer text-[#222222]"
                >
                  <option value="popular">Most Popular</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>

              {/* Mobile Filter Trigger */}
              <button 
                className="lg:hidden ml-auto bg-gray-100 p-2 rounded-full"
                onClick={() => setIsMobileFilterOpen(true)}
              >
                <FiFilter size={20} />
              </button>
            </div>
          </div>

          {/* Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8 lg:gap-x-6 lg:gap-y-10">
              {filteredProducts.map((product) => (
                <div  key={product.id} className=" shadow-md shadow-gray-400 p-2 rounded-md group cursor-pointer">
                  {/* Image Container */}
                  <div className="w-full h-[200px] bg-[#F7F3F0] rounded-md overflow-hidden mb-4 relative">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  
                  {/* Product Info */}
                  <h3 className="font-bold text-sm md:text-base text-[#222222] truncate mb-1">
                    {product.name}
                  </h3>
                  
                  {renderStars(product.rating)}
                  
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-lg md:text-xl font-bold text-[#222222]">${product.price}</span>
                    {product.originalPrice && (
                      <span className="text-sm md:text-base text-gray-400 line-through font-bold">${product.originalPrice}</span>
                    )}
                    {product.discount && (
                      <span className="text-[10px] md:text-xs font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-full">
                        -{product.discount}%
                      </span>
                    )}
                  </div>

                  <div className='mt-3 flex gap-2 justify-around'>
                     <button className="bg-[#007074] cursor-pointer text-white py-2 px-4 rounded-md hover:bg-[#005a5a] transition-colors">
                       Add to Cart
                     </button>
                      <button className="border cursor-pointer border-[#007074] text-[#007074] py-2 px-4 rounded-md hover:bg-[#007074] hover:text-white transition-colors">
                        View Details
                      </button> 
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full py-20 text-center flex flex-col items-center justify-center bg-[#F7F3F0] rounded-2xl">
              <FiFilter size={48} className="text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-[#222222] mb-2">No products found</h3>
              <p className="text-gray-500 text-sm">Try adjusting your filters to see more results.</p>
              <button 
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedStyle('All');
                  setSelectedSizes([]);
                  setMaxPrice(300);
                }}
                className="mt-6 text-[#007074] font-bold uppercase tracking-widest text-sm border-b-2 border-[#007074]"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Pagination (Visual UI Only) */}
          {filteredProducts.length > 0 && (
            <div className="flex items-center justify-between border-t border-gray-200 mt-12 pt-6">
              <button className="flex items-center gap-2 text-sm font-bold text-[#222222] border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors">
                &larr; Previous
              </button>
              
              <div className="hidden md:flex items-center gap-1">
                <button className="w-8 h-8 rounded-lg bg-gray-100 text-[#222222] font-bold text-sm flex items-center justify-center">1</button>
                <button className="w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-50 font-bold text-sm flex items-center justify-center transition-colors">2</button>
                <button className="w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-50 font-bold text-sm flex items-center justify-center transition-colors">3</button>
                <span className="text-gray-400 px-2">...</span>
                <button className="w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-50 font-bold text-sm flex items-center justify-center transition-colors">8</button>
              </div>

              <button className="flex items-center gap-2 text-sm font-bold text-[#222222] border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors">
                Next &rarr;
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}