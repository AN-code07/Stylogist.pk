import mongoose from "mongoose";
import { Review } from "./review.model.js";
import { Product } from "../products/product.model.js";
import { User } from "../users/user.model.js";
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
  const { product, rating, comment, order } = payload;

  const productDoc = await Product.findById(product).select("_id").lean();
  if (!productDoc) throw new ApiError(404, "Product not found");

  const existing = await Review.findOne({ user: userId, product });
  if (existing) {
    throw new ApiError(409, "You have already reviewed this product. Edit or delete the previous one to re-review.");
  }

  const review = await Review.create({
    user: userId,
    product,
    order,
    rating,
    comment: comment || "",
  });

  // New reviews start `pending`, so they don't touch product stats until moderated.
  return review.populate([
    { path: "user", select: "name" },
    { path: "product", select: "name slug" },
  ]);
};
