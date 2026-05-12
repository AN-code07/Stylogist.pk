import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      default: "",
    },
    // Reviewer-supplied photo. Used both by registered customers (their
    // own upload via /uploads/image) and by the admin "seed a review"
    // flow. Empty string when none.
    image: {
      type: String,
      trim: true,
      default: "",
    },
    // Override author name. Optional. When set, the PDP renders this in
    // place of the registered user's name — admins can hide internal
    // accounts behind a public-facing identity.
    displayName: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "flagged"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

// The previous unique index on (user, product) was removed: admins now
// need to seed multiple reviews per product, and the eligibility-gate
// logic moved into the service layer so it can be skipped on the admin
// path. (Standard service migrations: drop the index manually in prod
// with `db.reviews.dropIndex("user_1_product_1")` after deploying.)

export const Review = mongoose.model("Review", reviewSchema);
