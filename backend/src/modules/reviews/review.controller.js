import * as ReviewService from "./review.service.js";

// Admin
export const listReviews = async (req, res) => {
  const { items, pagination } = await ReviewService.listReviews(req.query);
  res.status(200).json({ status: "success", results: items.length, pagination, data: items });
};

export const updateReviewStatus = async (req, res) => {
  const review = await ReviewService.updateReviewStatus(req.params.id, req.validated.body.status);
  res.status(200).json({ status: "success", message: "Review updated", data: review });
};

export const deleteReview = async (req, res) => {
  await ReviewService.deleteReview(req.params.id);
  res.status(200).json({ status: "success", message: "Review deleted" });
};

// Public
export const listProductReviews = async (req, res) => {
  const reviews = await ReviewService.listProductReviews(req.params.productId);
  res.status(200).json({ status: "success", results: reviews.length, data: reviews });
};

// Authenticated customer
export const createReview = async (req, res) => {
  const review = await ReviewService.createReview(req.user.id, req.validated.body);
  res.status(201).json({ status: "success", message: "Review submitted (pending moderation)", data: review });
};
