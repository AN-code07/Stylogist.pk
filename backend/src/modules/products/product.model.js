import mongoose from "mongoose";

const itemDetailsSchema = new mongoose.Schema(
  {
    itemForm: { type: String, trim: true, default: "" },
    containerType: { type: String, trim: true, default: "" },
    ageRange: { type: String, trim: true, default: "" },
    dosageForm: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

// Per-product FAQ entry. Same shape as the Ingredient FAQ block so the
// storefront can emit a uniform Schema.org FAQPage JSON-LD on either
// surface. Subdoc kept embedded (no _id) to keep the wire payload small.
const productFaqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
    },

    title: String,

    description: {
      type: String,
      required: true,
    },

    shortDescription: String,

    metaTitle: {
      type: String,
      trim: true,
      default: "",
    },

    metaDescription: {
      type: String,
      trim: true,
      default: "",
    },

    // Global product identifier (ISBN / UPC / EAN / GTIN). Surfaced to Google
    // via the `gtin` JSON-LD field for richer search results.
    barcode: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    // Bullet-style copy rendered as <ul> on the storefront under H2 sections.
    benefits: {
      type: [String],
      default: [],
    },

    uses: {
      type: [String],
      default: [],
    },

    // Per-product FAQ. Surfaces on the product page as an accordion AND
    // is emitted as Schema.org FAQPage JSON-LD for rich-result eligibility.
    // Stored as an embedded array because we always read it with the
    // product and never query individual entries.
    faq: { type: [productFaqSchema], default: [] },

    // Structured spec block. Embedded (rather than a separate collection)
    // because it's always read with the product and never queried in isolation.
    itemDetails: {
      type: itemDetailsSchema,
      default: () => ({}),
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    // Multi-select: a product can live in several categories/sub-categories
    // at once. `category` above is kept as the primary (first selected) so
    // existing queries that filter on `category` continue to work.
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        index: true,
      },
    ],

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      index: true,
    },

    // Many-to-many link to the canonical Ingredient taxonomy. Drives the
    // storefront ingredient filter and the /ingredient/:slug SEO pages.
    // Distinct from `Variant.ingredients` (free-text per variant) — this
    // is the structured tagging that supports indexed queries.
    ingredients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ingredient",
      },
    ],

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    dealStart: Date,
    dealEnd: Date,

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Curated storefront rails. Admins tag products that should surface on
    // the home "Trending" row and the "Deals of the Day" grid — keeps the
    // merchandising selection out of implicit rules (rating thresholds etc.)
    // and fully editable from the dashboard.
    isTrending: {
      type: Boolean,
      default: false,
      index: true,
    },

    isDeal: {
      type: Boolean,
      default: false,
      index: true,
    },

    averageRating: {
      type: Number,
      default: 0,
    },

    minPrice: {
      type: Number,
      index: true,
    },

    maxPrice: {
      type: Number,
    },

    totalStock: {
      type: Number,
      default: 50,
      index: true,
    },

    discountPercentage: {
      type: Number,
      default: 0,
      index: true,
    },

    isDealActive: {
      type: Boolean,
      default: false,
      index: true,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },

    totalSales: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", metaTitle: "text", metaDescription: "text" });

// Storefront sort/filter combinations. These compound indexes let the
// category/listing query hit a single index for (status filter + sort key)
// instead of fetching and in-memory sorting, which is the hot path on the
// public shop pages.
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ status: 1, minPrice: 1 });
productSchema.index({ status: 1, averageRating: -1 });
productSchema.index({ status: 1, totalSales: -1 });
productSchema.index({ status: 1, isDealActive: 1 });
productSchema.index({ category: 1, status: 1, createdAt: -1 });
productSchema.index({ brand: 1, status: 1, createdAt: -1 });
// Multikey index for the ingredient filter — Mongo automatically expands
// the ObjectId array, so a {ingredients: <id>} query (or $in / $all over
// multiple ids) is a single bounded index scan instead of a collscan.
productSchema.index({ ingredients: 1, status: 1, createdAt: -1 });

export const Product = mongoose.model("Product", productSchema);
