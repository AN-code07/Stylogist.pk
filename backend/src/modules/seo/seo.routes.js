import { Router } from "express";
import { Product } from "../products/product.model.js";
import { Variant } from "../products/variant.model.js";
import { ProductMedia } from "../products/media.model.js";
import { Category } from "../categories/category.model.js";
import { Brand } from "../brands/brand.model.js";
import { Ingredient } from "../ingredients/ingredient.model.js";
import { SeoRedirect } from "./redirect.model.js";
import env from "../../config/env.js";
import { catchAsync } from "../../utils/catchAsync.js";

const router = Router();

const escapeXml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

// Same set, named for clarity in the HTML prerender path.
const escapeHtml = escapeXml;
const escapeAttr = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
const stripHtml = (s) =>
  String(s ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const toIsoDate = (d) => {
  if (!d) return new Date().toISOString();
  try { return new Date(d).toISOString(); } catch { return new Date().toISOString(); }
};

// Concatenate the dynamic content into the W3C sitemap envelope. We cap the
// total to 50,000 URLs (the spec limit) to keep this single-file generator
// safe even as the catalogue scales — beyond that we'd split into a sitemap
// index, which can be wired in later when needed.
const SITEMAP_LIMIT = 50000;

const buildUrl = ({ loc, lastmod, changefreq, priority }) => `
  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${toIsoDate(lastmod)}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

router.get(
  "/sitemap.xml",
  catchAsync(async (_req, res) => {
    const base = env.siteUrl;

    // Static landing entries — high priority, infrequent changes.
    const staticUrls = [
      { loc: `${base}/`, changefreq: 'daily', priority: 1.0 },
      { loc: `${base}/about`, changefreq: 'monthly', priority: 0.4 },
      { loc: `${base}/contact`, changefreq: 'monthly', priority: 0.3 },
      { loc: `${base}/deals`, changefreq: 'daily', priority: 0.7 },
      { loc: `${base}/category`, changefreq: 'daily', priority: 0.8 },
      { loc: `${base}/terms`, changefreq: 'yearly', priority: 0.2 },
      { loc: `${base}/privacy`, changefreq: 'yearly', priority: 0.2 },
    ].map((e) => ({ ...e, lastmod: new Date() }));

    // Concurrent reads — three small queries, all selecting only what we need
    // for the sitemap so we don't pull rich text descriptions.
    const [products, categories, brands, ingredients] = await Promise.all([
      Product.find({ status: 'published' })
        .select('slug updatedAt')
        .sort({ updatedAt: -1 })
        .limit(SITEMAP_LIMIT)
        .lean(),
      Category.find({ isActive: true }).select('slug updatedAt').lean(),
      Brand.find({ isActive: true }).select('slug updatedAt').lean(),
      // `isIndexable` controls whether an ingredient page is included in
      // the sitemap and emits `noindex`. Active-but-not-indexable
      // ingredients still drive filters; they just don't get a sitemap entry.
      Ingredient.find({ isActive: true, isIndexable: true })
        .select('slug updatedAt')
        .lean(),
    ]);

    const productUrls = products.map((p) => ({
      loc: `${base}/product/${p.slug}`,
      lastmod: p.updatedAt,
      changefreq: 'weekly',
      priority: 0.8,
    }));

    const categoryUrls = categories.map((c) => ({
      loc: `${base}/category/${c.slug}`,
      lastmod: c.updatedAt,
      changefreq: 'weekly',
      priority: 0.6,
    }));

    const brandUrls = brands.map((b) => ({
      loc: `${base}/brand/${b.slug}`,
      lastmod: b.updatedAt,
      changefreq: 'weekly',
      priority: 0.5,
    }));

    const ingredientUrls = ingredients.map((i) => ({
      loc: `${base}/ingredient/${i.slug}`,
      lastmod: i.updatedAt,
      changefreq: 'weekly',
      priority: 0.6,
    }));

    const all = [...staticUrls, ...productUrls, ...categoryUrls, ...brandUrls, ...ingredientUrls].slice(0, SITEMAP_LIMIT);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all.map(buildUrl).join('\n')}
</urlset>`;

    res.set('Content-Type', 'application/xml; charset=utf-8');
    // Cache for 1 hour at the CDN, but allow up to 6 hours of stale-revalidate
    // so a slow regen never makes Google retry.
    res.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=21600');
    res.send(xml);
  })
);

// Server-rendered product page used by crawlers / structured-data validators.
// The full SPA shell is preserved (so a real browser visiting this URL ends
// up at the same React app), but the HTML now contains:
//   • <title>, <meta description>, OG/Twitter cards
//   • A canonical link
//   • Inline application/ld+json for both Product and BreadcrumbList
//   • A <noscript>/visible content fallback so even no-JS crawlers see the
//     product name, brand, price, description, benefits and uses
//
// This is the only reliable way to make Google's Schema Markup Validator
// (and similar tools that don't fully execute the SPA) recognise our product
// schema. Vercel rewrites /product/:slug to this endpoint; the response also
// loads the SPA bundle so client-side hydration takes over for real users.
router.get(
  "/prerender/product/:slug",
  catchAsync(async (req, res) => {
    const { slug } = req.params;

    const product = await Product.findOne({ slug, status: { $in: ['draft', 'published'] } })
      .populate('category', 'name slug')
      .populate('brand', 'name slug logo')
      .lean();

    if (!product) {
      // Slug renamed? Issue a real HTTP 301 so search engines transfer
      // PageRank from the old URL to the new one. Crawlers care; users
      // following stale bookmarks are routed cleanly.
      const redirect = await SeoRedirect.findOne({ fromPath: `/product/${slug}` }).lean();
      if (redirect?.toPath) {
        res.set('Cache-Control', 'public, max-age=86400');
        return res.redirect(redirect.statusCode || 301, `${env.siteUrl}${redirect.toPath}`);
      }

      // Soft 404 — still ship the SPA shell so the client can show its own
      // 404 component if a user follows a stale link.
      return res.status(404).type('html').send(buildShellHtml({
        title: 'Product not found · Stylogist',
        description: 'The product you are looking for is no longer available.',
        canonical: `${env.siteUrl}/product/${slug}`,
        bodyHtml: '',
        jsonLd: null,
      }));
    }

    const [variants, media] = await Promise.all([
      Variant.find({ product: product._id }).lean(),
      ProductMedia.find({ product: product._id })
        .sort({ isThumbnail: -1, position: 1 })
        .lean(),
    ]);

    const canonical = `${env.siteUrl}/product/${product.slug}`;
    const title = product.metaTitle?.trim() || `${product.name} | Stylogist`;
    const description = (
      product.metaDescription?.trim() ||
      stripHtml(product.shortDescription) ||
      stripHtml(product.description)
    ).slice(0, 160);

    // Resolve the public URL for media — we store either an absolute URL or
    // a path under /uploads.
    const mediaUrl = (m) => {
      if (!m?.url) return null;
      if (/^https?:\/\//i.test(m.url)) return m.url;
      return `${env.siteUrl}${m.url.startsWith('/') ? '' : '/'}${m.url}`;
    };
    const images = media.map(mediaUrl).filter(Boolean);
    const primaryImage = images[0] || null;

    // Pricing / availability aggregates.
    const minPrice = product.minPrice ?? (variants[0]?.salePrice ?? 0);
    const maxPrice = product.maxPrice ?? minPrice;
    const anyInStock = variants.some((v) => (v.stock ?? 0) > 0) || (product.totalStock ?? 0) > 0;

    const offers = variants.length
      ? variants.map((v) => ({
          '@type': 'Offer',
          sku: v.sku,
          price: v.salePrice,
          priceCurrency: 'PKR',
          availability: (v.stock ?? 0) > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
          url: canonical,
        }))
      : [{
          '@type': 'Offer',
          price: minPrice,
          priceCurrency: 'PKR',
          availability: anyInStock
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
          url: canonical,
        }];

    // UPC -> gtin12 (we only emit when the stored barcode is exactly 12
    // digits, matching the admin form's validation).
    const barcode = (product.barcode || '').replace(/\D/g, '');
    const gtin12 = barcode.length === 12 ? barcode : null;

    const additionalProperty = [];
    const id = product.itemDetails || {};
    if (id.itemForm) additionalProperty.push({ '@type': 'PropertyValue', name: 'Item form', value: id.itemForm });
    if (id.containerType) additionalProperty.push({ '@type': 'PropertyValue', name: 'Container type', value: id.containerType });
    if (id.ageRange) additionalProperty.push({ '@type': 'PropertyValue', name: 'Age range', value: id.ageRange });
    if (id.dosageForm) additionalProperty.push({ '@type': 'PropertyValue', name: 'Dosage form', value: id.dosageForm });

    const productJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description,
      image: images.length ? images : undefined,
      sku: variants[0]?.sku || undefined,
      mpn: variants[0]?.sku || undefined,
      brand: product.brand?.name ? { '@type': 'Brand', name: product.brand.name } : undefined,
      // Manufacturer surfaces in the prerendered Product schema too, so
      // structured-data validators that don't execute the SPA still see
      // the producing entity.
      manufacturer: product.manufacturer
        ? { '@type': 'Organization', name: product.manufacturer }
        : undefined,
      category: product.category?.name || undefined,
      url: canonical,
      ...(gtin12 ? { gtin12 } : {}),
      ...(additionalProperty.length ? { additionalProperty } : {}),
      ...(product.averageRating && product.totalReviews
        ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: product.averageRating,
              reviewCount: product.totalReviews,
            },
          }
        : {}),
      offers: offers.length === 1 ? offers[0] : offers,
    };

    const breadcrumbItems = [
      { name: 'Home', item: `${env.siteUrl}/` },
      { name: 'Shop', item: `${env.siteUrl}/category` },
    ];
    if (product.category?.slug) {
      breadcrumbItems.push({
        name: product.category.name,
        item: `${env.siteUrl}/category/${product.category.slug}`,
      });
    }
    if (product.brand?.slug) {
      breadcrumbItems.push({
        name: product.brand.name,
        item: `${env.siteUrl}/brand/${product.brand.slug}`,
      });
    }
    breadcrumbItems.push({ name: product.name, item: canonical });

    const breadcrumbJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems.map((it, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: it.name,
        item: it.item,
      })),
    };

    // Visible-in-DOM body so non-JS crawlers see the same content. The SPA
    // hydrates over this once it loads.
    const benefitsHtml = (product.benefits || []).length
      ? `<section><h2>Benefits</h2><ul>${product.benefits.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul></section>`
      : '';
    const usesHtml = (product.uses || []).length
      ? `<section><h2>Uses</h2><ul>${product.uses.map((u) => `<li>${escapeHtml(u)}</li>`).join('')}</ul></section>`
      : '';
    // "Why customers love it" cards — surface in the static HTML so crawlers
    // index the outcome-focused copy alongside the bullet list.
    const whyLoveHtml = (product.whyLoveIt || []).length
      ? `<section><h2>Why customers love it</h2><ul>${product.whyLoveIt
          .map((w) => `<li><strong>${escapeHtml(w.title || '')}</strong>${w.body ? ` — ${escapeHtml(w.body)}` : ''}</li>`)
          .join('')}</ul></section>`
      : '';
    const precautionsHtml = (product.precautions || []).length
      ? `<section><h2>Precautions &amp; safety</h2><ul>${product.precautions
          .map((p) => `<li>${escapeHtml(p)}</li>`)
          .join('')}</ul></section>`
      : '';
    const storageHtml = product.storage
      ? `<section><h2>Storage</h2><p>${escapeHtml(product.storage)}</p></section>`
      : '';
    const shortHtml = product.shortDescription
      ? `<p>${escapeHtml(stripHtml(product.shortDescription))}</p>`
      : '';
    const priceLabel =
      minPrice === maxPrice
        ? `Rs ${Math.round(minPrice).toLocaleString('en-US')}`
        : `Rs ${Math.round(minPrice).toLocaleString('en-US')} – Rs ${Math.round(maxPrice).toLocaleString('en-US')}`;

    const bodyHtml = `
      <article>
        <nav aria-label="Breadcrumb">
          ${breadcrumbItems
            .map((it, idx, arr) =>
              idx === arr.length - 1
                ? `<span>${escapeHtml(it.name)}</span>`
                : `<a href="${escapeAttr(it.item)}">${escapeHtml(it.name)}</a> &rsaquo;`
            )
            .join(' ')}
        </nav>
        <header>
          <h1>${escapeHtml(product.name)}</h1>
          ${product.brand?.name ? `<p><strong>Brand:</strong> <a href="${escapeAttr(`${env.siteUrl}/brand/${product.brand.slug}`)}">${escapeHtml(product.brand.name)}</a></p>` : ''}
          ${product.manufacturer ? `<p><strong>Manufacturer:</strong> ${escapeHtml(product.manufacturer)}</p>` : ''}
          ${product.category?.name ? `<p><strong>Category:</strong> <a href="${escapeAttr(`${env.siteUrl}/category/${product.category.slug}`)}">${escapeHtml(product.category.name)}</a></p>` : ''}
          <p><strong>Price:</strong> ${escapeHtml(priceLabel)}</p>
          ${gtin12 ? `<p><strong>UPC:</strong> ${escapeHtml(gtin12)}</p>` : ''}
        </header>
        ${primaryImage ? `<img src="${escapeAttr(primaryImage)}" alt="${escapeAttr(product.name)}" width="800" height="1000" />` : ''}
        ${shortHtml}
        ${whyLoveHtml}
        ${benefitsHtml}
        ${usesHtml}
        ${precautionsHtml}
        ${storageHtml}
      </article>
    `;

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set(
      'Cache-Control',
      'public, max-age=300, stale-while-revalidate=86400'
    );
    res.send(
      buildShellHtml({
        title,
        description,
        canonical,
        ogImage: primaryImage,
        bodyHtml,
        jsonLd: [productJsonLd, breadcrumbJsonLd],
      })
    );
  })
);

// Open Graph image generator. Returns a lightweight SVG with the brand
// teal background, the product name, the brand name, and the price overlay
// — used as og:image when a product hasn't been given a hero photo, or
// when the photo is portrait and would crop badly on social previews.
//
// SVG is intentional: zero binary deps, sub-2KB output, scales perfectly
// across Twitter / WhatsApp / FB previews. We set Content-Type:
// image/svg+xml and a long cache so the CDN serves it as a static asset.
router.get(
  "/og/product/:slug.svg",
  catchAsync(async (req, res) => {
    const { slug } = req.params;
    const product = await Product.findOne({ slug, status: 'published' })
      .populate('brand', 'name')
      .lean();
    if (!product) return res.status(404).type('text/plain').send('Not found');

    const name = (product.name || '').slice(0, 80);
    const brand = product.brand?.name || 'Stylogist';
    const minPrice = product.minPrice ?? 0;
    const priceLabel = `Rs ${Math.round(minPrice).toLocaleString('en-US')}`;

    // Word-wrap the title across up to 3 lines so long product names render.
    const wrapWords = (text, perLine = 26, maxLines = 3) => {
      const words = text.split(/\s+/);
      const lines = [];
      let line = '';
      for (const w of words) {
        if (lines.length === maxLines) break;
        const next = line ? `${line} ${w}` : w;
        if (next.length > perLine) {
          if (line) lines.push(line);
          line = w;
        } else {
          line = next;
        }
      }
      if (lines.length < maxLines && line) lines.push(line);
      if (lines.length === maxLines && line && lines[lines.length - 1] !== line) {
        // ellipsis cut
        lines[lines.length - 1] = lines[lines.length - 1].replace(/.{0,3}$/, '…');
      }
      return lines;
    };
    const titleLines = wrapWords(name, 24, 3);

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#007074"/>
      <stop offset="1" stop-color="#0a8c91"/>
    </linearGradient>
    <linearGradient id="card" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#f7f3f0"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="980" cy="120" r="240" fill="#7FD4D7" fill-opacity="0.18"/>
  <circle cx="220" cy="540" r="280" fill="#0a8c91" fill-opacity="0.25"/>
  <rect x="60" y="60" width="1080" height="510" rx="32" fill="url(#card)"/>
  <text x="100" y="160" fill="#007074" font-family="-apple-system,Segoe UI,sans-serif" font-size="22" font-weight="700" letter-spacing="6">STYLOGIST · ORIGINAL IMPORTED</text>
  <text x="100" y="225" fill="#777" font-family="-apple-system,Segoe UI,sans-serif" font-size="26" font-weight="600">${escapeXml(brand)}</text>
  ${titleLines
    .map(
      (l, i) =>
        `<text x="100" y="${320 + i * 70}" fill="#222" font-family="Georgia,serif" font-size="62" font-weight="900">${escapeXml(l)}</text>`
    )
    .join('\n  ')}
  <text x="100" y="540" fill="#007074" font-family="-apple-system,Segoe UI,sans-serif" font-size="44" font-weight="900">${escapeXml(priceLabel)}</text>
  <text x="100" y="585" fill="#999" font-family="-apple-system,Segoe UI,sans-serif" font-size="20" font-weight="600">Free delivery · Cash on Delivery in Pakistan</text>
</svg>`;

    res.set('Content-Type', 'image/svg+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    res.send(svg);
  })
);

router.get(
  "/robots.txt",
  catchAsync(async (_req, res) => {
    const base = env.siteUrl;
    const body = [
      'User-agent: *',
      'Allow: /',
      // Block admin and checkout-only routes from indexing.
      'Disallow: /admin',
      'Disallow: /admin/',
      'Disallow: /checkout',
      'Disallow: /cart',
      'Disallow: /wishlist',
      'Disallow: /profile',
      'Disallow: /api/',
      '',
      `Sitemap: ${base}/sitemap.xml`,
      '',
    ].join('\n');

    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(body);
  })
);

// Hand-rolled SPA shell. Mirrors the structure of the built Vite index.html
// closely enough that the React bundle can hydrate on top once it loads,
// while baking the per-page meta tags, canonical, Open Graph, and JSON-LD
// into the initial HTML response so crawlers/validators don't have to wait
// for JS execution to discover them.
//
// `frontendOrigin` defaults to env.siteUrl. The asset URL prefix is
// configurable via FRONTEND_ASSETS_URL when the SPA is hosted on a
// different domain (Vercel) than this API (Render).
function buildShellHtml({ title, description, canonical, ogImage, bodyHtml = '', jsonLd = null }) {
  const frontendOrigin = (process.env.FRONTEND_ASSETS_URL || env.siteUrl).replace(/\/$/, '');
  const ldList = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

  // Inline JSON.stringify; we already escape `</script>` to keep the script
  // tag well-formed even when the data contains it.
  const renderLd = (obj) =>
    `<script type="application/ld+json">${JSON.stringify(obj).replace(/<\/script/gi, '<\\/script')}</script>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#007074" />
  <meta name="format-detection" content="telephone=no" />
  <link rel="icon" type="image/png" sizes="32x32" href="${frontendOrigin}/logo.png?v=2" />
  <link rel="apple-touch-icon" href="${frontendOrigin}/logo.png?v=2" />
  <link rel="manifest" href="${frontendOrigin}/site.webmanifest" />

  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeAttr(description)}" />
  <link rel="canonical" href="${escapeAttr(canonical)}" />

  <!-- Open Graph / Twitter -->
  <meta property="og:type" content="product" />
  <meta property="og:title" content="${escapeAttr(title)}" />
  <meta property="og:description" content="${escapeAttr(description)}" />
  <meta property="og:url" content="${escapeAttr(canonical)}" />
  ${ogImage ? `<meta property="og:image" content="${escapeAttr(ogImage)}" />` : ''}
  <meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}" />
  <meta name="twitter:title" content="${escapeAttr(title)}" />
  <meta name="twitter:description" content="${escapeAttr(description)}" />
  ${ogImage ? `<meta name="twitter:image" content="${escapeAttr(ogImage)}" />` : ''}

  <!-- Structured data — Product + BreadcrumbList. Inline so validators that
       don't run JS still see the schema. -->
  ${ldList.map(renderLd).join('\n  ')}
</head>
<body>
  <div id="root">${bodyHtml}</div>
  <!-- The SPA bundle is served by the frontend host (Vercel). When this URL
       is hit through the Vercel rewrite, asset paths resolve relative to the
       same origin and the React app hydrates on top of the prerendered DOM. -->
</body>
</html>`;
}

export default router;
