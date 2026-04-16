import { Router } from "express";
import * as ProductController from "./product.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { restrictTo } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { catchAsync } from "../../utils/catchAsync.js";
import {
  createProductSchema,
  productSlugParamSchema,
  productIdParamSchema,
} from "./product.validation.js";

const router = Router();

const adminOnly = [authMiddleware, restrictTo("Super Admin", "Staff")];

// Static-prefixed routes before dynamic param routes so Express does not
// mis-route `/filters/meta` into the `:slug` handler.
router.get("/filters/meta", catchAsync(ProductController.getFilterMetadata));
router.get("/", catchAsync(ProductController.getAllProducts));
router.get("/id/:id", validate(productIdParamSchema), catchAsync(ProductController.getProductById));
router.get("/:slug", validate(productSlugParamSchema), catchAsync(ProductController.getProductBySlug));

router.post("/", ...adminOnly, validate(createProductSchema), catchAsync(ProductController.createProduct));
router.delete("/:id", ...adminOnly, validate(productIdParamSchema), catchAsync(ProductController.deleteProduct));

export default router;
