import { User } from './user.model.js';
import { ApiError } from '../../utils/ApiError.js';

// GET /api/users/me
export const getProfile = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) return next(new ApiError(404, 'User not found'));
  res.status(200).json({ status: 'success', data: { user } });
};

// PATCH /api/users/me
export const updateProfile = async (req, res, next) => {
  const updates = req.validated.body;

  const user = await User.findById(req.user.id);
  if (!user) return next(new ApiError(404, 'User not found'));

  // Guard against a privilege-escalation path: admins elevate via /admin/create-admin,
  // never via a regular profile update.
  delete updates.role;
  delete updates.isBlocked;
  delete updates.password;

  Object.assign(user, updates);
  await user.save();

  res.status(200).json({ status: 'success', message: 'Profile updated', data: { user } });
};
