import { Router } from 'express';
import * as ProductController from './product.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createProductSchema } from './product.validation.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

// All routes protected for now
router.use(authMiddleware);

router.post('/', validate(createProductSchema), catchAsync(ProductController.createProduct));
router.get('/', catchAsync(ProductController.getAllProducts));
router.get('/:slug', catchAsync(ProductController.getSingleProduct));
router.get('/filters/meta', catchAsync(ProductController.getFilterMetadata));

export default router;