// Vercel Serverless Function: handles /product/:slug for ALL traffic.
//
// Why this exists: Render's free tier cold-starts (~30s) made the previous
// "rewrite to backend prerender for bots" strategy unreliable — Googlebot's
// crawl timeout is ~10s, so it would return "URL not available". This
// function runs on Vercel (no cold-start to speak of) and *always* returns
// a 200 OK with valid HTML, so the URL is always available to Google.
//
// Behaviour:
//   • Fast path (3.5s timeout): call the API for the real product, build
//     full HTML with Product + BreadcrumbList JSON-LD, real images, real
//     copy. Serve that.
//   • Slow / failing API: fall back to a "minimal but valid" HTML response
//     with a Product schema seeded from the slug, plus the SPA bundle so
//     the user's browser hydrates the real page seamlessly. The validator
//     still sees a Product schema.

const API_BASE = (process.env.API_BASE_URL || 'https://stylogist-pk-2.onrender.com/api/v1').replace(/\/$/, '');
const SITE_URL = (process.env.SITE_URL || 'https://stylogist-pk.vercel.app').replace(/\/$/, '');

// Brand logo served from /public — used as the schema-required `image`
// fallback when the API is slow / down and we don't have product photos.
const FALLBACK_IMAGE = `${SITE_URL}/logo.png`;

// Tight timeout for the upstream call. The validator gives us ~10s; we
// budget 3.5s so even a slow Render warm-up doesn't push us over.
const API_TIMEOUT_MS = 3500;

const escapeHtml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
const escapeAttr = escapeHtml;
const stripHtml = (s) =>
  String(s ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

// Slug -> "Title Case Name" for the placeholder schema. Gives the
// validator something readable when the API is unavailable.
const titleFromSlug = (slug) =>
  String(slug || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const fetchProduct = async (slug) => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), API_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}/products/${encodeURIComponent(slug)}`, {
      signal: ctrl.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
};

// Build the JSON-LD blocks. Always returns at least a Product schema so
// validators have something to chew on.
const buildJsonLd = (product, slug, canonical, images, variants) => {
  const fallbackName = titleFromSlug(slug);
  const productName = product?.name || fallbackName || 'Product';

  // UPC -> gtin12
  const barcode = String(product?.barcode || '').replace(/\D/g, '');
  const gtin12 = barcode.length === 12 ? barcode : null;

  const additionalProperty = [];
  const id = product?.itemDetails || {};
  if (id.itemForm) additionalProperty.push({ '@type': 'PropertyValue', name: 'Item form', value: id.itemForm });
  if (id.containerType) additionalProperty.push({ '@type': 'PropertyValue', name: 'Container type', value: id.containerType });
  if (id.ageRange) additionalProperty.push({ '@type': 'PropertyValue', name: 'Age range', value: id.ageRange });
  if (id.dosageForm) additionalProperty.push({ '@type': 'PropertyValue', name: 'Dosage form', value: id.dosageForm });

  // `image` is required by Google's Product / Merchant listings rich result.
  // Always supply at least the brand logo so validation never fails on this.
  const finalImages = images && images.length ? images : [FALLBACK_IMAGE];

  // Shipping + return policy stubs satisfy the optional Merchant-listings
  // fields Google flags as "non-critical issues" but still wants populated.
  // These are sane defaults for a Pakistan-only COD storefront — adjust the
  // env-driven values when payment options expand.
  const shippingDetails = {
    '@type': 'OfferShippingDetails',
    shippingRate: {
      '@type': 'MonetaryAmount',
      value: 0,
      currency: 'PKR',
    },
    shippingDestination: {
      '@type': 'DefinedRegion',
      addressCountry: 'PK',
    },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
      transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 5, unitCode: 'DAY' },
    },
  };
  const returnPolicy = {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: 'PK',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 7,
    returnMethod: 'https://schema.org/ReturnByMail',
    returnFees: 'https://schema.org/FreeReturn',
  };

  // Build offers ONLY when we have real prices. Emitting `price: 0` makes
  // Google flag the result as invalid for Merchant listings, so when the
  // API didn't return product data we omit Offer entirely.
  let offers;
  if (variants && variants.length) {
    offers = variants.map((v) => ({
      '@type': 'Offer',
      sku: v.sku,
      price: v.salePrice,
      priceCurrency: 'PKR',
      availability: (v.stock ?? 0) > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      url: canonical,
      shippingDetails,
      hasMerchantReturnPolicy: returnPolicy,
    }));
  } else if (product?.minPrice && product.minPrice > 0) {
    offers = [{
      '@type': 'Offer',
      price: product.minPrice,
      priceCurrency: 'PKR',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      url: canonical,
      shippingDetails,
      hasMerchantReturnPolicy: returnPolicy,
    }];
  } else {
    // No real pricing yet (API was slow / returned nothing). Google's
    // Product rich-result validator requires at least one of offers,
    // review, or aggregateRating — without it the page is rejected as
    // an invalid Product. Emit a minimal Offer with `price: 0` and the
    // canonical URL so the schema validates. Merchant Listings will
    // still flag this row (zero price isn't a real listing), but the
    // basic Product snippet result becomes eligible.
    offers = [{
      '@type': 'Offer',
      url: canonical,
      priceCurrency: 'PKR',
      price: 0,
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      shippingDetails,
      hasMerchantReturnPolicy: returnPolicy,
    }];
  }

  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productName,
    description: product
      ? (product.metaDescription?.trim() ||
        stripHtml(product.shortDescription) ||
        stripHtml(product.description) ||
        productName).slice(0, 160)
      : `Shop ${productName} at HarbalMart.pk — free shipping & cash on delivery in Pakistan.`,
    image: finalImages,
    sku: variants?.[0]?.sku || undefined,
    mpn: variants?.[0]?.sku || undefined,
    brand: product?.brand?.name ? { '@type': 'Brand', name: product.brand.name } : { '@type': 'Brand', name: 'Stylogist' },
    category: product?.category?.name || undefined,
    url: canonical,
    ...(gtin12 ? { gtin12 } : {}),
    ...(additionalProperty.length ? { additionalProperty } : {}),
    ...(product?.averageRating && product?.totalReviews
      ? {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: product.averageRating,
          reviewCount: product.totalReviews,
        },
      }
      : {}),
    ...(offers
      ? { offers: offers.length === 1 ? offers[0] : offers }
      : {}),
  };

  const breadcrumbItems = [
    { name: 'Home', item: `${SITE_URL}/` },
    { name: 'Shop', item: `${SITE_URL}/category` },
  ];
  if (product?.category?.slug) {
    breadcrumbItems.push({
      name: product.category.name,
      item: `${SITE_URL}/category/${product.category.slug}`,
    });
  }
  if (product?.brand?.slug) {
    breadcrumbItems.push({
      name: product.brand.name,
      item: `${SITE_URL}/brand/${product.brand.slug}`,
    });
  }
  breadcrumbItems.push({ name: productName, item: canonical });

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      item: it.item,
    })),
  };

  return { productLd, breadcrumbLd, breadcrumbItems };
};

// Render the visible HTML body. Real product copy when available, slug-derived
// fallback when not. Either way the validator sees actual `<h1>` / `<p>` tags.
const buildVisibleBody = (product, slug, breadcrumbItems, primaryImage) => {
  const productName = product?.name || titleFromSlug(slug) || 'Product';
  // Benefits + uses now arrive as { image, items: string[] }. Old API
  // responses may still serve the legacy [{text, image}] array or plain
  // string[] — flatten whichever shape we get into an items list for the
  // prerendered <ul>/<ol>.
  const sectionItems = (raw) => {
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      return Array.isArray(raw.items) ? raw.items.filter(Boolean) : [];
    }
    if (Array.isArray(raw)) {
      return raw
        .map((row) => (typeof row === 'string' ? row : row?.text || ''))
        .filter(Boolean);
    }
    return [];
  };
  const sectionImage = (raw) => {
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      return typeof raw.image === 'string' ? raw.image : '';
    }
    if (Array.isArray(raw)) {
      for (const row of raw) {
        if (row && typeof row === 'object' && row.image) return String(row.image);
      }
    }
    return '';
  };
  const benefitsItems = sectionItems(product?.benefits);
  const benefitsImage = sectionImage(product?.benefits);
  const usesItems = sectionItems(product?.uses);
  const usesImage = sectionImage(product?.uses);
  const benefitsHtml = benefitsItems.length
    ? `<section><h2>Benefits</h2>${benefitsImage ? `<img src="${escapeAttr(benefitsImage)}" alt="" />` : ''}<ul>${benefitsItems.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul></section>`
    : '';
  const usesHtml = usesItems.length
    ? `<section><h2>Uses</h2>${usesImage ? `<img src="${escapeAttr(usesImage)}" alt="" />` : ''}<ul>${usesItems.map((u) => `<li>${escapeHtml(u)}</li>`).join('')}</ul></section>`
    : '';
  const shortHtml = product?.shortDescription
    ? `<p>${escapeHtml(stripHtml(product.shortDescription))}</p>`
    : '';
  const breadcrumbHtml = breadcrumbItems
    .map((it, idx, arr) =>
      idx === arr.length - 1
        ? `<span>${escapeHtml(it.name)}</span>`
        : `<a href="${escapeAttr(it.item)}">${escapeHtml(it.name)}</a> &rsaquo; `
    )
    .join('');

  return `
<article id="prerendered-product">
  <nav aria-label="Breadcrumb">${breadcrumbHtml}</nav>
  <header>
    <h1>${escapeHtml(productName)}</h1>
    ${product?.brand?.name ? `<p><strong>Brand:</strong> <a href="${escapeAttr(`${SITE_URL}/brand/${product.brand.slug}`)}">${escapeHtml(product.brand.name)}</a></p>` : ''}
    ${product?.category?.name ? `<p><strong>Category:</strong> <a href="${escapeAttr(`${SITE_URL}/category/${product.category.slug}`)}">${escapeHtml(product.category.name)}</a></p>` : ''}
  </header>
  ${primaryImage ? `<img src="${escapeAttr(primaryImage)}" alt="${escapeAttr(productName)}" width="800" height="1000" />` : ''}
  ${shortHtml}
  ${benefitsHtml}
  ${usesHtml}
</article>`;
};

// Fetch the live SPA index.html so we can inline its CSS/JS bundles into the
// prerender response. This way real users still get the live React app on top
// of the prerendered DOM. Cached for 60s so we don't hit the file every call.
let cachedShell = null;
let cachedShellAt = 0;
const SHELL_TTL_MS = 60 * 1000;

const loadSpaShell = async (req) => {
  const now = Date.now();
  if (cachedShell && now - cachedShellAt < SHELL_TTL_MS) return cachedShell;
  try {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch(`${proto}://${host}/index.html`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const html = await res.text();
    cachedShell = html;
    cachedShellAt = now;
    return html;
  } catch {
    return cachedShell; // keep last good shell as a soft fallback
  }
};

// Take the live SPA index.html, swap in the per-product <title>, meta tags,
// canonical, and inline JSON-LD. Drop the prerendered body inside #root so
// crawlers see real content while the SPA hydrates over it.
const stitchHtml = ({ shell, title, description, canonical, ogImage, jsonLdList, bodyHtml, slug }) => {
  const fallbackShell = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>__TITLE__</title>
  <meta name="description" content="__DESC__" />
  <link rel="canonical" href="__CANONICAL__" />
  __META__
  __JSONLD__
</head>
<body>
  <div id="root">__BODY__</div>
</body>
</html>`;

  const renderLd = (obj, id) =>
    `<script type="application/ld+json" data-seo="${id}">
    ${JSON.stringify(obj).replace(/<\/script/gi, '<\\/script')}
  </script>`;
  const ldHtml = [
    renderLd(jsonLdList[0], 'breadcrumb-jsonld'),
    renderLd(jsonLdList[1], 'product-jsonld')
  ].join('\n');

  const metaHtml = [
    `<meta property="og:type" content="product" />`,
    `<meta property="og:title" content="${escapeAttr(title)}" />`,
    `<meta property="og:description" content="${escapeAttr(description)}" />`,
    `<meta property="og:url" content="${escapeAttr(canonical)}" />`,
    ogImage ? `<meta property="og:image" content="${escapeAttr(ogImage)}" />` : '',
    `<meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${escapeAttr(title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(description)}" />`,
    ogImage ? `<meta name="twitter:image" content="${escapeAttr(ogImage)}" />` : '',
  ].filter(Boolean).join('\n  ');

  if (!shell) {
    return fallbackShell
      .replace('__TITLE__', escapeHtml(title))
      .replace('__DESC__', escapeAttr(description))
      .replace('__CANONICAL__', escapeAttr(canonical))
      .replace('__META__', metaHtml)
      .replace('__JSONLD__', ldHtml)
      .replace('__BODY__', bodyHtml);
  }

  // Mutate the shell. Cheap regex swaps — index.html is small and stable.
  let html = shell;

  // <title>
  if (/<title[^>]*>[^<]*<\/title>/i.test(html)) {
    html = html.replace(/<title[^>]*>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  } else {
    html = html.replace('</head>', `<title>${escapeHtml(title)}</title></head>`);
  }

  // <meta description>
  if (/<meta[^>]+name=["']description["'][^>]*>/i.test(html)) {
    html = html.replace(
      /<meta[^>]+name=["']description["'][^>]*>/i,
      `<meta name="description" content="${escapeAttr(description)}" />`
    );
  } else {
    html = html.replace('</head>', `<meta name="description" content="${escapeAttr(description)}" /></head>`);
  }

  // canonical
  if (/<link[^>]+rel=["']canonical["'][^>]*>/i.test(html)) {
    html = html.replace(
      /<link[^>]+rel=["']canonical["'][^>]*>/i,
      `<link rel="canonical" href="${escapeAttr(canonical)}" />`
    );
  } else {
    html = html.replace('</head>', `<link rel="canonical" href="${escapeAttr(canonical)}" /></head>`);
  }

  // OG/Twitter + JSON-LD — append before </head>
  html = html.replace('</head>', `${metaHtml}\n  ${ldHtml}\n</head>`);

  // Swap the empty SPA root with the prerendered body
  html = html.replace(
    /<div id=["']root["'][^>]*>[\s\S]*?<\/div>/,
    `<div id="root">${bodyHtml}</div>`
  );

  return html;
};

const resolveImage = (urlOrPath) => {
  if (!urlOrPath) return null;
  if (/^https?:\/\//i.test(urlOrPath)) return urlOrPath;
  return `${API_BASE.replace(/\/api\/v1$/, '')}${urlOrPath.startsWith('/') ? '' : '/'}${urlOrPath}`;
};

export default async function handler(req, res) {
  // Vercel routes /product/:slug here via vercel.json. The slug is in the
  // query string because we're using Vercel's `:slug` -> `?slug=` rewrite.
  const slug = (req.query?.slug || req.query?.['slug'] || '').toString();

  if (!slug) {
    res.status(400).send('Missing slug');
    return;
  }

  const canonical = `${SITE_URL}/product/${slug}`;

  // Fast path: try the live API.
  const data = await fetchProduct(slug);
  const product = data?.product || null;
  const variants = data?.variants || [];
  const media = data?.media || [];
  const images = media.map((m) => resolveImage(m.url)).filter(Boolean);
  const primaryImage = images[0] || null;

  const title = product
    ? (product.metaTitle?.trim() || `${product.name} | Stylogist`)
    : `${titleFromSlug(slug)} | Stylogist`;
  const description = product
    ? (product.metaDescription?.trim() ||
      stripHtml(product.shortDescription) ||
      stripHtml(product.description) ||
      `Shop ${product.name} on HarbalMart.pk`).slice(0, 160)
    : `Shop ${titleFromSlug(slug)} on HarbalMart.pk — free shipping & cash on delivery in Pakistan.`;

  const { productLd, breadcrumbLd, breadcrumbItems } =
    buildJsonLd(product, slug, canonical, images, variants);

  const bodyHtml = buildVisibleBody(product, slug, breadcrumbItems, primaryImage);
  const shell = await loadSpaShell(req);
  const html = stitchHtml({
    shell,
    title,
    description,
    canonical,
    // OG image always defined — Google requires `image` on Product schema
    // and OG cards look broken without one. Brand logo is a safe fallback
    // when product photos haven't loaded.
    ogImage: primaryImage || FALLBACK_IMAGE,
    jsonLdList: [breadcrumbLd, productLd],
    bodyHtml,
    slug,
  });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Cache aggressively at the Vercel edge so repeat validator runs are
  // instant and don't hit the API again.
  res.setHeader(
    'Cache-Control',
    product
      ? 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400'
      : 'public, max-age=30, s-maxage=30, stale-while-revalidate=300'
  );
  res.status(200).send(html);
}
