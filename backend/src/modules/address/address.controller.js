import { Address } from './address.model.js';
import { ApiError } from '../../utils/ApiError.js';

// GET /api/addresses
export const getAddresses = async (req, res) => {
  const addresses = await Address.find({ userId: req.user.id }).sort({ isDefault: -1, createdAt: -1 });
  res.status(200).json({ status: 'success', data: { addresses } });
};

// POST /api/addresses
export const addAddress = async (req, res) => {
  const body = req.validated.body;
  if (body.isDefault) {
    await Address.updateMany({ userId: req.user.id }, { isDefault: false });
  }

  const address = await Address.create({ ...body, userId: req.user.id });
  res.status(201).json({ status: 'success', message: 'Address added', data: { address } });
};

// PATCH /api/addresses/:id
export const updateAddress = async (req, res, next) => {
  const { id } = req.validated.params;
  const updates = req.validated.body;

  const address = await Address.findOne({ _id: id, userId: req.user.id });
  if (!address) return next(new ApiError(404, 'Address not found'));

  if (updates.isDefault) {
    await Address.updateMany({ userId: req.user.id }, { isDefault: false });
  }

  Object.assign(address, updates);
  await address.save();

  res.status(200).json({ status: 'success', message: 'Address updated', data: { address } });
};

// DELETE /api/addresses/:id
export const deleteAddress = async (req, res, next) => {
  const { id } = req.validated.params;
  const address = await Address.findOneAndDelete({ _id: id, userId: req.user.id });
  if (!address) return next(new ApiError(404, 'Address not found'));

  res.status(200).json({ status: 'success', message: 'Address deleted' });
};
