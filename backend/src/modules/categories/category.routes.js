import { Router } from "express";
import * as CategoryController from "./category.controller.js";
import { catchAsync } from "../../utils/catchAsync.js"
// import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

// Public
router.get("/", catchAsync(CategoryController.getAllCategories));
router.get("/tree", catchAsync(CategoryController.getCategoryTree));

// Admin
// router.post("/", authMiddleware, CategoryController.createCategory);

export default router;