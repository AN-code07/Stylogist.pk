import React, { useMemo, useState, useEffect, useRef, memo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FiChevronRight, FiStar, FiHeart, FiMinus, FiPlus, FiShoppingCart,
  FiTruck, FiShield, FiRefreshCw, FiLock, FiAlertCircle, FiPackage, FiZap, FiCheck,
  FiShare2, FiClock, FiAward, FiCopy
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useProduct } from '../features/products/useProductHooks';
import useCartStore from '../store/useCartStore';
import useWishlistStore from '../store/useWishlistStore';
import Seo from '../components/common/Seo';
import ReviewsSection from '../components/product/ReviewsSection';
import { resolveImageUrl } from '../utils/imageUrl';

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
    () => (media.length ? media.map((m) => resolveImageUrl(m.url)) : []),
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

  const seoTitle = product?.metaTitle?.trim() || (product ? `${product.name} | Stylogist` : '');
  const seoDescription = product
    ? product.metaDescription?.trim() ||
    stripHtml(product.shortDescription) ||
    stripHtml(product.description).slice(0, 160)
    : '';

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

  const productJsonLd = useMemo(() => {
    if (!product) return null;
    const canonicalUrl = typeof window !== 'undefined' ? window.location.href : undefined;
    const anyInStock = variants.some((v) => (v.stock ?? 0) > 0);
    const offers = variants.length
      ? variants.map((v) => ({
        '@type': 'Offer',
        sku: v.sku,
        price: v.salePrice,
        priceCurrency: 'PKR',
        availability:
          (v.stock ?? 0) > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
        url: canonicalUrl,
      }))
      : undefined;
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: seoDescription,
      image: images,
      sku: matchedVariant?.sku || undefined,
      brand: product.brand?.name ? { '@type': 'Brand', name: product.brand.name } : undefined,
      category: product.category?.name || undefined,
      url: canonicalUrl,
      aggregateRating:
        product.averageRating && product.totalReviews
          ? {
            '@type': 'AggregateRating',
            ratingValue: product.averageRating,
            reviewCount: product.totalReviews,
          }
          : undefined,
      offers: offers || {
        '@type': 'Offer',
        price: product.minPrice || 0,
        priceCurrency: 'PKR',
        availability: anyInStock
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        url: canonicalUrl,
      },
    };
  }, [product, variants, images, matchedVariant, seoDescription]);

  const lowStock = !outOfStock && stock <= 5;

  const price = matchedVariant?.salePrice ?? product?.minPrice ?? 0;
  const originalPrice =
    matchedVariant?.originalPrice && matchedVariant.originalPrice > matchedVariant.salePrice
      ? matchedVariant.originalPrice
      : null;
  const discount = originalPrice
    ? Math.round(((originalPrice - matchedVariant.salePrice) / originalPrice) * 100)
    : 0;
  const savings = originalPrice ? originalPrice - matchedVariant.salePrice : 0;

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

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: product?.name,
      text: product?.shortDescription ? stripHtml(product.shortDescription) : product?.name,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      }
    } catch {
      /* user dismissed – ignore */
    }
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
    <div className="w-full bg-[#FDFDFD] min-h-screen font-sans text-[#222]">
      <Seo
        title={seoTitle}
        description={seoDescription}
        image={images[0]}
        type="product"
        canonical={typeof window !== 'undefined' ? window.location.href : undefined}
        jsonLd={productJsonLd}
        jsonLdId={`product-${product?._id}`}
      />
      {/* Top announcement bar */}
      <div className="bg-[#222] text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-2.5 flex flex-wrap items-center justify-center gap-x-8 gap-y-1.5 text-[10px] font-black uppercase tracking-[0.25em]">
          <span className="inline-flex items-center gap-1.5">
            <FiTruck size={12} className="text-[#7FD4D7]" /> Free shipping nationwide
          </span>
          <span className="hidden md:inline text-white/30">·</span>
          <span className="inline-flex items-center gap-1.5">
            <FiShield size={12} className="text-[#7FD4D7]" /> Cash on delivery
          </span>
          <span className="hidden md:inline text-white/30">·</span>
          <span className="inline-flex items-center gap-1.5">
            <FiRefreshCw size={12} className="text-[#7FD4D7]" /> 7-day returns
          </span>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-5">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-semibold">
          <Link to="/" className="hover:text-[#007074]">Home</Link>
          <FiChevronRight size={11} />
          <Link to="/category" className="hover:text-[#007074]">Shop</Link>
          <FiChevronRight size={11} />
          <span className="text-[#222] truncate">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* LEFT — gallery (ANIMATED) */}
        <ScrollReveal as="section" className="lg:col-span-5">
          <div className="sticky top-6 flex gap-3">
            {images.length > 1 && (
              <div className="flex flex-col gap-2 w-16 shrink-0">
                {images.map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(src)}
                    aria-label={`View image ${idx + 1}`}
                    aria-pressed={activeImage === src}
                    className={`w-16 aspect-square rounded-xl overflow-hidden border p-1 bg-white shadow-sm transition-all ${activeImage === src
                      ? 'border-[#007074] shadow-md -translate-y-0.5'
                      : 'border-gray-100 hover:border-[#007074]/40'
                      }`}
                  >
                    <div className="w-full h-full bg-[#F7F3F0] rounded-lg overflow-hidden">
                      <img
                        src={src}
                        alt={`${product.name} thumbnail ${idx + 1}`}
                        width="64"
                        height="64"
                        loading="lazy"
                        decoding="async"
                        className="pdp-crisp w-full h-full object-cover"
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="flex-1 relative">
              <ZoomableImage src={activeImage} alt={product.name} />

              <div className="absolute top-5 left-5 flex flex-col gap-1.5 z-10">
                {product.isFeatured && (
                  <span className="bg-[#222] text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-[0.2em] shadow-md inline-flex items-center gap-1">
                    <FiAward size={10} /> Featured
                  </span>
                )}
                {discount > 0 && (
                  <span className="bg-[#007074] text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-[0.2em] shadow-md">
                    Save {discount}%
                  </span>
                )}
              </div>

              {images.length > 1 && (
                <div className="absolute bottom-5 right-5 bg-white/95 backdrop-blur-sm text-[#222] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-sm border border-gray-100 z-10">
                  {images.indexOf(activeImage) + 1} / {images.length}
                </div>
              )}
            </div>
          </div>
        </ScrollReveal>

        {/* CENTER — info (ANIMATED) */}
        <ScrollReveal as="section" className="lg:col-span-4 space-y-6" delay={100}>
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-500 mb-3">
              {product.brand?.name || product.category?.name || '—'}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-black text-[#222] leading-tight tracking-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FiStar
                    key={i}
                    size={12}
                    className={i < Math.round(product.averageRating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
                  />
                ))}
              </div>
              <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-semibold">
                {product.averageRating > 0
                  ? `${product.averageRating.toFixed(1)} · ${product.totalReviews} reviews`
                  : 'No reviews yet'}
              </span>
            </div>
          </div>

          <div className="pb-5 border-b border-gray-100">
            <div className="flex items-end gap-3 flex-wrap">
              <span className="text-3xl md:text-4xl font-black text-[#007074] tracking-tight">{fmtPKR(price)}</span>
              {originalPrice && (
                <>
                  <span className="text-base text-gray-300 line-through font-bold pb-1">{fmtPKR(originalPrice)}</span>
                  <span className="bg-[#F7F3F0] text-[#007074] border border-[#007074]/15 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest pb-0.5">
                    -{discount}%
                  </span>
                </>
              )}
            </div>
            {savings > 0 && (
              <p className="text-[11px] text-[#007074] mt-2 font-semibold">
                You save <span className="font-black">{fmtPKR(savings)}</span> on this order
              </p>
            )}
            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-[0.15em] font-semibold">
              Inclusive of all taxes
            </p>
          </div>

          {product.shortDescription && (
            <div
              className="product-rich text-sm text-gray-500 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: product.shortDescription }}
            />
          )}

          {/* Variant selection */}
          {colors.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">Color</span>
                <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-semibold">{selectedColor || '—'}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border transition-all ${selectedColor === c
                      ? 'bg-[#222] text-white border-[#222] shadow-sm'
                      : 'bg-white text-[#222] border-gray-200 hover:border-[#222]'
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
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">Size</span>
                <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-semibold">{selectedSize || '—'}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`min-w-[44px] px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border transition-all ${selectedSize === s
                      ? 'bg-[#222] text-white border-[#222] shadow-sm'
                      : 'bg-white text-[#222] border-gray-200 hover:border-[#222]'
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + stock status */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">Quantity</span>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${outOfStock ? 'text-red-500' : 'text-[#007074]'}`}>
                {outOfStock ? 'Out of stock' : lowStock ? `Only ${stock} left` : 'In stock'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center border border-gray-200 rounded-full bg-white">
                <button
                  onClick={() => handleQty(-1)}
                  disabled={quantity <= 1 || outOfStock}
                  className="w-10 h-10 inline-flex items-center justify-center text-[#222] hover:text-[#007074] disabled:opacity-30"
                >
                  <FiMinus size={14} />
                </button>
                <span className="w-9 text-center text-sm font-black tabular-nums text-[#222]">{quantity}</span>
                <button
                  onClick={() => handleQty(1)}
                  disabled={quantity >= stock || outOfStock}
                  className="w-10 h-10 inline-flex items-center justify-center text-[#222] hover:text-[#007074] disabled:opacity-30"
                >
                  <FiPlus size={14} />
                </button>
              </div>
              {lowStock && (
                <div className="flex-1 min-w-0">
                  <div className="h-1.5 bg-[#F7F3F0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#007074] to-[#0a8c91] transition-all"
                      style={{ width: `${Math.max(10, (stock / 10) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 font-semibold">
                    Selling fast · grab yours before it's gone
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Primary actions */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handleBuyNow}
              disabled={outOfStock}
              className="w-full bg-[#222] text-white py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#007074] transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shadow-sm hover:shadow-lg"
            >
              <FiZap size={14} /> Order with Cash on Delivery
            </button>
            <div className="grid grid-cols-[1fr_auto_auto] gap-2">
              <button
                onClick={handleAddToCart}
                disabled={outOfStock}
                className="py-3.5 rounded-xl border border-gray-200 bg-white text-[11px] font-black uppercase tracking-[0.2em] text-[#222] hover:border-[#222] disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                <FiShoppingCart size={14} /> Add to cart
              </button>
              <button
                onClick={handleToggleWishlist}
                title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
                className={`w-12 h-12 rounded-xl border inline-flex items-center justify-center transition-all ${inWishlist
                  ? 'border-[#007074]/30 bg-[#F7F3F0] text-[#007074]'
                  : 'border-gray-200 bg-white text-gray-500 hover:text-[#007074] hover:border-[#007074]/40'
                  }`}
              >
                <FiHeart size={15} className={inWishlist ? 'fill-[#007074]' : ''} />
              </button>
              <button
                onClick={handleShare}
                title="Share this product"
                className="w-12 h-12 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-[#007074] hover:border-[#007074]/40 inline-flex items-center justify-center transition-all"
              >
                <FiShare2 size={15} />
              </button>
            </div>
          </div>

          {/* Compact trust strip */}
          <div className="grid grid-cols-2 gap-2">
            <TrustPill icon={<FiShield size={14} />} label="Cash on Delivery" />
            <TrustPill icon={<FiRefreshCw size={14} />} label="7-day returns" />
            <TrustPill icon={<FiLock size={14} />} label="Secure checkout" />
            <TrustPill icon={<FiCheck size={14} />} label="Verified seller" />
          </div>

          {/* SKU */}
          {matchedVariant?.sku && (
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100">
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-semibold">
                SKU <span className="text-gray-600 font-mono tracking-normal normal-case ml-1">{matchedVariant.sku}</span>
              </span>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(matchedVariant.sku);
                    toast.success('SKU copied');
                  } catch { /* ignore */ }
                }}
                className="text-gray-500 hover:text-[#007074] transition-colors"
                title="Copy SKU"
              >
                <FiCopy size={12} />
              </button>
            </div>
          )}
        </ScrollReveal>

        {/* RIGHT — delivery + highlights side panel (ANIMATED) */}
        <ScrollReveal as="aside" className="lg:col-span-3" delay={200}>
          <div className="sticky top-6 space-y-4">
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-[#F7F3F0] px-5 py-3 border-b border-gray-100">
                <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#222]">Order summary</h2>
              </div>
              <div className="p-5 space-y-3 text-sm">
                <SummaryRow label="Item price" value={fmtPKR(price)} />
                <SummaryRow label="Quantity" value={`× ${quantity}`} />
                <SummaryRow label="Shipping" value={<span className="text-[#007074] font-black uppercase text-[10px] tracking-[0.2em]">Free</span>} />
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Total</span>
                  <span className="text-xl font-black text-[#007074]">{fmtPKR(price * quantity)}</span>
                </div>
                {savings > 0 && (
                  <p className="text-[10px] text-[#007074] bg-[#F7F3F0] border border-[#007074]/15 rounded-lg px-3 py-2 font-semibold text-center">
                    You save {fmtPKR(savings * quantity)} on this order
                  </p>
                )}
                <button
                  onClick={handleBuyNow}
                  disabled={outOfStock}
                  className="w-full mt-2 bg-[#007074] text-white py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#005a5d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  <FiZap size={14} /> Buy now
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={outOfStock}
                  className="w-full bg-white text-[#222] border border-slate-200 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] hover:border-[#222] transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  <FiShoppingCart size={14} /> Add to cart
                </button>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* Tabs / Bottom Sections */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 pb-20 space-y-16">

        {/* ✅ DESCRIPTION (ANIMATED) */}
        <ScrollReveal as="section">
          <h2 className="text-xl font-bold text-[#222] mb-4">Product Details</h2>
          {product.description ? (
            <div
              className="prose max-w-none text-gray-600 break-words"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          ) : (
            <p className="text-gray-500">No description available.</p>
          )}
        </ScrollReveal>

        {/* ✅ KEY HIGHLIGHTS (ANIMATED) */}
        <ScrollReveal as="section">
          <h2 className="text-xl font-bold text-[#222] mb-4">Key Highlights</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
            {product.brand?.name && <li>✔ Brand: {product.brand.name}</li>}
            {matchedVariant?.material && <li>✔ Material: {matchedVariant.material}</li>}
            {matchedVariant?.weight && <li>✔ Weight: {matchedVariant.weight}g</li>}
            <li>✔ Total Stock: {product.totalStock ?? 0}</li>
            <li>✔ Variants: {variants.length}</li>
            {product.averageRating && <li>✔ Rating: {product.averageRating.toFixed(1)} / 5</li>}
          </ul>
        </ScrollReveal>

        {/* ✅ SPECIFICATIONS (ANIMATED) */}
        <ScrollReveal as="section">
          <h2 className="text-xl font-bold text-[#222] mb-4">Specifications</h2>
          <ul className="divide-y divide-gray-100 text-sm">
            <SpecRow label="Brand" value={product.brand?.name || '—'} />
            {matchedVariant?.material && (
              <SpecRow label="Material" value={matchedVariant.material} />
            )}
            {matchedVariant?.weight && (
              <SpecRow label="Weight" value={`${matchedVariant.weight}g`} />
            )}
            <SpecRow label="Total Stock" value={product.totalStock ?? 0} />
            <SpecRow label="Variants" value={variants.length} />
            <SpecRow
              label="Price"
              value={
                product.minPrice === product.maxPrice
                  ? fmtPKR(product.minPrice)
                  : `${fmtPKR(product.minPrice)} – ${fmtPKR(product.maxPrice)}`
              }
            />
          </ul>
        </ScrollReveal>

        {/* ✅ VARIANTS TABLE (ANIMATED) */}
        {variants.length > 0 && (
          <ScrollReveal as="section">
            <h2 className="text-xl font-bold text-[#222] mb-4">Available Variants</h2>
            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="text-left px-4 py-3">SKU</th>
                    <th className="text-left px-4 py-3">Size</th>
                    <th className="text-left px-4 py-3">Color</th>
                    <th className="text-right px-4 py-3">Price</th>
                    <th className="text-right px-4 py-3">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {variants.map((v) => (
                    <tr key={v._id || v.sku}>
                      <td className="px-4 py-3 font-mono text-xs">{v.sku || '—'}</td>
                      <td className="px-4 py-3 capitalize">{v.size || '—'}</td>
                      <td className="px-4 py-3 capitalize">{v.color || '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {fmtPKR(v.salePrice)}
                      </td>
                      <td className={`px-4 py-3 text-right ${v.stock === 0 ? 'text-red-500' : ''}`}>
                        {v.stock ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>
        )}

        {/* ✅ REVIEWS (ANIMATED) */}
        <ScrollReveal as="section">
          <h2 className="text-xl font-bold text-[#222] mb-4">Customer Reviews</h2>
          <ReviewsSection product={product} />
        </ScrollReveal>

      </div>
    </div>
  );
}

/* -------- Utility Hooks & Components -------- */

/**
 * ScrollReveal Wrapper Component 
 * Uses Intersection Observer to add 'opacity-100 translate-y-0' 
 * smoothly when the user scrolls the element into view.
 */
const ScrollReveal = memo(function ScrollReveal({ children, className = "", as: Component = "div", delay = 0 }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px" // Trigger slightly before the element fully hits the viewport bottom
      }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Component
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transform transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
        } ${className}`}
    >
      {children}
    </Component>
  );
});

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// React.memo applied to purely visual subcomponents to prevent them from re-rendering 
// when the parent state (like "quantity" or "selectedSize") updates.
const TrustPill = memo(function TrustPill({ icon, label }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5 flex items-center gap-2 hover:border-[#007074]/30 transition-colors">
      <span className="text-[#007074] flex-shrink-0">{icon}</span>
      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#222] truncate">{label}</span>
    </div>
  );
});

const SummaryRow = memo(function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] uppercase tracking-[0.15em] text-gray-500 font-semibold">{label}</span>
      <span className="text-sm font-bold text-[#222]">{value}</span>
    </div>
  );
});

const SpecRow = memo(function SpecRow({ label, value }) {
  return (
    <li className="py-3 flex justify-between gap-4 text-sm">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{label}</span>
      <span className="text-[#222] font-semibold text-right">{value}</span>
    </li>
  );
});

function SkeletonPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#FDFDFD]">
      <div className="lg:col-span-5">
        <div className="aspect-[4/5] bg-[#F7F3F0] rounded-[2rem] animate-pulse" />
      </div>
      <div className="lg:col-span-4 space-y-4">
        <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
        <div className="h-8 w-3/4 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
        <div className="h-10 w-40 bg-gray-100 rounded animate-pulse" />
        <div className="h-32 bg-gray-100 rounded animate-pulse" />
      </div>
      <div className="lg:col-span-3 space-y-3">
        <div className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}

function ErrorPage({ slug }) {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center bg-[#FDFDFD]">
      <FiAlertCircle className="mx-auto text-[#007074] mb-3" size={32} />
      <h1 className="font-serif text-2xl font-black text-[#222]">Product not found</h1>
      <p className="text-sm text-gray-500 mt-2">
        We couldn't find a product for <code className="text-[#222]">{slug}</code>.
      </p>
      <Link
        to="/category"
        className="inline-flex items-center gap-2 mt-6 px-5 py-3 bg-[#222] text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#007074] transition-colors"
      >
        Back to shop
      </Link>
    </div>
  );
}

function uniq(arr) {
  return [...new Set(arr)];
}

// React.memo applied to the heaviest subcomponent on the page. 
// Prevents the hover/zoom image from re-evaluating when the user simply clicks '+' on the quantity box.
const ZoomableImage = memo(function ZoomableImage({ src, alt }) {
  const [zoom, setZoom] = useState(null);

  const handleMove = (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoom({ x: clamp(x), y: clamp(y) });
  };
  const handleLeave = () => setZoom(null);

  if (!src) {
    return (
      <div className="aspect-[4/5] bg-white border border-gray-100 rounded-[2rem] p-2 shadow-sm">
        <div className="w-full h-full bg-[#F7F3F0] rounded-[1.5rem] flex items-center justify-center">
          <FiPackage size={48} className="text-gray-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="group aspect-[4/5] bg-white border border-gray-100 rounded-[2rem] p-2 shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-0.5">
      <div
        className="relative w-full h-full bg-[#F7F3F0] rounded-[1.5rem] overflow-hidden cursor-zoom-in select-none"
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
      >
        <img
          src={src}
          alt={alt}
          width="800"
          height="1000"
          draggable={false}
          loading="eager"
          fetchpriority="high"
          decoding="async"
          className={`pdp-crisp w-full h-full object-cover transition-[opacity,transform] duration-500 group-hover:scale-[1.03] ${zoom ? 'opacity-0' : 'opacity-100'}`}
        />
        {zoom && (
          <div
            className="absolute inset-0 bg-no-repeat"
            style={{
              backgroundImage: `url(${src})`,
              backgroundSize: '200%',
              backgroundPosition: `${zoom.x}% ${zoom.y}%`,
              imageRendering: 'auto',
            }}
          />
        )}
      </div>
    </div>
  );
});

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}