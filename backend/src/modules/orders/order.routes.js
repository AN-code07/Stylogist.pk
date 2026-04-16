import { Router } from "express";
import * as OrderController from "./order.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createOrderSchema } from "./order.validation.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

// Customer order lifecycle.
router.post("/", validate(createOrderSchema), catchAsync(OrderController.createOrder));
router.get("/me", catchAsync(OrderController.listMyOrders));
router.get("/me/:id", catchAsync(OrderController.getMyOrder));

export default router;
