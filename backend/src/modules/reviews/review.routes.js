import { Router } from "express";
import * as ReviewController from "./review.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { restrictTo } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { catchAsync } from "../../utils/catchAsync.js";
import {
  createReviewSchema,
  updateReviewStatusSchema,
  reviewIdParamSchema,
} from "./review.validation.js";

const router = Router();

const adminOnly = [authMiddleware, restrictTo("Super Admin", "Staff")];

// Public: list approved reviews for a product (by slug or id).
router.get("/product/:productId", catchAsync(ReviewController.listProductReviews));

// Customer: submit a review.
router.post("/", authMiddleware, validate(createReviewSchema), catchAsync(ReviewController.createReview));

// Admin: moderate.
router.get("/", ...adminOnly, catchAsync(ReviewController.listReviews));
router.patch(
  "/:id/status",
  ...adminOnly,
  validate(updateReviewStatusSchema),
  catchAsync(ReviewController.updateReviewStatus)
);
router.delete(
  "/:id",
  ...adminOnly,
  validate(reviewIdParamSchema),
  catchAsync(ReviewController.deleteReview)
);

export default router;
