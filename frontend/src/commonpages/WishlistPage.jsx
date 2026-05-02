import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiHeart, FiTrash2, FiArrowRight, FiChevronRight, FiStar, FiPackage
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import useWishlistStore from '../store/useWishlistStore';

const fmtPKR = (n) => `Rs ${Math.round(n || 0).toLocaleString()}`;

export default function WishlistPage() {
  const navigate = useNavigate();

  const items = useWishlistStore((s) => s.items);
  const remove = useWishlistStore((s) => s.remove);
  const clear = useWishlistStore((s) => s.clear);

  // Empty state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
            <FiHeart size={22} />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">No saved items yet</h2>
          <p className="text-sm text-slate-500 mt-1.5">
            Tap the heart on a product you love and it'll show up here.
          </p>
          <Link
            to="/category"
            className="mt-6 inline-flex items-center justify-center gap-2 w-full bg-[#007074] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#005a5d]"
          >
            Browse products <FiArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-16">
      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link to="/" className="hover:text-[#007074]">Home</Link>
          <FiChevronRight size={11} />
          <span className="text-slate-900 font-medium">Wishlist</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-4">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Wishlist</h1>
            <p className="text-sm text-slate-500 mt-1">
              {items.length} saved {items.length === 1 ? 'item' : 'items'}
            </p>
          </div>

          <button
            onClick={() => {
              if (!window.confirm('Clear all saved items?')) return;
              clear();
              toast.success('Wishlist cleared');
            }}
            className="inline-flex items-center gap-1.5 self-start md:self-auto px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50"
          >
            <FiTrash2 size={13} /> Clear all
          </button>
        </header>

        {/* Table-style list for clarity — not the storefront card grid. */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header (desktop only) */}
          <div className="hidden md:grid grid-cols-12 gap-4 bg-slate-50 border-b border-slate-200 px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-6">Product</div>
            <div className="col-span-3 text-right">Price</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>

          <ul className="divide-y divide-slate-100">
            {items.map((p) => (
              <WishlistRow
                key={p.productId}
                item={p}
                onRemove={() => {
                  remove(p.productId);
                  toast.success('Removed from wishlist');
                }}
                onView={() => navigate(p.slug ? `/product/${p.slug}` : '/products')}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function WishlistRow({ item, onRemove, onView }) {
  const href = item.slug ? `/product/${item.slug}` : '/products';
  const hasDiscount = item.originalPrice && item.originalPrice > item.price;

  return (
    <li className="px-5 py-4 md:grid md:grid-cols-12 md:gap-4 md:items-center flex items-center gap-4">
      {/* Product cell */}
      <div className="md:col-span-6 flex items-center gap-4 min-w-0 flex-1 md:flex-none">
        <Link
          to={href}
          className="w-16 h-16 md:w-14 md:h-14 bg-slate-100 rounded-md overflow-hidden flex-shrink-0"
        >
          {item.image ? (
            <img src={item.image} alt={item.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <FiPackage size={18} />
            </div>
          )}
        </Link>
        <div className="min-w-0">
          <Link
            to={href}
            className="text-sm font-medium text-slate-900 hover:text-[#007074] line-clamp-1"
          >
            {item.name}
          </Link>
          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
            {item.brandName && <span>{item.brandName}</span>}
            {item.averageRating > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <FiStar size={10} className="fill-amber-400 text-amber-400" />
                {item.averageRating.toFixed(1)}
              </span>
            )}
          </div>

          {/* Mobile price row */}
          <div className="md:hidden mt-1 text-sm font-semibold text-slate-900 tabular-nums">
            {fmtPKR(item.price)}
            {hasDiscount && (
              <span className="ml-2 text-xs text-slate-400 line-through font-normal">
                {fmtPKR(item.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Price cell (desktop only) */}
      <div className="hidden md:flex md:col-span-3 flex-col items-end text-right">
        <span className="text-sm font-semibold text-slate-900 tabular-nums">{fmtPKR(item.price)}</span>
        {hasDiscount && (
          <span className="text-xs text-slate-400 line-through tabular-nums">
            {fmtPKR(item.originalPrice)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="md:col-span-3 flex items-center justify-end gap-2 flex-shrink-0">
        <button
          onClick={onView}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#007074] text-white text-xs font-medium rounded-md hover:bg-[#005a5d]"
        >
          View
        </button>
        <button
          onClick={onRemove}
          title="Remove"
          className="w-8 h-8 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 inline-flex items-center justify-center"
        >
          <FiTrash2 size={14} />
        </button>
      </div>
    </li>
  );
}
