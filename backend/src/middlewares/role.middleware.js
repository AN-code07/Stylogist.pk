import { ApiError } from '../utils/ApiError.js';

/**
 * Middleware to restrict route access based on user roles.
 * MUST be used AFTER authMiddleware in the route chain.
 * * @param {...string} roles - Pass the allowed roles (e.g., 'Super Admin', 'Staff')
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // 1. Safety check: Ensure authMiddleware actually set req.user
    if (!req.user) {
      return next(
        new ApiError(401, "Authentication required before checking roles.")
      );
    }

    // 2. Check if the user's role is inside the allowed roles array
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, "Access denied. You do not have permission to perform this action.")
      );
    }

    // 3. Role is valid, let them pass!
    next();
  };
};