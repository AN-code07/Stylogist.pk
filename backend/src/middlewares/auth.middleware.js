import jwt from "jsonwebtoken";
import { User } from "../modules/users/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import env from "../config/env.js";
import { catchAsync } from "../utils/catchAsync.js";

// 🔐 Authenticate User (Cookie Based)
export const authMiddleware = catchAsync(async (req, res, next) => {
  let token;

  // 1️⃣ Get token from HTTP-only cookie
  if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new ApiError(401, "You are not logged in! Please log in to access this route.")
    );
  }

  // 2️⃣ Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    return next(new ApiError(401, "Invalid or expired token."));
  }

  // 3️⃣ Check if user still exists
  const currentUser = await User.findById(decoded.id).select(
    "_id role passwordChangedAt isBlocked"
  );

  if (!currentUser) {
    return next(
      new ApiError(401, "The user belonging to this token no longer exists.")
    );
  }

  // Revoke live sessions for blocked users.
  if (currentUser.isBlocked) {
    return next(new ApiError(403, "Your account has been suspended."));
  }

  // 4️⃣ Optional: Check if password changed after token issued
  if (
    currentUser.passwordChangedAt &&
    decoded.iat < currentUser.passwordChangedAt.getTime() / 1000
  ) {
    return next(
      new ApiError(401, "Password recently changed. Please log in again.")
    );
  }

  // 5️⃣ Attach full user (minimal data)
  req.user = {
    id: currentUser._id,
    role: currentUser.role,
  };

  next();
});