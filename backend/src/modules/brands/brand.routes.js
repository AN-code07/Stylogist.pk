import { Router } from "express";
import * as BrandController from "./brand.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { restrictTo } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { catchAsync } from "../../utils/catchAsync.js";
import {
  createBrandSchema,
  updateBrandSchema,
  brandIdParamSchema,
} from "./brand.validation.js";

const router = Router();

const adminOnly = [authMiddleware, restrictTo("Super Admin", "Staff")];

// Public reads
router.get("/", catchAsync(BrandController.listBrands));
router.get("/:id", validate(brandIdParamSchema), catchAsync(BrandController.getBrand));

// Admin writes
router.post("/", ...adminOnly, validate(createBrandSchema), catchAsync(BrandController.createBrand));
router.patch("/:id", ...adminOnly, validate(updateBrandSchema), catchAsync(BrandController.updateBrand));
router.delete("/:id", ...adminOnly, validate(brandIdParamSchema), catchAsync(BrandController.deleteBrand));

export default router;
