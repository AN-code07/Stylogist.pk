// Builds the SEO title + description used on product pages when the admin
// has NOT supplied a custom meta. Generated copy follows the proven
// supplement-ecommerce pattern:
//
//   Title       = "{name} – Original Imported {category} in Pakistan"   (50–65 chars)
//   Description = benefit + COD + free delivery + brand                 (150–160 chars)
//
// Reads cleanly when surfaced in the SERP, contains the buying-intent
// modifiers Pakistani shoppers query for, and stays inside Google's
// rendered-pixel budget. Pure function — no side effects, no hooks,
// safe to call inside useMemo.

const SITE = 'Stylogist';
const COUNTRY = 'Pakistan';

// Hard caps tuned to Google's typical SERP truncation thresholds.
// Title: ~60 chars desktop, leave a little headroom for the site name.
// Description: 155 is the safest cap before "..." truncation appears.
const TITLE_MAX = 65;
const DESC_MAX = 158;

const stripHtml = (html) =>
  (html || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Clamp at a word boundary so we don't end mid-word.
const clamp = (text, max) => {
  if (!text) return '';
  if (text.length <= max) return text;
  const sliced = text.slice(0, max - 1);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${sliced.slice(0, lastSpace > 0 ? lastSpace : sliced.length).trim()}…`;
};

const niceCategory = (product) => {
  const cat = product?.category?.name?.trim();
  if (cat) return cat;
  const form = product?.itemDetails?.itemForm?.trim();
  if (form) return form;
  return 'Supplement';
};

export const buildProductTitle = (product, opts = {}) => {
  if (!product?.name) return SITE;
  // Admin-supplied meta is sacred: pass through verbatim, no clamping.
  // Google may visually truncate longer copy in the SERP, but the stored
  // and emitted <title> stays exactly as the admin wrote it.
  if (product.metaTitle?.trim() && opts.respectAdmin !== false) {
    return product.metaTitle.trim();
  }
  const category = niceCategory(product);

  // Auto-generated fallback only — when the admin leaves meta blank we
  // pick a candidate that fits Google's ~65-char SERP budget so the
  // synthesized title reads naturally. The admin can always override
  // with longer copy and that copy is preserved as-is above.
  const candidates = [
    `${product.name} – Original Imported ${category} in ${COUNTRY}`,
    `${product.name} – Original ${category} in ${COUNTRY}`,
    `${product.name} – ${category} in ${COUNTRY}`,
    `${product.name} | ${SITE}`,
    product.name,
  ];
  for (const c of candidates) {
    if (c.length <= TITLE_MAX) return c;
  }
  return clamp(product.name, TITLE_MAX);
};

export const buildProductDescription = (product, opts = {}) => {
  if (!product) return '';
  // Admin-supplied meta wins verbatim — no truncation regardless of length.
  if (product.metaDescription?.trim() && opts.respectAdmin !== false) {
    return product.metaDescription.trim();
  }

  const brand = product.brand?.name?.trim();
  const category = niceCategory(product).toLowerCase();
  // Benefits is now { image, items: string[] }; older docs may still carry
  // the legacy [{text, image}] array or plain string[]. Pull the first
  // bullet from whichever shape arrived.
  const firstBenefit = (() => {
    const raw = product.benefits;
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      return Array.isArray(raw.items) ? (raw.items[0] || '') : '';
    }
    if (Array.isArray(raw) && raw.length) {
      const head = raw[0];
      if (typeof head === 'string') return head;
      return head?.text || head?.title || '';
    }
    return '';
  })();

  // Prefer admin-authored shortDescription as the lead. Fallback to a
  // benefit + brand-aware sentence so the SERP entry still reads naturally.
  const lead =
    stripHtml(product.shortDescription) ||
    stripHtml(product.description).slice(0, 80) ||
    (firstBenefit
      ? `Supports ${firstBenefit.toLowerCase()}.`
      : `Premium ${category}${brand ? ` by ${brand}` : ''}.`);

  // Auto-generated fallback: clamp to keep the synthesized copy inside
  // the SERP budget. Admin overrides above are NOT clamped.
  const trustTrail = `Original imported ${category}, free delivery & cash on delivery across ${COUNTRY}.`;
  return clamp(`${lead} ${trustTrail}`, DESC_MAX);
};

// Builds an SEO-friendly alt attribute when the admin hasn't supplied one
// per-image. Format: "{product name} — {brand} — {form} in {country}".
export const buildProductImageAlt = (product, fallbackIndex = 0) => {
  if (!product?.name) return '';
  const brand = product.brand?.name?.trim();
  const form = product.itemDetails?.itemForm?.trim();
  const bits = [product.name];
  if (brand) bits.push(brand);
  if (form) bits.push(form);
  bits.push(`in ${COUNTRY}`);
  const base = bits.join(' — ');
  return fallbackIndex > 0 ? `${base} (image ${fallbackIndex + 1})` : base;
};
