import mongoose from "mongoose";

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
      default: 0,
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

export const Product = mongoose.model("Product", productSchema);
