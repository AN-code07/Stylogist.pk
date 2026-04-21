import { Router } from "express";
import * as SettingsController from "./settings.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { restrictTo } from "../../middlewares/role.middleware.js";
import { catchAsync } from "../../utils/catchAsync.js";

const router = Router();

const adminOnly = [authMiddleware, restrictTo("Super Admin", "Staff")];

// Public read — every storefront page fetches this for the footer.
router.get("/", catchAsync(SettingsController.getPublicSettings));

// Admin write — partial patch on the singleton settings doc.
router.patch("/", ...adminOnly, catchAsync(SettingsController.updateSettings));

export default router;
