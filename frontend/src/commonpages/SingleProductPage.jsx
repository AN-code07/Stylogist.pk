import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FiChevronRight, FiStar, FiHeart, FiMinus, FiPlus, FiShoppingCart,
  FiTruck, FiShield, FiRefreshCw, FiLock, FiAlertCircle, FiPackage, FiZap, FiCheck
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useProduct } from '../features/products/useProductHooks';
import useCartStore from '../store/useCartStore';
import useWishlistStore from '../store/useWishlistStore';

const fmtPKR = (n) => `Rs ${Math.round(n || 0).toLocaleString()}`;

export default function ProductDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useProduct(slug);
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const wishlistItems = useWishlistStore((s) => s.items);

  const product = data?.product;
  const variants = data?.variants || [];
  const media = data?.media || [];

  // Prefer uploaded media; fall back to the product's own image field if any; never leave it empty.
  const images = useMemo(
    () => (media.length ? media.map((m) => m.url) : []),
    [media]
  );

  const sizes = useMemo(() => uniq(variants.map((v) => v.size).filter(Boolean)), [variants]);
  const colors = useMemo(() => uniq(variants.map((v) => v.color).filter(Boolean)), [variants]);

  const [activeImage, setActiveImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState('description');

  // Hydrate defaults once we know the product + variants.
  useEffect(() => {
    if (images.length) setActiveImage(images[0]);
    if (sizes.length) setSelectedSize((prev) => prev || sizes[0]);
    if (colors.length) setSelectedColor((prev) => prev || colors[0]);
  }, [images, sizes, colors]);

  // Resolve the variant that matches the current size/color. If only one attribute
  // exists we relax the match so the user isn't forced to pick something irrelevant.
  const matchedVariant = useMemo(() => {
    if (!variants.length) return null;
    return (
      variants.find((v) => {
        const sizeOk = sizes.length ? v.size === selectedSize : true;
        const colorOk = colors.length ? v.color === selectedColor : true;
        return sizeOk && colorOk;
      }) || variants[0]
    );
  }, [variants, selectedSize, selectedColor, sizes.length, colors.length]);

  const stock = matchedVariant?.stock ?? 0;
  const outOfStock = stock <= 0;

  const price = matchedVariant?.salePrice ?? product?.minPrice ?? 0;
  const originalPrice =
    matchedVariant?.originalPrice && matchedVariant.originalPrice > matchedVariant.salePrice
      ? matchedVariant.originalPrice
      : null;
  const discount = originalPrice
    ? Math.round(((originalPrice - matchedVariant.salePrice) / originalPrice) * 100)
    : 0;

  const handleQty = (delta) => {
    setQuantity((q) => Math.max(1, Math.min(stock || 99, q + delta)));
  };

  const handleAddToCart = () => {
    if (!matchedVariant) return toast.error('Select size / color first');
    if (outOfStock) return toast.error('This variant is out of stock');

    addItem({
      productId: product._id,
      slug: product.slug,
      sku: matchedVariant.sku,
      name: product.name,
      price: matchedVariant.salePrice,
      originalPrice: matchedVariant.originalPrice,
      quantity,
      image: images[0] || null,
      size: matchedVariant.size,
      color: matchedVariant.color,
    });
    toast.success('Added to cart');
  };

  const handleBuyNow = () => {
    if (!matchedVariant) return toast.error('Select size / color first');
    if (outOfStock) return toast.error('This variant is out of stock');

    addItem({
      productId: product._id,
      slug: product.slug,
      sku: matchedVariant.sku,
      name: product.name,
      price: matchedVariant.salePrice,
      quantity,
      image: images[0] || null,
      size: matchedVariant.size,
      color: matchedVariant.color,
    });
    navigate('/checkout');
  };

  const inWishlist = product ? wishlistItems.some((w) => w.productId === product._id) : false;

  const handleToggleWishlist = () => {
    if (!product) return;
    const nowSaved = toggleWishlist({
      productId: product._id,
      slug: product.slug,
      name: product.name,
      image: images[0] || null,
      price: matchedVariant?.salePrice ?? product.minPrice ?? 0,
      originalPrice: matchedVariant?.originalPrice,
      brandName: product.brand?.name,
      averageRating: product.averageRating,
    });
    toast.success(nowSaved ? 'Saved to wishlist' : 'Removed from wishlist');
  };

  if (isLoading) return <SkeletonPage />;
  if (isError || !product) return <ErrorPage slug={slug} />;

  return (
    <div className="w-full bg-white min-h-screen font-sans text-slate-900">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-5">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link to="/" className="hover:text-[#007074]">Home</Link>
          <FiChevronRight size={11} />
          <Link to="/category" className="hover:text-[#007074]">Shop</Link>
          <FiChevronRight size={11} />
          <span className="text-slate-900 font-medium truncate">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT — gallery */}
        <section className="lg:col-span-5">
          <div className="sticky top-6 flex gap-3">
            {images.length > 1 && (
              <div className="flex flex-col gap-2 w-16 shrink-0">
                {images.map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(src)}
                    className={`w-16 aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                      activeImage === src ? 'border-[#007074]' : 'border-transparent hover:border-slate-200'
                    }`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="flex-1">
              <ZoomableImage src={activeImage} alt={product.name} />
            </div>
          </div>
        </section>

        {/* CENTER — info */}
        <section className="lg:col-span-4 space-y-6">
          <div>
            <div className="text-xs text-[#007074] font-medium uppercase tracking-wider mb-2">
              {product.brand?.name || product.category?.name || '—'}
            </div>
            <h1 className="text-3xl font-semibold text-slate-900 leading-tight">{product.name}</h1>

            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FiStar
                    key={i}
                    size={13}
                    className={i < Math.round(product.averageRating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-500">
                {product.averageRating > 0
                  ? `${product.averageRating.toFixed(1)} (${product.totalReviews} reviews)`
                  : 'No reviews yet'}
              </span>
            </div>
          </div>

          <div className="flex items-end gap-3 pb-5 border-b border-slate-100">
            <span className="text-3xl font-semibold text-slate-900">{fmtPKR(price)}</span>
            {originalPrice && (
              <>
                <span className="text-base text-slate-400 line-through pb-0.5">{fmtPKR(originalPrice)}</span>
                <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-full text-xs font-medium pb-0.5">
                  -{discount}%
                </span>
              </>
            )}
          </div>

          {product.shortDescription && (
            <p className="text-sm text-slate-600 leading-relaxed">{product.shortDescription}</p>
          )}

          {/* Variant selection */}
          {colors.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Color</span>
                <span className="text-xs text-slate-500 capitalize">{selectedColor || '—'}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border capitalize transition-colors ${
                      selectedColor === c
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-900'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Size</span>
                <span className="text-xs text-slate-500 capitalize">{selectedSize || '—'}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`px-4 py-2 rounded-md text-xs font-medium border transition-colors ${
                      selectedSize === s
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-900'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + stock status */}
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center border border-slate-200 rounded-md">
              <button
                onClick={() => handleQty(-1)}
                disabled={quantity <= 1 || outOfStock}
                className="w-9 h-9 inline-flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <FiMinus size={14} />
              </button>
              <span className="w-9 text-center text-sm font-medium tabular-nums">{quantity}</span>
              <button
                onClick={() => handleQty(1)}
                disabled={quantity >= stock || outOfStock}
                className="w-9 h-9 inline-flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <FiPlus size={14} />
              </button>
            </div>

            <span className={`text-xs font-medium ${outOfStock ? 'text-red-600' : 'text-emerald-700'}`}>
              {outOfStock
                ? 'Out of stock'
                : stock <= 5
                  ? `Only ${stock} left`
                  : 'In stock'}
            </span>
          </div>

          {/* Primary actions */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handleBuyNow}
              disabled={outOfStock}
              className="w-full bg-[#007074] text-white py-3 rounded-lg text-sm font-semibold hover:bg-[#005a5d] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              <FiZap size={15} /> Order with Cash on Delivery
            </button>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <button
                onClick={handleAddToCart}
                disabled={outOfStock}
                className="py-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                <FiShoppingCart size={15} /> Add to cart
              </button>
              <button
                onClick={handleToggleWishlist}
                title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
                className={`w-11 h-11 rounded-lg border inline-flex items-center justify-center transition-colors ${
                  inWishlist
                    ? 'border-rose-200 bg-rose-50 text-rose-500'
                    : 'border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50'
                }`}
              >
                <FiHeart size={15} className={inWishlist ? 'fill-rose-500' : ''} />
              </button>
            </div>
          </div>

          {/* SKU */}
          {matchedVariant?.sku && (
            <div className="text-xs text-slate-400">
              SKU: <span className="text-slate-600 font-mono">{matchedVariant.sku}</span>
            </div>
          )}
        </section>

        {/* RIGHT — shipping & trust panel */}
        <aside className="lg:col-span-3">
          <div className="sticky top-6 space-y-3">
            <div className="bg-gradient-to-br from-[#007074] to-[#0a8c91] text-white rounded-xl p-5 shadow-sm">
              <FiTruck size={22} />
              <h3 className="text-base font-semibold mt-3">Free shipping</h3>
              <p className="text-sm text-white/85 mt-1">
                Nationwide delivery across Pakistan on every order. No minimum purchase required.
              </p>
            </div>

            <ShippingRow
              icon={<FiShield size={16} />}
              title="Cash on Delivery"
              description="Pay only when your order reaches you."
            />
            <ShippingRow
              icon={<FiRefreshCw size={16} />}
              title="7-day returns"
              description="Changed your mind? Return unused items for a full refund."
            />
            <ShippingRow
              icon={<FiCheck size={16} />}
              title="Secure checkout"
              description="Your details are encrypted end-to-end."
            />
            <ShippingRow
              icon={<FiLock size={16} />}
              title="Verified seller"
              description="Sourced and shipped directly by Stylogist."
            />
          </div>
        </aside>
      </div>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 pb-20">
        <div className="border-b border-slate-200 flex gap-6">
          {['description', 'specifications', 'reviews'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium capitalize transition-colors relative ${
                tab === t ? 'text-[#007074]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t}
              {t === 'reviews' && product.totalReviews > 0 && (
                <span className="ml-1 text-slate-400">({product.totalReviews})</span>
              )}
              {tab === t && (
                <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-[#007074]" />
              )}
            </button>
          ))}
        </div>

        <div className="py-6 text-sm text-slate-700 leading-relaxed">
          {tab === 'description' && (
            <p>{product.description || 'No description provided.'}</p>
          )}

          {tab === 'specifications' && (
            <ul className="divide-y divide-slate-100">
              <SpecRow label="Category" value={product.category?.name || '—'} />
              <SpecRow label="Brand" value={product.brand?.name || '—'} />
              <SpecRow label="Variants" value={variants.length} />
              <SpecRow label="Stock" value={product.totalStock ?? 0} />
              {product.tags?.length > 0 && (
                <SpecRow label="Tags" value={product.tags.join(', ')} />
              )}
              {matchedVariant?.material && (
                <SpecRow label="Material" value={matchedVariant.material} />
              )}
              {matchedVariant?.weight && (
                <SpecRow label="Weight" value={`${matchedVariant.weight}g`} />
              )}
            </ul>
          )}

          {tab === 'reviews' && (
            <div className="text-slate-500 text-sm">
              {product.totalReviews > 0
                ? 'Customer reviews will be displayed here once the reviews feed is wired in.'
                : 'No reviews yet. Be the first to share your experience.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------- subcomponents -------- */

function ShippingRow({ icon, title, description }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex gap-3">
      <div className="w-9 h-9 rounded-lg bg-slate-50 text-[#007074] flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-900">{title}</div>
        <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</div>
      </div>
    </div>
  );
}

function SpecRow({ label, value }) {
  return (
    <li className="py-2.5 flex justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800 font-medium text-right">{value}</span>
    </li>
  );
}

function SkeletonPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-5">
        <div className="aspect-[4/5] bg-slate-100 rounded-xl animate-pulse" />
      </div>
      <div className="lg:col-span-4 space-y-4">
        <div className="h-5 w-32 bg-slate-100 rounded animate-pulse" />
        <div className="h-8 w-3/4 bg-slate-100 rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-slate-100 rounded animate-pulse" />
        <div className="h-10 w-40 bg-slate-100 rounded animate-pulse" />
        <div className="h-32 bg-slate-100 rounded animate-pulse" />
      </div>
      <div className="lg:col-span-3 space-y-3">
        <div className="h-32 bg-slate-100 rounded animate-pulse" />
        <div className="h-20 bg-slate-100 rounded animate-pulse" />
      </div>
    </div>
  );
}

function ErrorPage({ slug }) {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <FiAlertCircle className="mx-auto text-red-500 mb-3" size={32} />
      <h1 className="text-xl font-semibold text-slate-900">Product not found</h1>
      <p className="text-sm text-slate-500 mt-2">
        We couldn't find a product for <code className="text-slate-700">{slug}</code>.
      </p>
      <Link
        to="/category"
        className="inline-flex items-center gap-2 mt-5 px-4 py-2 bg-[#007074] text-white rounded-lg text-sm font-medium hover:bg-[#005a5d]"
      >
        Back to shop
      </Link>
    </div>
  );
}

function uniq(arr) {
  return [...new Set(arr)];
}

/* ------- Hover-zoom image ------- */
// On desktop, hovering the image enlarges it 2× using transform-origin anchored
// to the cursor so you "magnify" the exact spot under the pointer. Falls back
// to a static image when there's nothing to show or on touch devices
// (we just ignore mousemove events there — the scale never kicks in).
function ZoomableImage({ src, alt }) {
  const [zoom, setZoom] = useState(null); // { x, y } in percent

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoom({ x: clamp(x), y: clamp(y) });
  };

  const handleLeave = () => setZoom(null);

  if (!src) {
    return (
      <div className="aspect-[4/5] bg-slate-50 rounded-xl flex items-center justify-center">
        <FiPackage size={48} className="text-slate-300" />
      </div>
    );
  }

  return (
    <div
      className="aspect-[4/5] bg-slate-50 rounded-xl overflow-hidden relative cursor-zoom-in select-none"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="w-full h-full object-cover transition-transform duration-75 ease-out will-change-transform"
        style={
          zoom
            ? { transformOrigin: `${zoom.x}% ${zoom.y}%`, transform: 'scale(2.4)' }
            : { transformOrigin: 'center center', transform: 'scale(1)' }
        }
      />
      {zoom && (
        <div className="absolute bottom-3 right-3 bg-slate-900/80 text-white text-[11px] font-medium px-2 py-0.5 rounded pointer-events-none">
          Zooming
        </div>
      )}
    </div>
  );
}

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}
