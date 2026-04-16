import { Router } from 'express';
import * as addressController from './address.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createAddressSchema,
  updateAddressSchema,
  addressIdParamSchema,
} from './address.validation.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();
router.use(authMiddleware);

router.get('/', catchAsync(addressController.getAddresses));
router.post('/', validate(createAddressSchema), catchAsync(addressController.addAddress));
router.patch('/:id', validate(updateAddressSchema), catchAsync(addressController.updateAddress));
router.delete('/:id', validate(addressIdParamSchema), catchAsync(addressController.deleteAddress));

export default router;
