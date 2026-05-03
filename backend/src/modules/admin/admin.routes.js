import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { restrictTo, hasPermission } from '../../middlewares/role.middleware.js';
import {
  adminLoginSchema,
  createAdminSchema,
  updateStaffPermissionsSchema,
} from './admin.validation.js';
import { catchAsync } from '../../utils/catchAsync.js';

const router = Router();

router.post('/login', validate(adminLoginSchema), catchAsync(adminController.adminLogin));

router.use(authMiddleware);

router.post('/logout', catchAsync(adminController.adminLogout));

// Restrict the whole admin namespace to admins. Permission checks below
// further refine what each Staff user can do.
router.use(restrictTo('Super Admin', 'Staff'));

// Super Admin only — staff management & onboarding.
router.post(
  '/create-admin',
  restrictTo('Super Admin'),
  validate(createAdminSchema),
  catchAsync(adminController.createAdmin)
);

// Permissions catalogue + per-staff editor — both Super Admin only.
router.get('/permissions', restrictTo('Super Admin'), catchAsync(adminController.listPermissions));
router.get('/staff', restrictTo('Super Admin'), catchAsync(adminController.listStaff));
router.patch(
  '/staff/:id/permissions',
  restrictTo('Super Admin'),
  validate(updateStaffPermissionsSchema),
  catchAsync(adminController.updateStaffPermissions)
);

// Dashboard stats
router.get('/stats/overview', hasPermission('analytics:read'), catchAsync(adminController.getOverview));
router.get('/stats/analytics', hasPermission('analytics:read'), catchAsync(adminController.getAnalytics));

// Customer management
router.get('/customers', hasPermission('customers:read'), catchAsync(adminController.listCustomers));
router.get('/customers/:id', hasPermission('customers:read'), catchAsync(adminController.getCustomer));
router.patch('/customers/:id/block', hasPermission('customers:manage'), catchAsync(adminController.blockCustomer));
router.patch('/customers/:id/unblock', hasPermission('customers:manage'), catchAsync(adminController.unblockCustomer));

// Order management
router.get('/orders', hasPermission('orders:read'), catchAsync(adminController.listOrders));
router.get('/orders/:id', hasPermission('orders:read'), catchAsync(adminController.getOrder));
router.patch('/orders/:id/status', hasPermission('orders:update'), catchAsync(adminController.updateOrderStatus));
// Full edit endpoint — items / address / contact / shipping fee. Same
// permission as status updates so we don't add a new flag to the staff
// permissions UI for what is effectively the same kind of mutation.
router.patch('/orders/:id', hasPermission('orders:update'), catchAsync(adminController.editOrder));

export default router;
