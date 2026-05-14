import React, { useMemo, useState, useEffect, useRef, memo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FiChevronRight, FiStar, FiHeart, FiMinus, FiPlus, FiShoppingCart,
  FiTruck, FiShield, FiRefreshCw, FiLock, FiAlertCircle, FiPackage, FiZap, FiCheck,
  FiShare2, FiClock, FiAward, FiCopy, FiChevronDown
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useProduct, useProductsSearch } from '../features/products/useProductHooks';
import useCartStore from '../store/useCartStore';
import useWishlistStore from '../store/useWishlistStore';
import Seo from '../components/common/Seo';
import ReviewsSection from '../components/product/ReviewsSection';
import MobileBuyBar from '../components/product/MobileBuyBar';
import StorefrontProductCard from '../components/common/StorefrontProductCard';
import { resolveImageUrl } from '../utils/imageUrl';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import {
  buildProductTitle,
  buildProductDescription,
  buildProductImageAlt,
} from '../features/products/buildProductSeo';
import { trackViewItem, trackAddToCart } from '../utils/analytics';

const fmtPKR = (n) => `Rs ${Math.round(n || 0).toLocaleString()}`;

// Store-wide shipping + return defaults — a Pakistan-only COD storefront
// with free nationwide delivery and a 7-day return window. These are the
// same constants the Vercel prerender (api/product.js) emits, mirrored
// here so the client-side placeholder schema matches.
const STORE_SHIPPING_DETAILS = {
  '@type': 'OfferShippingDetails',
  shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'PKR' },
  shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'PK' },
  deliveryTime: {
    '@type': 'ShippingDeliveryTime',
    handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
    transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 5, unitCode: 'DAY' },
  },
};
const STORE_RETURN_POLICY = {
  '@type': 'MerchantReturnPolicy',
  applicableCountry: 'PK',
  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
  merchantReturnDays: 7,
  returnMethod: 'https://schema.org/ReturnByMail',
  returnFees: 'https://schema.org/FreeReturn',
};

// Placeholder Product JSON-LD used during loading + error states. Crawlers
// (Googlebot, Bing, Twitter) often capture the DOM mid-fetch or while the
// Render API is cold-starting; without a stub Product schema they index
// nothing. We emit a minimal Product with an Offer because Google's Product
// rich-result validator requires at least one of `offers`, `review`, or
// `aggregateRating`. The price is intentionally `0` with `availability:
// InStock` so the page is valid Product schema without claiming a real
// merchant price — when the API responds the real schema overwrites this
// via the `product-jsonld` data-seo id. `review` / `aggregateRating` are
// deliberately omitted: they require real review data and must never be
// faked.
const buildPlaceholderProductJsonLd = ({ name, origin, canonical }) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: name || 'Product',
  description: `Shop ${name || 'this product'} on HarbalMart.pk — free shipping & cash on delivery in Pakistan.`,
  image: origin ? [`${origin}/logo.png`] : undefined,
  brand: { '@type': 'Brand', name: 'Stylogist' },
  url: canonical,
  offers: {
    '@type': 'Offer',
    url: canonical,
    priceCurrency: 'PKR',
    price: 0,
    availability: 'https://schema.org/InStock',
    itemCondition: 'https://schema.org/NewCondition',
    shippingDetails: STORE_SHIPPING_DETAILS,
    hasMerchantReturnPolicy: STORE_RETURN_POLICY,
  },
});

// Benefits + uses now serialise as { image, items: string[] } — one section
// banner plus a flat bullet list. Older docs in the catalogue still carry
// the legacy [{text, image}] array (or even plain string[]) shape, so this
// helper accepts all three and produces the canonical render shape.
// The first non-empty per-row image on a legacy array is promoted to the
// section banner.
const readSectionBlock = (raw) => {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return {
      image: typeof raw.image === 'string' ? raw.image : '',
      items: Array.isArray(raw.items)
        ? raw.items.map((s) => (s || '').toString()).filter((s) => s.trim())
        : [],
    };
  }
  if (Array.isArray(raw)) {
    let firstImage = '';
    const items = [];
    for (const row of raw) {
      if (typeof row === 'string') {
        const t = row.trim();
        if (t) items.push(t);
      } else if (row && typeof row === 'object') {
        const t = (row.text || '').toString().trim();
        if (t) items.push(t);
        if (!firstImage && row.image) firstImage = String(row.image);
      }
    }
    return { image: firstImage, items };
  }
  return { image: '', items: [] };
};

export default function ProductDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useProduct(slug);

  // Renamed-slug detection. The backend sends `{ __redirect: '/product/X' }`
  // when the requested slug has been retired. We navigate via an effect so
  // we don't break the Rules of Hooks (React still has to call every hook
  // below this line on the redirect render).
  useEffect(() => {
    if (data?.__redirect) {
      navigate(data.__redirect, { replace: true });
    }
  }, [data?.__redirect, navigate]);
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
  const packSizes = useMemo(() => uniq(variants.map((v) => v.packSize).filter(Boolean)), [variants]);
  // Distinct potency values across the product's variants. We dedupe via
  // the same legacy-fallback resolver used elsewhere on the PDP, so old
  // catalogue rows that still carry text in `ingredients`/`material` show
  // up as a clickable strength chip instead of disappearing.
  const potencies = useMemo(
    () =>
      uniq(
        variants
          .map((v) => v?.potency || v?.ingredients || v?.material || '')
          .filter(Boolean)
      ),
    [variants]
  );

  const [activeImage, setActiveImage] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedPackSize, setSelectedPackSize] = useState(null);
  const [selectedPotency, setSelectedPotency] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Hydrate defaults once we know the product + variants.
  useEffect(() => {
    if (images.length) setActiveImage(images[0]);
    if (sizes.length) setSelectedSize((prev) => prev || sizes[0]);
    if (colors.length) setSelectedColor((prev) => prev || colors[0]);
    if (packSizes.length) setSelectedPackSize((prev) => prev || packSizes[0]);
    if (potencies.length) setSelectedPotency((prev) => prev || potencies[0]);
  }, [images, sizes, colors, packSizes, potencies]);

  // GA4 view_item — fires once per product slug load. Keyed on the
  // product id (not slug) so a rename-redirect doesn't double-fire.
  useEffect(() => {
    if (product?._id) trackViewItem(product);
  }, [product?._id]);

  // Title + description are produced by buildProductSeo() so when the
  // admin leaves the meta fields blank we still get keyword-shaped,
  // length-clamped copy ("… Original Imported X in Pakistan", 50–65 chars
  // / 150–158 chars). Admin-supplied meta wins when present.
  const seoTitle = product ? buildProductTitle(product) : '';
  const seoDescription = product ? buildProductDescription(product) : '';

  // Resolve the variant's potency label. New rows persist the value under
  // `potency`; legacy variants carried the same idea inside the now-retired
  // `ingredients` / `material` fields, so we fall back through them so old
  // catalogue data still renders without an admin re-save. Hoisted above
  // matchedVariant because the matcher reads it.
  const variantPotency = (v) => v?.potency || v?.ingredients || v?.material || '';

  const matchedVariant = useMemo(() => {
    if (!variants.length) return null;
    return (
      variants.find((v) => {
        const sizeOk = sizes.length ? v.size === selectedSize : true;
        const colorOk = colors.length ? v.color === selectedColor : true;
        const packOk = packSizes.length ? v.packSize === selectedPackSize : true;
        // Potency contributes to the match the same way size/color do, so
        // switching strength chips reprices the buy block immediately.
        const potencyOk = potencies.length ? variantPotency(v) === selectedPotency : true;
        return sizeOk && colorOk && packOk && potencyOk;
      }) || variants[0]
    );
  }, [variants, selectedSize, selectedColor, selectedPackSize, selectedPotency, sizes.length, colors.length, packSizes.length, potencies.length]);

  const stock = matchedVariant?.stock ?? 0;
  const outOfStock = stock <= 0;

  const productJsonLd = useMemo(() => {
    if (!product) return null;
    const canonicalUrl = typeof window !== 'undefined' ? window.location.href : undefined;
    const anyInStock = variants.some((v) => (v.stock ?? 0) > 0);

    // UPC-only catalogue: `barcode` is enforced to 12 digits at the form
    // and validator level, so we always emit it as `gtin12`.
    const barcode = (product.barcode || '').replace(/\D/g, '');
    const gtinKey = barcode.length === 12 ? 'gtin12' : null;

    // Shipping + return policy stubs — emitted on every Offer so Google
    // Merchant listings validates without "Missing shippingDetails" /
    // "Missing hasMerchantReturnPolicy" warnings. Defaults reflect the
    // store's COD-only Pakistan shipping & 7-day return policy.
    const shippingDetails = {
      '@type': 'OfferShippingDetails',
      shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'PKR' },
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'PK' },
      deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
        transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 5, unitCode: 'DAY' },
      },
    };
    const merchantReturnPolicy = {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'PK',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 7,
      returnMethod: 'https://schema.org/ReturnByMail',
      returnFees: 'https://schema.org/FreeReturn',
    };

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
        shippingDetails,
        hasMerchantReturnPolicy: merchantReturnPolicy,
      }))
      : undefined;

    const json = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: seoDescription,
      image: images,
      sku: matchedVariant?.sku || undefined,
      mpn: matchedVariant?.sku || undefined,
      brand: product.brand?.name ? { '@type': 'Brand', name: product.brand.name } : undefined,
      // Schema.org models manufacturer as a separate Organization. Google
      // uses this distinct from `brand` for product knowledge panels and
      // shopping rich results — surfacing it lifts trust signals.
      manufacturer: product.manufacturer
        ? { '@type': 'Organization', name: product.manufacturer }
        : undefined,
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
        shippingDetails,
        hasMerchantReturnPolicy: merchantReturnPolicy,
      },
    };

    if (gtinKey) json[gtinKey] = barcode;

    // Promote the structured supplement-style attributes (form, dosage, age
    // range) into Schema.org additionalProperty entries so Google can index
    // them under product spec snippets.
    const additional = [];
    const id = product.itemDetails || {};
    if (id.itemForm) additional.push({ '@type': 'PropertyValue', name: 'Item form', value: id.itemForm });
    if (id.containerType) additional.push({ '@type': 'PropertyValue', name: 'Container type', value: id.containerType });
    if (id.ageRange) additional.push({ '@type': 'PropertyValue', name: 'Age range', value: id.ageRange });
    if (id.dosageForm) additional.push({ '@type': 'PropertyValue', name: 'Dosage form', value: id.dosageForm });
    if (additional.length) json.additionalProperty = additional;

    return json;
  }, [product, variants, images, matchedVariant, seoDescription]);

  // HowTo schema — emitted only when the product has a "How to use"
  // body. Google can render HowTo as a rich result with step counts.
  // We split the body on newlines / sentences as a best-effort step
  // segmentation since the admin field is currently rich-text rather
  // than structured steps.
  const howToJsonLd = useMemo(() => {
    if (!product?.howToUse?.text) return null;
    const stripped = product.howToUse.text
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!stripped) return null;
    // Split on sentence terminators or bullet markers; filter empties.
    const steps = stripped
      .split(/(?<=[.!?])\s+|\s*[••]\s*|\s*\n\s*/)
      .map((s) => s.trim())
      .filter((s) => s.length > 4)
      .slice(0, 8);
    if (!steps.length) return null;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: `How to use ${product.name}`,
      ...(product.howToUse.image
        ? { image: product.howToUse.image }
        : {}),
      step: steps.map((text, idx) => ({
        '@type': 'HowToStep',
        position: idx + 1,
        name: `Step ${idx + 1}`,
        text,
        url: origin ? `${origin}/product/${product.slug}#how-to-use` : undefined,
      })),
    };
  }, [product]);

  // NutritionInformation schema — supplement-specific. Surfaces servingSize,
  // active-ingredient list, and dosage form to Google so SERP rich results
  // can list the product's nutritional profile alongside the price.
  const nutritionJsonLd = useMemo(() => {
    if (!product) return null;
    const ingredientNames = (product.ingredients || [])
      .map((i) => i?.name)
      .filter(Boolean);
    const dosageForm = product.itemDetails?.dosageForm;
    const itemForm = product.itemDetails?.itemForm;
    if (!ingredientNames.length && !dosageForm && !itemForm) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'NutritionInformation',
      name: `${product.name} nutritional profile`,
      ...(dosageForm ? { servingSize: dosageForm } : {}),
      ...(ingredientNames.length
        ? {
            description: `Active ingredients: ${ingredientNames.join(', ')}.`,
          }
        : {}),
    };
  }, [product]);

  const breadcrumbJsonLd = useMemo(() => {
    if (!product) return null;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const items = [
      { name: 'Home', item: `${origin}/` },
      { name: 'Shop', item: `${origin}/products` },
    ];
    if (product.category?.slug) {
      items.push({ name: product.category.name, item: `${origin}/category/${product.category.slug}` });
    }
    if (product.brand?.slug) {
      items.push({ name: product.brand.name, item: `${origin}/brand/${product.brand.slug}` });
    }
    items.push({ name: product.name, item: `${origin}/product/${product.slug}` });
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((it, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: it.name,
        item: it.item,
      })),
    };
  }, [product]);

  // Stock counts are intentionally hidden on the PDP, so no `lowStock` here.

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
      packSize: matchedVariant.packSize,
      potency: variantPotency(matchedVariant),
    });
    trackAddToCart(
      { ...product, minPrice: matchedVariant.salePrice },
      quantity
    );
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
      packSize: matchedVariant.packSize,
      potency: variantPotency(matchedVariant),
    });
    navigate('/checkout');
  };

  // Build a pre-filled WhatsApp message for the active variant + qty so
  // the merchant gets every detail they need to confirm the order in
  // one shot. The link opens wa.me in a new tab; the user reviews the
  // text in WhatsApp Web/app and hits send themselves — we never send
  // automatically, so this stays well within Meta's policies.
  const handleOrderOnWhatsApp = () => {
    if (!product) return;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const variantBits = [];
    if (matchedVariant?.size) variantBits.push(`Size: ${matchedVariant.size}`);
    if (matchedVariant?.color) variantBits.push(`Color: ${matchedVariant.color}`);
    if (matchedVariant?.packSize) variantBits.push(`Pack size: ${matchedVariant.packSize}`);
    if (variantPotency(matchedVariant)) variantBits.push(`Potency: ${variantPotency(matchedVariant)}`);
    if (matchedVariant?.sku) variantBits.push(`SKU: ${matchedVariant.sku}`);

    const lines = [
      "Hi Stylogist! I'd like to place an order:",
      '',
      `🛍️ Product: ${product.name}`,
      url ? `🔗 ${url}` : null,
      ...variantBits.map((b) => `• ${b}`),
      `• Quantity: ${quantity}`,
      `• Unit price: ${fmtPKR(price)}`,
      `• Total: ${fmtPKR(price * quantity)}`,
      '',
      'Please confirm availability and share the next steps. Thank you!',
    ].filter(Boolean);

    const waUrl = buildWhatsAppUrl(lines.join('\n'));
    window.open(waUrl, '_blank', 'noopener,noreferrer');
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

  // While the API is still resolving (cold-start, slow network) emit a
  // minimal Product JSON-LD seeded from the slug. Validators and crawlers
  // that capture the DOM mid-fetch then still see a Product schema even on
  // client-side SPA navigations where the Vercel prerender doesn't run.
  // The full schema overrides this once the product data lands.
  if (isLoading) {
    const placeholderName = (slug || '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const canonical = origin ? `${origin}/product/${slug}` : undefined;
    const placeholderJsonLd = buildPlaceholderProductJsonLd({
      name: placeholderName || 'Product',
      origin,
      canonical,
    });
    return (
      <>
        <Seo
          title={`${placeholderName} | Stylogist`}
          description={`Shop ${placeholderName} on HarbalMart.pk — free shipping & cash on delivery in Pakistan.`}
          type="product"
          image={origin ? `${origin}/logo.png` : undefined}
          canonical={canonical}
          jsonLd={placeholderJsonLd}
          jsonLdId="product-jsonld"
        />
        <SkeletonPage />
      </>
    );
  }
  if (isError || !product) return <ErrorPage slug={slug} />;

  return (
    <div className="w-full bg-[#FDFDFD] min-h-screen font-sans text-[#222]">
      <Seo
        title={seoTitle}
        description={seoDescription}
        image={images[0]}
        type="product"
        canonical={`${window.location.origin}/product/${product.slug}`}
        jsonLd={productJsonLd}
        // CHANGE: Must match the Vercel function's ID to replace the placeholder
        jsonLdId="product-jsonld"
      />
      {breadcrumbJsonLd && (
        <Seo
          jsonLd={breadcrumbJsonLd}
          jsonLdId="breadcrumb-jsonld"
        />
      )}
      {/* HowTo + NutritionInformation are additive: they only emit when the
          admin has actually populated the relevant fields, so we never
          publish empty schema blocks that Google would flag as warnings. */}
      {howToJsonLd && (
        <Seo jsonLd={howToJsonLd} jsonLdId="product-howto-jsonld" />
      )}
      {nutritionJsonLd && (
        <Seo jsonLd={nutritionJsonLd} jsonLdId="product-nutrition-jsonld" />
      )}
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

      {/* Breadcrumb — internal links into category & brand also lift PageRank
          to those listings. The same structure is emitted as BreadcrumbList
          JSON-LD via the <Seo /> jsonLdId="breadcrumb" instance below. */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-5">
        <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1.5 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-semibold">
          <Link to="/" className="hover:text-[#007074]">Home</Link>
          <FiChevronRight size={11} />
          <Link to="/products" className="hover:text-[#007074]">Shop</Link>
          {product.category?.slug && (
            <>
              <FiChevronRight size={11} />
              <Link to={`/category/${product.category.slug}`} className="hover:text-[#007074]">
                {product.category.name}
              </Link>
            </>
          )}
          {product.brand?.slug && (
            <>
              <FiChevronRight size={11} />
              <Link to={`/brand/${product.brand.slug}`} className="hover:text-[#007074]">
                {product.brand.name}
              </Link>
            </>
          )}
          <FiChevronRight size={11} />
          <span className="text-[#222] truncate">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* LEFT — gallery. ABOVE-THE-FOLD, intentionally NOT wrapped in
             ScrollReveal — opacity gating the LCP element measurably hurts
             Core Web Vitals (Lighthouse penalises late paint of the largest
             image). The section animation is reserved for below-the-fold. */}
        <section className="lg:col-span-5">
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
                    <div className="w-full h-full bg-[#F7F3F0] rounded-lg overflow-hidden flex items-center justify-center">
                      <img
                        src={src}
                        alt={
                          (media[idx]?.alt && media[idx].alt.trim()) ||
                          buildProductImageAlt(product, idx)
                        }
                        width="64"
                        height="64"
                        loading="lazy"
                        decoding="async"
                        className="pdp-crisp max-w-full max-h-full w-auto h-auto object-contain"
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="flex-1 relative">
              <ZoomableImage src={activeImage} alt={buildProductImageAlt(product)} />

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
        </section>

        {/* CENTER — info. ABOVE-THE-FOLD: paint immediately, no ScrollReveal.
             Buy buttons need to be visible for first contentful paint. */}
        <section className="lg:col-span-4 space-y-6">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-500 mb-3">
              {product.brand?.name || product.category?.name || '—'}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-black text-[#222] leading-tight tracking-tight">
              {product.name}
            </h1>

            {/* Manufacturer micro-label. Sits between the H1 and the rating
                row because that's where buyers' eyes land while they're
                still validating "is this the real product?". Prefixed with
                "Manufactured by" so the value is self-explanatory even
                when no brand is set. Auto-hides when blank. */}
            {product.manufacturer && (
              <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-gray-500 font-semibold inline-flex items-center gap-1.5">
                <FiAward size={11} className="text-[#007074]" aria-hidden="true" />
                <span>
                  Manufactured by <span className="text-[#222]">{product.manufacturer}</span>
                </span>
              </p>
            )}

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

            {/* Stock micro-message — quietly affirms availability without
                manufactured urgency. The exact stock count is intentionally
                kept off-page; we only differentiate "available" from
                "unavailable" to support the buy-button state. */}
            <p
              className={`text-[11px] mt-2 font-semibold inline-flex items-center gap-1.5 ${
                outOfStock ? 'text-red-600' : 'text-emerald-700'
              }`}
            >
              {outOfStock ? (
                <>
                  <FiAlertCircle size={12} /> Currently unavailable
                </>
              ) : (
                <>
                  <FiCheck size={12} /> In stock · ships within 24 hours
                </>
              )}
            </p>

            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-[0.15em] font-semibold">
              Inclusive of all taxes
            </p>
          </div>

          {product.shortDescription && (
            // Match the admin editor's rendering for the short description
            // too. The font-size override (`prose-short`) keeps it visually
            // smaller without losing any of the tiptap formatting cues.
            <div
              className="tiptap product-rich text-sm text-gray-600 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: product.shortDescription }}
            />
          )}

          {/* Ingredient chips — internal links to the ingredient SEO landing
              pages. Crawlable + helpful for shoppers who care about a
              specific active. Each chip routes to /ingredient/<slug>. */}
          {product.ingredients?.length > 0 && (
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500 mb-2">
                Key ingredients
              </div>
              <div className="flex flex-wrap gap-2">
                {product.ingredients.map((ing) => (
                  <Link
                    key={ing._id || ing.slug}
                    to={`/ingredient/${ing.slug}`}
                    className="inline-flex items-center gap-1.5 bg-[#F7F3F0] text-[#007074] border border-[#007074]/15 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] hover:bg-[#007074] hover:text-white transition-colors"
                  >
                    {ing.name}
                  </Link>
                ))}
              </div>
            </div>
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

          {packSizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">Pack size</span>
                <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-semibold">{selectedPackSize || '—'}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {packSizes.map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPackSize(p)}
                    className={`min-w-[64px] px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border transition-all ${selectedPackSize === p
                      ? 'bg-[#222] text-white border-[#222] shadow-sm'
                      : 'bg-white text-[#222] border-gray-200 hover:border-[#222]'
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Potency / strength picker — supplement-specific. Auto-hides
              when only one variant carries a potency label, so single-
              strength SKUs don't render an empty chip row. */}
          {potencies.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">Potency</span>
                <span className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-semibold">
                  {selectedPotency || '—'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Potency">
                {potencies.map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPotency(p)}
                    role="radio"
                    aria-checked={selectedPotency === p}
                    className={`min-w-[64px] px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border transition-all ${selectedPotency === p
                      ? 'bg-[#007074] text-white border-[#007074] shadow-sm'
                      : 'bg-white text-[#222] border-gray-200 hover:border-[#007074]'
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity. Stock counts intentionally hidden — out-of-stock is
              still surfaced because it gates the buy button, but exact
              numbers / "Only N left" urgency baits are kept off-page. */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">Quantity</span>
              {outOfStock && (
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">
                  Out of stock
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center border border-gray-200 rounded-full bg-white" role="group" aria-label="Quantity selector">
                <button
                  onClick={() => handleQty(-1)}
                  disabled={quantity <= 1 || outOfStock}
                  aria-label="Decrease quantity"
                  className="w-10 h-10 inline-flex items-center justify-center text-[#222] hover:text-[#007074] disabled:opacity-30"
                >
                  <FiMinus size={14} aria-hidden="true" />
                </button>
                <span className="w-9 text-center text-sm font-black tabular-nums text-[#222]" aria-live="polite">{quantity}</span>
                <button
                  onClick={() => handleQty(1)}
                  disabled={quantity >= stock || outOfStock}
                  aria-label="Increase quantity"
                  className="w-10 h-10 inline-flex items-center justify-center text-[#222] hover:text-[#007074] disabled:opacity-30"
                >
                  <FiPlus size={14} aria-hidden="true" />
                </button>
              </div>
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
            {/* WhatsApp express order — opens a chat with the full product
                detail block pre-typed. Disabled when the variant is out
                of stock so we don't ping support for unavailable SKUs. */}
            <button
              onClick={handleOrderOnWhatsApp}
              disabled={outOfStock}
              className="w-full bg-[#25D366] text-white py-3.5 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#1ebe5d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shadow-sm hover:shadow-lg"
            >
              <FaWhatsapp size={16} /> Order on WhatsApp
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
                aria-label="Share this product"
                className="w-12 h-12 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-[#007074] hover:border-[#007074]/40 inline-flex items-center justify-center transition-all"
              >
                <FiShare2 size={15} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Trust strip — promotes the highest-conversion supplement
              signals (authenticity + COD + returns) above the fold so
              the buyer doesn't have to scroll to feel safe. */}
          <ul className="grid grid-cols-2 gap-2" role="list" aria-label="Trust badges">
            <TrustPill icon={<FiAward size={14} />} label="Original Imported" />
            <TrustPill icon={<FiShield size={14} />} label="Cash on Delivery" />
            <TrustPill icon={<FiTruck size={14} />} label="Free Pakistan Delivery" />
            <TrustPill icon={<FiRefreshCw size={14} />} label="7-day returns" />
            <TrustPill icon={<FiLock size={14} />} label="Secure checkout" />
            <TrustPill icon={<FiCheck size={14} />} label="Lab tested · authentic" />
          </ul>

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
                aria-label="Copy SKU to clipboard"
              >
                <FiCopy size={12} aria-hidden="true" />
              </button>
            </div>
          )}
        </section>

        {/* RIGHT — sticky order summary. ABOVE-THE-FOLD: skip ScrollReveal. */}
        <aside className="lg:col-span-3">
          <div className="sticky top-6 space-y-4">
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-[#F7F3F0] px-5 py-3 border-b border-gray-100">
                <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#222]">Order summary</h2>
              </div>
              <div className="p-5 space-y-3 text-sm">
                {/* Subtotal-then-tax breakdown. taxPercent of 0 (the
                    default) means tax-inclusive / tax-exempt — we hide
                    the tax row entirely in that case so the summary
                    matches the existing single-line behaviour. */}
                {(() => {
                  const taxPct = Number(product?.taxPercent) || 0;
                  const lineSubtotal = price * quantity;
                  const taxAmount = Math.round((lineSubtotal * taxPct) / 100);
                  const grandTotal = lineSubtotal + taxAmount;
                  return (
                    <>
                      <SummaryRow label="Item price" value={fmtPKR(price)} />
                      <SummaryRow label="Quantity" value={`× ${quantity}`} />
                      <SummaryRow label="Subtotal" value={fmtPKR(lineSubtotal)} />
                      <SummaryRow
                        label="Shipping"
                        value={
                          <span className="text-[#007074] font-black uppercase text-[10px] tracking-[0.2em]">
                            Free
                          </span>
                        }
                      />
                      {taxPct > 0 && (
                        <SummaryRow
                          label={`Tax · ${taxPct}%`}
                          value={fmtPKR(taxAmount)}
                        />
                      )}
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                          Total
                        </span>
                        <span className="text-xl font-black text-[#007074]">
                          {fmtPKR(grandTotal)}
                        </span>
                      </div>
                    </>
                  );
                })()}
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
        </aside>
      </div>

      {/* Tabs / Bottom Sections */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 pb-20 space-y-16">

        {/* DESCRIPTION */}
        <ScrollReveal as="section">
          <h2 className="text-xl font-bold text-[#222] mb-4">Product Details</h2>
          {product.description ? (
            // `.tiptap` shares the WYSIWYG-side stylesheet (index.css) so
            // headings, lists, alignment, font family, color, links and
            // embedded images render exactly as they did in the admin
            // editor — no drift between authoring and storefront.
            <div
              className="tiptap max-w-none text-gray-700 leading-relaxed break-words"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          ) : (
            <p className="text-gray-500">No description available.</p>
          )}
        </ScrollReveal>

        {/* WHY CUSTOMERS LOVE IT — simplified to a title-only grid. The
             old icon + body fields were removed per product spec. */}
        {Array.isArray(product.whyLoveIt) && product.whyLoveIt.length > 0 && (
          <ScrollReveal as="section" aria-labelledby="why-love-heading">
            <h2 id="why-love-heading" className="text-xl font-bold text-[#222] mb-4">
              Why customers love it
            </h2>
            <ul className="grid grid-cols-2 lg:grid-cols-3 gap-3" role="list">
              {product.whyLoveIt.map((card, idx) => (
                <li
                  key={idx}
                  className="bg-white border border-gray-100 rounded-xl p-4 text-center hover:border-[#007074]/30 hover:shadow-md transition-all"
                >
                  <div className="text-sm font-bold text-[#222] leading-tight">{card.title}</div>
                </li>
              ))}
            </ul>
          </ScrollReveal>
        )}

        {/* BENEFITS — single section banner + bullet list. New shape is
             { image, items: string[] }; legacy [{text, image}] and string[]
             rows are still tolerated (first non-empty image is promoted to
             the section banner). */}
        {(() => {
          const block = readSectionBlock(product.benefits);
          if (!block.items.length) return null;
          return (
            <ScrollReveal as="section" aria-labelledby="benefits-heading">
              <h2 id="benefits-heading" className="text-xl font-bold text-[#222] mb-4">Benefits</h2>
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                {block.image && (
                  <img
                    src={block.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-full aspect-[21/9] object-cover bg-[#F7F3F0]"
                  />
                )}
                <ul className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                  {block.items.map((text, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                      <span className="mt-0.5 text-[#007074]" aria-hidden="true">
                        <FiCheck size={14} />
                      </span>
                      <span className="leading-relaxed">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          );
        })()}

        {/* USES — same {image, items} shape as Benefits, rendered as a
             numbered list under one section banner. */}
        {(() => {
          const block = readSectionBlock(product.uses);
          if (!block.items.length) return null;
          return (
            <ScrollReveal as="section">
              <h2 className="text-xl font-bold text-[#222] mb-4">Uses</h2>
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                {block.image && (
                  <img
                    src={block.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-full aspect-[21/9] object-cover bg-[#F7F3F0]"
                  />
                )}
                <ol className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                  {block.items.map((text, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                      <span className="mt-1 w-5 h-5 rounded-full bg-[#007074]/10 text-[#007074] text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{text}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </ScrollReveal>
          );
        })()}

        {/* INGREDIENT HIGHLIGHT — same shape as howToUse. Banner-first
             section that calls out a hero ingredient or formulation note. */}
        {(product.ingredientHighlight?.text || product.ingredientHighlight?.image) && (
          <ScrollReveal as="section" aria-labelledby="ingredient-highlight-heading">
            <h2
              id="ingredient-highlight-heading"
              className="text-xl font-bold text-[#222] mb-4"
            >
              Ingredient highlight
            </h2>
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              {product.ingredientHighlight.image && (
                <img
                  src={product.ingredientHighlight.image}
                  alt="Ingredient highlight"
                  loading="lazy"
                  decoding="async"
                  className="w-full aspect-[21/9] object-cover bg-[#F7F3F0]"
                />
              )}
              {product.ingredientHighlight.text && (
                <div
                  className="product-rich tiptap text-sm text-gray-700 leading-relaxed p-5"
                  dangerouslySetInnerHTML={{ __html: product.ingredientHighlight.text }}
                />
              )}
            </div>
          </ScrollReveal>
        )}

        {/* HOW TO USE — image now renders as a full-width banner above the
             copy instead of a square thumbnail beside it. */}
        {(product.howToUse?.text || product.howToUse?.image) && (
          <ScrollReveal as="section">
            <h2 className="text-xl font-bold text-[#222] mb-4">How to use</h2>
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              {product.howToUse.image && (
                <img
                  src={product.howToUse.image}
                  alt="How to use"
                  loading="lazy"
                  decoding="async"
                  className="w-full aspect-[21/9] object-cover bg-[#F7F3F0]"
                />
              )}
              {product.howToUse.text && (
                <div
                  className="product-rich tiptap text-sm text-gray-700 leading-relaxed p-5"
                  dangerouslySetInnerHTML={{ __html: product.howToUse.text }}
                />
              )}
            </div>
          </ScrollReveal>
        )}

        {/* PRECAUTIONS — supplement YMYL safety block. Visually distinct
             so the warning isn't overlooked. Auto-hides when empty. */}
        {Array.isArray(product.precautions) && product.precautions.length > 0 && (
          <ScrollReveal as="section" aria-labelledby="precautions-heading">
            <h2 id="precautions-heading" className="text-xl font-bold text-[#222] mb-4">
              Precautions &amp; safety
            </h2>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <ul className="space-y-2.5">
                {product.precautions.map((p, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-amber-900">
                    <FiAlertCircle
                      className="mt-0.5 text-amber-600 shrink-0"
                      size={14}
                      aria-hidden="true"
                    />
                    <span className="leading-relaxed">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        )}

        {/* ITEM DETAILS — structured spec table fed by product.itemDetails. */}
        {product.itemDetails && Object.values(product.itemDetails).some((v) => (v || '').trim()) && (
          <ScrollReveal as="section">
            <h2 className="text-xl font-bold text-[#222] mb-4">Item Details</h2>
            <div className="overflow-hidden border border-gray-100 rounded-xl">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {product.itemDetails.itemForm && (
                    <ItemDetailRow label="Item form" value={product.itemDetails.itemForm} />
                  )}
                  {product.itemDetails.containerType && (
                    <ItemDetailRow label="Container type" value={product.itemDetails.containerType} />
                  )}
                  {product.itemDetails.ageRange && (
                    <ItemDetailRow label="Age range (description)" value={product.itemDetails.ageRange} />
                  )}
                  {product.itemDetails.dosageForm && (
                    <ItemDetailRow label="Dosage form" value={product.itemDetails.dosageForm} />
                  )}
                  {product.barcode && (
                    <ItemDetailRow label="UPC" value={product.barcode} />
                  )}
                </tbody>
              </table>
            </div>
          </ScrollReveal>
        )}

        {/* SPECIFICATIONS — merged with the previous "Key Highlights" block.
            Stock is intentionally omitted: showing it on a public PDP can
            backfire (urgency-baited shoppers, scraping competitors). */}
        <ScrollReveal as="section">
          <h2 className="text-xl font-bold text-[#222] mb-4">Specifications</h2>
          <ul className="divide-y divide-gray-100 text-sm">
            <SpecRow label="Brand" value={product.brand?.name || '—'} />
            {product.manufacturer && (
              <SpecRow label="Manufacturer" value={product.manufacturer} />
            )}
            {product.category?.name && (
              <SpecRow label="Category" value={product.category.name} />
            )}
            {variantPotency(matchedVariant) && (
              <SpecRow label="Potency" value={variantPotency(matchedVariant)} />
            )}
            {matchedVariant?.weight && (
              <SpecRow label="Weight" value={`${matchedVariant.weight}g`} />
            )}
            {product.itemDetails?.itemForm && (
              <SpecRow label="Item form" value={product.itemDetails.itemForm} />
            )}
            {product.itemDetails?.dosageForm && (
              <SpecRow label="Dosage form" value={product.itemDetails.dosageForm} />
            )}
            {product.storage && (
              <SpecRow label="Storage" value={product.storage} />
            )}
            {product.barcode && (
              <SpecRow label="UPC" value={product.barcode} />
            )}
            {product.averageRating > 0 && (
              <SpecRow
                label="Rating"
                value={`${product.averageRating.toFixed(1)} / 5 (${product.totalReviews || 0} reviews)`}
              />
            )}
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

        {/* VARIANTS TABLE */}
        {variants.length > 0 && (
          <ScrollReveal as="section">
            <h2 className="text-xl font-bold text-[#222] mb-4">Available Variants</h2>
            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="text-left px-4 py-3">SKU</th>
                    <th className="text-left px-4 py-3">Size</th>
                    <th className="text-left px-4 py-3">Pack</th>
                    <th className="text-left px-4 py-3">Color</th>
                    <th className="text-left px-4 py-3">Potency</th>
                    <th className="text-right px-4 py-3">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {variants.map((v) => (
                    <tr key={v._id || v.sku}>
                      <td className="px-4 py-3 font-mono text-xs">{v.sku || '—'}</td>
                      <td className="px-4 py-3 capitalize">{v.size || '—'}</td>
                      <td className="px-4 py-3">{v.packSize || '—'}</td>
                      <td className="px-4 py-3 capitalize">{v.color || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{variantPotency(v) || '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {fmtPKR(v.salePrice)}
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

        {/* ✅ PRODUCT FAQ — accordion + FAQPage JSON-LD. Auto-hides
             when the product has no FAQ entries. */}
        <ProductFaq product={product} />

        {/* ✅ RELATED PRODUCTS — sourced from the same category and
             ranked by best-selling so the carousel is a curated up-sell,
             not a random fallback. Excludes the current product so the
             user always sees something new. */}
        <RelatedProducts product={product} />

        {/* INTERNAL LINK CLUSTER — descriptive anchors into brand,
             category, and ingredient pages. Builds topical authority and
             distributes PageRank into our own listing pages. */}
        <InternalLinkCluster product={product} />

      </div>

      {/* Sticky mobile buy bar — fixed-bottom CTA for screens < lg. Hides
          itself once the user scrolls into the footer area to avoid
          double-CTA noise. Desktop already has the right-rail summary. */}
      <MobileBuyBar
        price={price}
        originalPrice={originalPrice}
        outOfStock={outOfStock}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />

    </div>
  );
}

// Product FAQ — accordion UI matching the ingredient page's FAQ
// section. Emits Schema.org FAQPage JSON-LD when at least one entry
// exists so Google can surface it as a rich result. Auto-hides on
// products with no FAQ.
function ProductFaq({ product }) {
  const [openIdx, setOpenIdx] = useState(0);
  const faq = product?.faq || [];
  const jsonLd = useMemo(() => {
    if (!faq.length) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((q) => ({
        '@type': 'Question',
        name: q.question,
        acceptedAnswer: { '@type': 'Answer', text: q.answer },
      })),
    };
  }, [faq]);

  if (!faq.length) return null;

  return (
    <ScrollReveal as="section" className="mt-16">
      {jsonLd && (
        <Seo
          jsonLd={jsonLd}
          jsonLdId={`product-faq-${product?._id || product?.slug}`}
        />
      )}
      <header className="text-center max-w-2xl mx-auto mb-7">
        <span className="inline-block bg-[#F7F3F0] text-[#007074] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.25em] mb-3">
          Got questions?
        </span>
        <h2 className="font-serif text-2xl md:text-3xl font-black text-[#222] tracking-tight">
          Frequently asked <span className="italic text-[#007074]">questions</span>
        </h2>
      </header>
      <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-100 shadow-sm overflow-hidden max-w-3xl mx-auto">
        {faq.map((q, idx) => {
          const open = openIdx === idx;
          return (
            <div key={idx}>
              {/* The question itself is wrapped in <h3> so the page
                   maintains H1 → H2 → H3 hierarchy without changing the
                   visual look. The accordion toggle stays a <button>
                   so it remains keyboard / screen-reader accessible. */}
              <h3 className="m-0">
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? -1 : idx)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-[#F7F3F0]/50 transition-colors"
                  aria-expanded={open}
                  aria-controls={`faq-answer-${idx}`}
                  id={`faq-question-${idx}`}
                >
                  <span className="text-sm font-bold text-[#222] leading-snug pr-4">{q.question}</span>
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      open ? 'bg-[#007074] text-white rotate-180' : 'bg-[#F7F3F0] text-[#007074]'
                    }`}
                  >
                    <FiChevronDown size={14} />
                  </span>
                </button>
              </h3>
              {open && (
                <div
                  id={`faq-answer-${idx}`}
                  role="region"
                  aria-labelledby={`faq-question-${idx}`}
                  className="px-6 pb-6 text-sm text-gray-600 leading-relaxed whitespace-pre-line"
                >
                  {q.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollReveal>
  );
}

// Internal link cluster. Pure presentational footer that distributes
// crawl budget and link equity into our own brand, category, and
// ingredient landing pages. Anchor text is descriptive (not "click here")
// because Google weighs anchor relevance for ranking signals.
function InternalLinkCluster({ product }) {
  if (!product) return null;
  const ingredientSlice = (product.ingredients || []).slice(0, 6);
  const hasAnything =
    !!product.brand?.slug ||
    !!product.category?.slug ||
    ingredientSlice.length > 0;
  if (!hasAnything) return null;

  return (
    <ScrollReveal as="section" aria-labelledby="related-links-heading" className="mt-16">
      <h2 id="related-links-heading" className="text-xl font-bold text-[#222] mb-4">
        Explore more
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {product.brand?.slug && (
          <Link
            to={`/brand/${product.brand.slug}`}
            className="block bg-white border border-gray-100 rounded-xl p-4 hover:border-[#007074]/30 hover:shadow-md transition-all"
          >
            <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1.5">
              Brand
            </span>
            <span className="block text-sm font-bold text-[#222]">
              Shop more from {product.brand.name}
            </span>
            <span className="block text-[11px] text-gray-500 mt-1">
              View the full {product.brand.name} catalogue.
            </span>
          </Link>
        )}
        {product.category?.slug && (
          <Link
            to={`/category/${product.category.slug}`}
            className="block bg-white border border-gray-100 rounded-xl p-4 hover:border-[#007074]/30 hover:shadow-md transition-all"
          >
            <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1.5">
              Category
            </span>
            <span className="block text-sm font-bold text-[#222]">
              More in {product.category.name}
            </span>
            <span className="block text-[11px] text-gray-500 mt-1">
              See every {product.category.name?.toLowerCase()} we stock in Pakistan.
            </span>
          </Link>
        )}
        {ingredientSlice.length > 0 && (
          <div className="block bg-white border border-gray-100 rounded-xl p-4">
            <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1.5">
              Key ingredients
            </span>
            <ul className="flex flex-wrap gap-1.5 mt-1.5">
              {ingredientSlice.map((ing) => (
                <li key={ing._id || ing.slug}>
                  <Link
                    to={`/ingredient/${ing.slug}`}
                    className="inline-block bg-[#F7F3F0] hover:bg-[#007074] hover:text-white text-[#007074] border border-[#007074]/15 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors"
                  >
                    {ing.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ScrollReveal>
  );
}

// Related products rail. Now keyed off the SHARED INGREDIENT set rather
// than the category — supplement buyers who land on a "Vitamin C 1000mg"
// product are far better served by other Vitamin-C-containing products
// than by every random item in the Vitamins category. Falls back to the
// category scope only when the product has no ingredient tags (so the
// rail still populates on a brand-new catalogue).
function RelatedProducts({ product }) {
  const ingredientSlugs = (product?.ingredients || [])
    .map((ing) => ing?.slug)
    .filter(Boolean);
  const categorySlug = product?.category?.slug;
  const scope =
    ingredientSlugs.length > 0
      ? { ingredients: ingredientSlugs, sort: 'bestSelling', page: 1, limit: 8 }
      : categorySlug
      ? { categorySlug, sort: 'bestSelling', page: 1, limit: 8 }
      : { sort: 'bestSelling', page: 1, limit: 8 };
  const { data, isLoading } = useProductsSearch(scope, { enabled: !!product });

  const items = (data?.items ?? []).filter((p) => p._id !== product?._id).slice(0, 8);
  if (!items.length && !isLoading) return null;

  // Pick a single ingredient name for the "View all in {X}" link. First
  // tagged ingredient wins; falls back to the category when none exists.
  const primaryIngredient = product?.ingredients?.[0];
  const viewAllHref = primaryIngredient?.slug
    ? `/ingredient/${primaryIngredient.slug}`
    : categorySlug
    ? `/category/${categorySlug}`
    : null;
  const viewAllLabel = primaryIngredient?.name || product?.category?.name;

  return (
    <ScrollReveal as="section" className="mt-16">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
        <div>
          <span className="inline-block bg-[#F7F3F0] text-[#007074] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.25em] mb-3">
            {primaryIngredient ? 'Same ingredient' : 'You may also like'}
          </span>
          <h2 className="font-serif text-2xl md:text-3xl font-black text-[#222] tracking-tight">
            Related products
          </h2>
        </div>
        {viewAllHref && (
          <Link
            to={viewAllHref}
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#222] hover:text-[#007074] transition-colors group self-start md:self-auto"
          >
            View all in {viewAllLabel}
            <FiChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </header>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-gray-100 rounded-[1.75rem] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {items.map((p, idx) => (
            <StorefrontProductCard key={p._id} product={p} index={idx} />
          ))}
        </div>
      )}
    </ScrollReveal>
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
    <li className="bg-white border border-gray-100 rounded-xl px-3 py-2.5 flex items-center gap-2 hover:border-[#007074]/30 transition-colors list-none">
      <span className="text-[#007074] flex-shrink-0" aria-hidden="true">{icon}</span>
      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#222] truncate">{label}</span>
    </li>
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

const ItemDetailRow = memo(function ItemDetailRow({ label, value }) {
  return (
    <tr>
      <th
        scope="row"
        className="text-left px-4 py-3 bg-gray-50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 w-1/3"
      >
        {label}
      </th>
      <td className="px-4 py-3 text-sm text-[#222] font-semibold">{value}</td>
    </tr>
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
  // In production this branch is mostly hit when the Render API cold-starts
  // (~30s) and the fetch times out before Google's WRS captures the DOM.
  // Keep a minimal Product schema alive seeded from the slug so the rich
  // results validator still parses a Product on the page — without this,
  // any error branch wipes the prerender and crawlers index nothing.
  const placeholderName = (slug || '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const canonical = origin ? `${origin}/product/${slug}` : undefined;
  const placeholderJsonLd = buildPlaceholderProductJsonLd({
    name: placeholderName || 'Product',
    origin,
    canonical,
  });
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center bg-[#FDFDFD]">
      <Seo
        title={`${placeholderName} | Stylogist`}
        description={`Shop ${placeholderName} on HarbalMart.pk — free shipping & cash on delivery in Pakistan.`}
        type="product"
        image={origin ? `${origin}/logo.png` : undefined}
        canonical={canonical}
        jsonLd={placeholderJsonLd}
        jsonLdId="product-jsonld"
      />
      <FiAlertCircle className="mx-auto text-[#007074] mb-3" size={32} />
      <h1 className="font-serif text-2xl font-black text-[#222]">Product not found</h1>
      <p className="text-sm text-gray-500 mt-2">
        We couldn't find a product for <code className="text-[#222]">{slug}</code>.
      </p>
      <Link
        to="/products"
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
    <div className="group aspect-[4/5] bg-[#005A5D] border border-gray-100 rounded-[2rem] p-2 shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-0.5">
      <div
        className="relative w-full h-full bg-[white] rounded-[1.5rem] overflow-hidden cursor-zoom-in select-none flex items-center justify-center"
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
      >
        {/* `object-contain` + max-w/max-h ensures the image is shown in full
            on every screen size (no cropping, aspect ratio preserved). The
            flex-center on the parent letterboxes the image when its aspect
            differs from the 4:5 container. */}
        <img
          src={src}
          alt={alt}
          width="800"
          height="1000"
          draggable={false}
          loading="eager"
          fetchpriority="high"
          decoding="async"
          className={`pdp-crisp max-w-full max-h-full w-auto h-auto object-contain transition-[opacity,transform] duration-500 group-hover:scale-[1.03] ${zoom ? 'opacity-0' : 'opacity-100'}`}
        />
        {zoom && (
          // Zoom magnifier — backgroundSize: 'contain' mirrors the default
          // object-contain layout, then 200% scales it 2× while keeping the
          // aspect ratio. The position calc translates the cursor's
          // percentage coords into the magnified view's anchor.
          <div
            className="absolute inset-0 bg-no-repeat bg-center"
            style={{
              backgroundImage: `url(${src})`,
              backgroundSize: '200% auto',
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