import React, { useEffect, useState } from 'react';
import { FiShoppingCart, FiZap } from 'react-icons/fi';

// Sticky mobile-only buy bar pinned to the bottom of the viewport. Hidden
// on lg+ where the right-rail order summary already lives above the fold.
//
// Hides itself once the user scrolls past the bottom of the page (a rough
// proxy for "they're inside the order summary / footer area") to avoid
// double-CTA noise. Pure presentational — buy/cart actions are passed in
// as props so this component stays decoupled from store/cart logic.
const fmtPKR = (n) => `Rs ${Math.round(n || 0).toLocaleString()}`;

export default function MobileBuyBar({
  price,
  originalPrice,
  outOfStock,
  onAddToCart,
  onBuyNow,
}) {
  // Track scroll position so we can fade-out the bar once the page footer is
  // in view (no need for the bar when the user can already see Buy Now).
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const fromBottom = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
      setHidden(fromBottom < 320);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ${
        hidden ? 'translate-y-full' : 'translate-y-0'
      }`}
      role="region"
      aria-label="Mobile purchase bar"
    >
      <div
        className="bg-white border-t border-gray-200 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] px-3 py-2.5 flex items-center gap-2"
        // Respect iOS safe-area / Android gesture insets.
        style={{ paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex flex-col leading-tight min-w-0 mr-1">
          <span className="text-base font-black text-[#007074] tabular-nums truncate">
            {fmtPKR(price)}
          </span>
          {originalPrice && originalPrice > price && (
            <span className="text-[10px] text-gray-400 line-through tabular-nums">
              {fmtPKR(originalPrice)}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onAddToCart}
          disabled={outOfStock}
          aria-label="Add to cart"
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 rounded-xl border border-gray-200 bg-white text-[10px] font-black uppercase tracking-[0.15em] text-[#222] hover:border-[#222] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FiShoppingCart size={14} /> Cart
        </button>
        <button
          type="button"
          onClick={onBuyNow}
          disabled={outOfStock}
          aria-label="Buy now with cash on delivery"
          className="flex-[1.4] inline-flex items-center justify-center gap-1.5 py-3 rounded-xl bg-[#007074] text-white text-[10px] font-black uppercase tracking-[0.15em] hover:bg-[#005a5d] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FiZap size={14} /> {outOfStock ? 'Unavailable' : 'Buy now · COD'}
        </button>
      </div>
    </div>
  );
}
