import mongoose from "mongoose";

// Persistent 301 redirect map. Whenever an admin renames a product (and the
// slug changes), we drop a row here pointing the old slug at the new one.
// `/api/v1/products/:slug` falls through to redirectService.resolveSlug
// before returning 404, so backlinks and bookmarks survive a rename without
// a CMS round-trip.
//
// The same collection can later host hand-authored marketing redirects
// (e.g. /winter-sale → /category/seasonal) — `kind` discriminates source.
const redirectSchema = new mongoose.Schema(
  {
    fromPath: { type: String, required: true, unique: true, index: true, trim: true },
    toPath: { type: String, required: true, trim: true },
    kind: { type: String, enum: ["product", "manual"], default: "product", index: true },
    statusCode: { type: Number, default: 301 },
    // Useful for housekeeping: chains of renames collapse via the resolver,
    // but if a redirect itself is renamed we keep the parent reference.
    sourceProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

export const SeoRedirect = mongoose.model("SeoRedirect", redirectSchema);
