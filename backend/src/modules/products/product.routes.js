import { Router } from "express";
import * as ProductController from "./product.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { restrictTo, hasPermission } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { catchAsync } from "../../utils/catchAsync.js";
import {
  createProductSchema,
  updateProductSchema,
  productSlugParamSchema,
  productIdParamSchema,
  productSearchSchema,
} from "./product.validation.js";

const router = Router();

const adminWrite = [
  authMiddleware,
  restrictTo("Super Admin", "Staff"),
  hasPermission("products:write"),
];

router.get("/filters/meta", catchAsync(ProductController.getFilterMetadata));
router.get("/", catchAsync(ProductController.getAllProducts));
// Body-driven listing — filters never leak into the URL.
router.post("/search", validate(productSearchSchema), catchAsync(ProductController.searchProducts));
router.get("/id/:id", validate(productIdParamSchema), catchAsync(ProductController.getProductById));
router.get("/:slug", validate(productSlugParamSchema), catchAsync(ProductController.getProductBySlug));

router.post("/", ...adminWrite, validate(createProductSchema), catchAsync(ProductController.createProduct));
router.patch("/:id", ...adminWrite, validate(updateProductSchema), catchAsync(ProductController.updateProduct));
router.delete("/:id", ...adminWrite, validate(productIdParamSchema), catchAsync(ProductController.deleteProduct));

export default router;
