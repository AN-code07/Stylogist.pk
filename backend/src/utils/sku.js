import crypto from "node:crypto";

// Strip non-alphanumerics, uppercase, take the first `len` chars. Pads with X on the right if short.
const token = (value, len = 3) => {
  const clean = (value || "").toString().replace(/[^A-Z0-9]/gi, "").toUpperCase();
  if (!clean) return "";
  return clean.slice(0, len).padEnd(len, "X");
};

// Short random suffix so that two variants with identical brand/category/product/attrs
// still get distinct SKUs (the unique index will reject true duplicates anyway).
const randomSuffix = (len = 4) =>
  crypto.randomBytes(6).toString("base64").replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, len).padEnd(len, "0");

/**
 * Builds a human-readable variant SKU, e.g. `NIK-SHO-AIRMAX90-BLK-M-A1B2`.
 *
 *   brandName       -> first 3 alnum chars ("Nike" -> "NIK"), fallback "STY"
 *   categoryName    -> first 3 alnum chars
 *   productSlug     -> first 8 alnum chars
 *   attrs           -> array of short tokens (color, size, material); falsy values are skipped
 */
export const generateVariantSku = ({
  brandName,
  categoryName,
  productSlug,
  attrs = [],
} = {}) => {
  const parts = [
    token(brandName) || "STY",
    token(categoryName) || "GEN",
    token(productSlug, 8) || "PROD",
    ...attrs.map((a) => token(a, 3)).filter(Boolean),
    randomSuffix(4),
  ];
  return parts.join("-");
};
