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
      // Drafts can be saved with an empty description (auto-save fires the
      // moment an admin leaves the form, so we can't require copy that
      // hasn't been written yet). Publishing still demands a description
      // — see product.service.publishGuard for the runtime check.
      required: function () {
        return this.status === 'published';
      },
      default: '',
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
    // via the `gtin` JSON-LD field for richer search results. We persist the
    // raw value here and a discriminator on `gtinType` so the storefront
    // can emit the correct schema.org property (gtin12 / gtin13 / isbn).
    barcode: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    // Identifier type. Drives both server-side validation (length / charset)
    // and the client-side input mask. Empty string means the admin hasn't
    // assigned a code yet.
    gtinType: {
      type: String,
      enum: ["", "upc", "ean", "isbn"],
      default: "",
    },

    // Benefit + use rows now carry an optional banner image alongside the
    // text. The admin form accepts CSV input + per-row banner upload, the
    // PDP renders the banner above the bullet. Legacy plain-string rows
    // still deserialize fine — see normalizeContentList in product.service.
    benefits: {
      type: [
        new mongoose.Schema(
          {
            text: { type: String, required: true, trim: true },
            image: { type: String, default: "", trim: true },
          },
          { _id: false }
        ),
      ],
      default: [],
    },

    uses: {
      type: [
        new mongoose.Schema(
          {
            text: { type: String, required: true, trim: true },
            image: { type: String, default: "", trim: true },
          },
          { _id: false }
        ),
      ],
      default: [],
    },

    // "Why customers love it" — simplified to a single-input headline list.
    // The previous icon + body fields were removed per product spec — keep
    // the row deserialization permissive so older docs with icon/body
    // still load (they're just ignored at render time).
    whyLoveIt: {
      type: [
        new mongoose.Schema(
          {
            title: { type: String, required: true, trim: true },
          },
          { _id: false, strict: false }
        ),
      ],
      default: [],
    },

    // "Ingredient highlight" block — same shape as howToUse (rich text +
    // optional banner image). Used to call out a hero ingredient or
    // formulation note on the PDP, sitting between the description and
    // the howToUse block when populated.
    ingredientHighlight: {
      type: new mongoose.Schema(
        {
          text: { type: String, default: "", trim: true },
          image: { type: String, default: "", trim: true },
        },
        { _id: false }
      ),
      default: () => ({}),
    },

    // Safety / precautions copy. Required by supplement YMYL guidance — when
    // populated, the PDP renders a visually-distinct warning section with
    // an explicit heading. Plain string array (one bullet per line).
    precautions: {
      type: [String],
      default: [],
    },

    // Storage / shelf-life advice (e.g. "Store in a cool, dry place. Keep
    // out of reach of children."). Free-form string; rendered in Item
    // Details + Specifications when present.
    storage: {
      type: String,
      default: "",
      trim: true,
    },

    // "How to use" block — a short description-style copy + a single
    // optional image. Distinct from `uses` (which is bullets). Renders
    // as a body paragraph + thumbnail on the product page.
    howToUse: {
      type: new mongoose.Schema(
        {
          text: { type: String, default: "", trim: true },
          image: { type: String, default: "", trim: true },
        },
        { _id: false }
      ),
      default: () => ({}),
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
      // Same draft-vs-published split as `description`: drafts can be
      // parked without a category so we don't lose half-typed work.
      required: function () {
        return this.status === 'published';
      },
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

    // Manufacturer — distinct from `brand`. Schema.org models these as
    // separate Organizations: a brand owns the product identity, while
    // the manufacturer is the entity that physically produces it (often
    // an OEM / contract manufacturer). For supplements this is a strong
    // authenticity signal — buyers care whether their multivitamin is
    // made in the US, EU, or a regional facility. Free-form string so
    // admins can type the full legal name + country if they want.
    manufacturer: {
      type: String,
      trim: true,
      default: "",
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

    // Per-product sales tax / GST percentage. Applied on top of the sale
    // price at checkout time and surfaced as a discrete line in the PDP
    // order summary. Stored as a percentage (e.g. 17 for 17%) so the
    // admin form can edit it directly without scaling. 0 = tax-included
    // or tax-exempt; the PDP hides the tax row when this is 0.
    taxPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
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
