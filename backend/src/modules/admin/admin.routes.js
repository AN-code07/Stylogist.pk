import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { restrictTo } from '../../middlewares/role.middleware.js';
import { adminLoginSchema, createAdminSchema } from './admin.validation.js';
import { catchAsync } from '../../utils/catchAsync.js';

const router = Router();

router.post('/login', validate(adminLoginSchema), catchAsync(adminController.adminLogin));

router.use(authMiddleware);

router.post('/logout', catchAsync(adminController.adminLogout));

const adminOrStaff = restrictTo('Super Admin', 'Staff');

// Super Admin only (note: previous `'Super Admin' || "Staff"` short-circuited and
// was equivalent to just 'Super Admin' — retained that scope intentionally here).
router.post(
  '/create-admin',
  restrictTo('Super Admin'),
  validate(createAdminSchema),
  catchAsync(adminController.createAdmin)
);

// Dashboard stats
router.get('/stats/overview', adminOrStaff, catchAsync(adminController.getOverview));
router.get('/stats/analytics', adminOrStaff, catchAsync(adminController.getAnalytics));

// Customer management
router.get('/customers', adminOrStaff, catchAsync(adminController.listCustomers));
router.get('/customers/:id', adminOrStaff, catchAsync(adminController.getCustomer));
router.patch('/customers/:id/block', adminOrStaff, catchAsync(adminController.blockCustomer));
router.patch('/customers/:id/unblock', adminOrStaff, catchAsync(adminController.unblockCustomer));

// Order management
router.get('/orders', adminOrStaff, catchAsync(adminController.listOrders));
router.get('/orders/:id', adminOrStaff, catchAsync(adminController.getOrder));
router.patch('/orders/:id/status', adminOrStaff, catchAsync(adminController.updateOrderStatus));

export default router;
