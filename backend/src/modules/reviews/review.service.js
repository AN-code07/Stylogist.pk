import mongoose from "mongoose";
import { Review } from "./review.model.js";
import { Product } from "../products/product.model.js";
import { User } from "../users/user.model.js";
import Order from "../orders/order.model.js";
import { ApiError } from "../../utils/ApiError.js";

// Recomputes Product.averageRating + Product.totalReviews from *approved* reviews.
// Keeping this server-side so denormalized fields never drift from the source of truth.
const recomputeProductStats = async (productId) => {
  const [agg] = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId), status: "approved" } },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  await Product.findByIdAndUpdate(productId, {
    averageRating: Number((agg?.averageRating || 0).toFixed(2)),
    totalReviews: agg?.totalReviews || 0,
  });
};

// ------------- Admin: list / moderate / delete -------------

export const listReviews = async (query = {}) => {
  const { status = "all", search = "", rating, page = 1, limit = 20 } = query;

  const filter = {};
  if (["pending", "approved", "flagged"].includes(status)) filter.status = status;
  if (rating) filter.rating = Number(rating);

  // Search matches against the comment directly; for name/product searches we
  // resolve matching user/product ids first and include them in the filter.
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const [userIds, productIds] = await Promise.all([
      User.find({ $or: [{ name: rx }, { email: rx }] }).distinct("_id"),
      Product.find({ name: rx }).distinct("_id"),
    ]);
    filter.$or = [
      { comment: rx },
      { user: { $in: userIds } },
      { product: { $in: productIds } },
    ];
  }

  const pageNum = Math.max(Number(page), 1);
  const pageSize = Math.min(Math.max(Number(limit), 1), 100);

  const [items, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .populate("user", "name email")
      .populate("product", "name slug")
      .lean(),
    Review.countDocuments(filter),
  ]);

  return {
    items,
    pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total / pageSize) },
  };
};

export const updateReviewStatus = async (id, status) => {
  const review = await Review.findById(id);
  if (!review) throw new ApiError(404, "Review not found");

  review.status = status;
  await review.save();

  // A status flip can change whether a review contributes to the product's rating.
  await recomputeProductStats(review.product);

  return review.populate([
    { path: "user", select: "name email" },
    { path: "product", select: "name slug" },
  ]);
};

// Admin-authored review. Bypasses the "must have a delivered order" check
// because the admin is authoring on behalf of someone (e.g. a paper survey,
// a marketplace import, or seeding the catalogue).
export const adminCreateReview = async (adminId, payload) => {
  const { product, user, displayName, rating, comment, image, status } = payload;

  const productDoc = await Product.findById(product).select("_id").lean();
  if (!productDoc) throw new ApiError(404, "Product not found");

  // Resolve the author. If `user` is provided we attach the review to that
  // account; otherwise we fall back to the acting admin and stash the
  // displayName in a custom field so the storefront shows the right author.
  let authorId = user;
  if (user) {
    const exists = await User.exists({ _id: user });
    if (!exists) throw new ApiError(404, "Selected user not found");
  } else {
    authorId = adminId;
  }

  // Multiple admin reviews per product/user are now allowed — the previous
  // 409 duplicate guard has been removed so an admin can seed several
  // testimonials against the same staff account. (The unique index on
  // review.model has been dropped to match.)

  const review = await Review.create({
    user: authorId,
    product,
    rating,
    comment: comment || "",
    image: image || "",
    status: status || "approved",
    displayName: displayName || undefined,
  });

  if (review.status === "approved") {
    await recomputeProductStats(product);
  }

  return review.populate([
    { path: "user", select: "name email" },
    { path: "product", select: "name slug" },
  ]);
};

// Admin-edit: arbitrary fields are mutable. Recomputes product stats whenever
// rating or status changes so denormalised aggregates never drift.
export const adminUpdateReview = async (id, payload) => {
  const review = await Review.findById(id);
  if (!review) throw new ApiError(404, "Review not found");

  const ratingChanged = payload.rating !== undefined && payload.rating !== review.rating;
  const statusChanged = payload.status !== undefined && payload.status !== review.status;

  if (payload.rating !== undefined) review.rating = payload.rating;
  if (payload.comment !== undefined) review.comment = payload.comment;
  if (payload.image !== undefined) review.image = payload.image;
  if (payload.status !== undefined) review.status = payload.status;
  if (payload.displayName !== undefined) review.displayName = payload.displayName;

  await review.save();

  if (ratingChanged || statusChanged) {
    await recomputeProductStats(review.product);
  }

  return review.populate([
    { path: "user", select: "name email" },
    { path: "product", select: "name slug" },
  ]);
};

export const deleteReview = async (id) => {
  const review = await Review.findById(id);
  if (!review) throw new ApiError(404, "Review not found");
  const productId = review.product;
  await review.deleteOne();
  await recomputeProductStats(productId);
  return { id };
};

// ------------- Public / customer -------------

export const listProductReviews = async (productSlugOrId) => {
  const filter = mongoose.isValidObjectId(productSlugOrId)
    ? { _id: productSlugOrId }
    : { slug: productSlugOrId };
  const product = await Product.findOne(filter).select("_id").lean();
  if (!product) throw new ApiError(404, "Product not found");

  const reviews = await Review.find({ product: product._id, status: "approved" })
    .sort({ createdAt: -1 })
    .populate("user", "name")
    .lean();

  return reviews;
};

export const createReview = async (userId, payload) => {
  const { product, rating, comment, image, order } = payload;

  const productDoc = await Product.findById(product).select("_id").lean();
  if (!productDoc) throw new ApiError(404, "Product not found");

  // Best-effort link to a delivered order. The verified-buyer badge on
  // the storefront keys off `order` being set — when the user has no
  // delivered order we still accept the review (per the new spec that
  // removed the eligibility gate), the badge just doesn't render.
  let orderDoc = null;
  if (order) {
    orderDoc = await Order.findOne({
      _id: order,
      user: userId,
      status: "delivered",
      "items.product": product,
    }).lean();
  } else {
    orderDoc = await Order.findOne({
      user: userId,
      status: "delivered",
      "items.product": product,
    })
      .sort({ updatedAt: -1 })
      .lean();
  }

  // The unique (user, product) index has been removed — multiple reviews
  // per product/user pair are now allowed so admins (and the seeding
  // flow) can stack social proof. The duplicate-guard query is gone.

  const review = await Review.create({
    user: userId,
    product,
    order: orderDoc?._id || null,
    rating,
    comment: comment || "",
    image: image || "",
  });

  // New reviews start `pending`, so they don't touch product stats until moderated.
  return review.populate([
    { path: "user", select: "name" },
    { path: "product", select: "name slug" },
  ]);
};

// Tiny helper the frontend calls to decide whether to show "Write a review".
// Returns { canReview, hasReviewed, orderId }.
export const checkReviewEligibility = async (userId, productId) => {
  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product id");
  }
  const [hasReviewed, order] = await Promise.all([
    Review.exists({ user: userId, product: productId }),
    Order.findOne({
      user: userId,
      status: "delivered",
      "items.product": productId,
    })
      .select("_id")
      .sort({ updatedAt: -1 })
      .lean(),
  ]);
  return {
    canReview: !!order && !hasReviewed,
    hasReviewed: !!hasReviewed,
    orderId: order?._id || null,
  };
};
