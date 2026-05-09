import React from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiPackage } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
import useWishlistStore from '../../store/useWishlistStore';
import { resolveImageUrl } from '../../utils/imageUrl';

// Canonical storefront card used by every home-page rail (Featured /
// Trending / Deals). Consolidates the card layout + wishlist hook wiring
// in one place so each section only worries about data-fetching.
//
// Variants:
// - "featured" (default) — black badge, teal accents
// - "trending"           — gradient teal "Trending" badge
// - "deal"               — red "-% OFF" + optional sold-stock bar
const fmt = (n) => `Rs ${Math.round(n || 0).toLocaleString()}`;

export default function StorefrontProductCard({
  product,
  index = 0,
  variant = 'featured',
  showStockBar = false,
}) {
  const to = `/product/${product.slug}`;
  const discount =
    product.maxPrice && product.minPrice && product.maxPrice > product.minPrice
      ? Math.round(((product.maxPrice - product.minPrice) / product.maxPrice) * 100)
      : product.discountPercentage || 0;

  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const wishlistItems = useWishlistStore((s) => s.items);
  const inWishlist = wishlistItems.some((w) => w.productId === product._id);

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({
      productId: product._id,
      slug: product.slug,
      name: product.name,
      image: product.image || null,
      price: product.minPrice || 0,
      brandName: product.brand?.name,
    });
  };

  // Stock consumed, used only by "deal" variant's scarcity bar. `soldStock`
  // is derived from totalSales vs initial stock assumption — kept simple so
  // we don't need a separate inventory call.
  const soldStock = Math.min(
    95,
    Math.max(15, Math.round(((product.totalSales || 0) / Math.max(1, (product.totalSales || 0) + (product.totalStock || 10))) * 100))
  );

  const badge =
    variant === 'deal' ? (
      discount > 0 ? (
        <div className="absolute top-3 left-3 bg-red-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter shadow-lg z-10 animate-pulse">
          {discount}% OFF
        </div>
      ) : null
    ) : variant === 'trending' ? (
      <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-[#007074] to-teal-400 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1">
        Trending
      </div>
    ) : (
      discount > 0 && (
        <div className="absolute top-3 left-3 bg-[#007074] text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-md z-10">
          -{discount}%
        </div>
      )
    );

  return (
    <div
      className="group flex flex-col relative w-full animate-[slideUp_0.5s_ease-out_forwards]"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Visual spec preserved verbatim from the original FeaturedProducts /
          TrendingProducts card so the home rails keep the look they shipped
          with: 2rem outer frame, 1.5rem inner mat, image rendered with
          `mix-blend-multiply` for the cream-paper effect, and a "Quick Add"
          slide-up CTA. The data wiring (real product, wishlist store) is
          new — the visuals are not. */}
      <div className="relative aspect-[6/4] sm:aspect-[3/4] sm:rounded-4xl bg-white border border-gray-100 p-2 shadow-sm transition-all duration-500 group-hover:shadow-xl group-hover:-translate-y-1 overflow-hidden">
        <div className="w-full h-full bg-[#F7F3F0] rounded-md sm:rounded-3xl overflow-hidden relative">
          <Link to={to} className="block w-full h-full">
            {product.image ? (
              <img
                src={resolveImageUrl(product.image)}
                alt={product.name}
                width="300"
                height="300"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <FiPackage size={36} />
              </div>
            )}
          </Link>

          {badge}
          {product.totalStock === 0 && (
            <div className="absolute top-3 left-3 bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-md z-10">
              Sold out
            </div>
          )}

          <button
            type="button"
            onClick={handleWishlist}
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/90 backdrop-blur-md shadow-sm transition-all hover:scale-110"
          >
            <FiHeart size={16} className={inWishlist ? 'fill-red-500 text-red-500' : 'text-gray-500'} />
          </button>

          <div className="absolute bottom-3 left-3 right-3 translate-y-12 group-hover:translate-y-0 transition-all duration-500 z-20">
            <Link
              to={to}
              className="w-full bg-[#222]/95 backdrop-blur-md text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2 hover:bg-[#007074] shadow-xl"
            >
              <FiShoppingCart size={14} /> Quick Add
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-4 px-1 text-center">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1 block">
          {product.brand?.name || product.category?.name || '—'}
        </span>
        <Link to={to}>
          <h3 className="text-[13px] sm:text-[14px] font-bold text-[#222] hover:text-[#007074] transition-colors leading-tight line-clamp-1 mb-2">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-[14px] font-black text-[#007074]">{fmt(product.minPrice)}</span>
          {product.maxPrice && product.maxPrice !== product.minPrice && (
            <span className="text-[11px] text-gray-300 line-through font-bold">{fmt(product.maxPrice)}</span>
          )}
        </div>
        {product.averageRating > 0 && (
          <div className="flex justify-center items-center gap-1.5 mt-2.5">
            <div className="flex items-center gap-0.5" aria-label={`${product.averageRating.toFixed(1)} out of 5 stars`}>
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  className={`w-2.5 h-2.5 ${i < Math.round(product.averageRating) ? 'text-yellow-400' : 'text-gray-200'}`}
                />
              ))}
            </div>
            <span className="text-[10px] font-semibold text-slate-500 tabular-nums">
              {product.averageRating.toFixed(1)}
              {product.totalReviews ? ` (${product.totalReviews})` : ''}
            </span>
          </div>
        )}

        {showStockBar && (
          <div className="mt-3 px-2 space-y-1.5">
            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-400">
              <span>Sold: {soldStock}%</span>
              <span className={soldStock > 80 ? 'text-red-500 animate-pulse' : ''}>
                {soldStock > 80 ? 'ALMOST GONE' : 'LIMITED STOCK'}
              </span>
            </div>
            <div className="w-full h-[3px] bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 rounded-full ${
                  soldStock > 80 ? 'bg-red-500' : 'bg-[#007074]'
                }`}
                style={{ width: `${soldStock}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
