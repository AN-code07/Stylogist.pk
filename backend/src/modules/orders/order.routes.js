import { Router } from "express";
import * as OrderController from "./order.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createOrderSchema } from "./order.validation.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { optionalAuthMiddleware } from "../../middlewares/optionalAuth.middleware.js";

const router = Router();

// Place an order — accepts both signed-in customers and guest checkouts.
// The order.service checks which branch based on whether req.user is set.
router.post(
  "/",
  optionalAuthMiddleware,
  validate(createOrderSchema),
  catchAsync(OrderController.createOrder)
);

// Customer-only routes: listing / viewing their own orders.
router.get("/me", authMiddleware, catchAsync(OrderController.listMyOrders));
router.get("/me/:id", authMiddleware, catchAsync(OrderController.getMyOrder));

export default router;
