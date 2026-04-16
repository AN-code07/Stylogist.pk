import { Router } from "express";
import * as CategoryController from "./category.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { restrictTo } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { catchAsync } from "../../utils/catchAsync.js";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
} from "./category.validation.js";

const router = Router();

const adminOnly = [authMiddleware, restrictTo("Super Admin", "Staff")];

// Public reads — /tree must come before /:id so it isn't captured by the param route.
router.get("/tree", catchAsync(CategoryController.getCategoryTree));
router.get("/", catchAsync(CategoryController.getAllCategories));
router.get("/:id", validate(categoryIdParamSchema), catchAsync(CategoryController.getCategory));

// Admin writes
router.post("/", ...adminOnly, validate(createCategorySchema), catchAsync(CategoryController.createCategory));
router.patch("/:id", ...adminOnly, validate(updateCategorySchema), catchAsync(CategoryController.updateCategory));
router.delete("/:id", ...adminOnly, validate(categoryIdParamSchema), catchAsync(CategoryController.deleteCategory));

export default router;
