import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiMinus, FiPlus, FiTrash2, FiArrowRight, FiShield, FiShoppingBag,
  FiChevronLeft, FiPackage, FiHeart, FiTruck, FiChevronRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import useCartStore from '../store/useCartStore';
import useWishlistStore from '../store/useWishlistStore';

const fmtPKR = (n) => `Rs ${Math.round(n || 0).toLocaleString()}`;

export default function CartPage() {
  const navigate = useNavigate();

  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clear);

  const moveToWishlist = useWishlistStore((s) => s.add);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = 0; // Free nationwide — matches backend order service.
  const total = subtotal + shipping;
  const totalCount = items.reduce((s, i) => s + i.quantity, 0);

  const handleSaveForLater = (item) => {
    moveToWishlist({
      productId: item.productId,
      slug: item.slug,
      name: item.name,
      image: item.image,
      price: item.price,
      originalPrice: item.originalPrice,
    });
    removeItem(item.productId, item.sku);
    toast.success('Saved to wishlist');
  };

  // Empty state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
            <FiShoppingBag size={22} />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Your cart is empty</h2>
          <p className="text-sm text-slate-500 mt-1.5">
            Browse the shop and add a few items to get started.
          </p>
          <Link
            to="/products"
            className="mt-6 inline-flex items-center justify-center gap-2 w-full bg-[#007074] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#005a5d]"
          >
            Shop products <FiArrowRight size={14} />
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
          <span className="text-slate-900 font-medium">Cart</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-4">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Your cart</h1>
            <p className="text-sm text-slate-500 mt-1">
              {totalCount} {totalCount === 1 ? 'item' : 'items'} ready to ship
            </p>
          </div>

          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 self-start md:self-auto"
          >
            <FiChevronLeft size={14} /> Continue shopping
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT — items list */}
          <section className="lg:col-span-7 space-y-3">
            {items.map((it) => (
              <CartLine
                key={`${it.productId}-${it.sku}`}
                item={it}
                onDec={() => setQuantity(it.productId, it.sku, Math.max(1, it.quantity - 1))}
                onInc={() => setQuantity(it.productId, it.sku, it.quantity + 1)}
                onRemove={() => {
                  removeItem(it.productId, it.sku);
                  toast.success('Removed from cart');
                }}
                onSave={() => handleSaveForLater(it)}
              />
            ))}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  clearCart();
                  toast.success('Cart cleared');
                }}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-600"
              >
                <FiTrash2 size={13} /> Clear cart
              </button>
            </div>
          </section>

          {/* RIGHT — summary */}
          <aside className="lg:col-span-5 lg:sticky lg:top-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                <span className="w-8 h-8 rounded-md bg-[#007074]/10 text-[#007074] flex items-center justify-center">
                  <FiPackage size={15} />
                </span>
                <h2 className="text-base font-semibold">Order summary</h2>
              </div>

              <dl className="space-y-2.5 text-sm py-5">
                <SummaryRow label={`Subtotal (${totalCount} items)`} value={fmtPKR(subtotal)} />
                <SummaryRow
                  label="Shipping"
                  value={<span className="text-emerald-700 font-medium">FREE</span>}
                />
                <div className="h-px bg-slate-100 my-2" />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-medium text-slate-900">Total</span>
                  <span className="text-xl font-semibold text-[#007074] tabular-nums">{fmtPKR(total)}</span>
                </div>
              </dl>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-[#007074] text-white py-3 rounded-lg text-sm font-semibold hover:bg-[#005a5d] inline-flex items-center justify-center gap-2"
              >
                <FiTruck size={14} /> Checkout with COD
              </button>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <FiShield size={11} /> Pay on delivery · no card needed
              </div>
            </div>

            {/* Trust row */}
            <ul className="mt-3 space-y-2">
              <TrustRow icon={<FiTruck size={14} />} title="Free nationwide delivery" />
              <TrustRow icon={<FiShield size={14} />} title="Cash on Delivery" />
              <TrustRow icon={<FiPackage size={14} />} title="7-day easy returns" />
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ------------- subcomponents ------------- */

function CartLine({ item, onDec, onInc, onRemove, onSave }) {
  const subtotal = item.price * item.quantity;
  const productHref = item.slug ? `/product/${item.slug}` : '/products';

  return (
    <article className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex gap-4">
      <Link
        to={productHref}
        className="w-24 h-24 bg-slate-100 rounded-md overflow-hidden flex-shrink-0"
      >
        {item.image ? (
          <img src={item.image} alt={item.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <FiPackage size={20} />
          </div>
        )}
      </Link>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to={productHref}
              className="text-sm font-medium text-slate-900 hover:text-[#007074] truncate block"
            >
              {item.name}
            </Link>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">{item.sku}</div>
            {(item.color || item.size) && (
              <div className="text-xs text-slate-500 mt-0.5 capitalize">
                {[item.color, item.size].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-sm font-semibold text-slate-900 tabular-nums">{fmtPKR(subtotal)}</div>
            {item.quantity > 1 && (
              <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                {fmtPKR(item.price)} each
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto pt-3 flex items-center justify-between gap-3">
          <div className="inline-flex items-center border border-slate-200 rounded-md">
            <button
              onClick={onDec}
              disabled={item.quantity <= 1}
              className="w-8 h-8 inline-flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40"
            >
              <FiMinus size={13} />
            </button>
            <span className="w-8 text-center text-xs font-medium tabular-nums">{item.quantity}</span>
            <button
              onClick={onInc}
              className="w-8 h-8 inline-flex items-center justify-center text-slate-500 hover:bg-slate-50"
            >
              <FiPlus size={13} />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onSave}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-[#007074]"
              title="Move to wishlist"
            >
              <FiHeart size={13} /> Save
            </button>
            <button
              onClick={onRemove}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-red-600"
              title="Remove"
            >
              <FiTrash2 size={13} /> Remove
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-slate-600">
      <dt>{label}</dt>
      <dd className="text-slate-900 tabular-nums">{value}</dd>
    </div>
  );
}

function TrustRow({ icon, title }) {
  return (
    <li className="bg-white rounded-lg border border-slate-200 px-4 py-2.5 flex items-center gap-3 text-sm text-slate-700">
      <span className="w-7 h-7 rounded-md bg-slate-50 text-[#007074] flex items-center justify-center">
        {icon}
      </span>
      {title}
    </li>
  );
}
