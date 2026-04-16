import jwt from "jsonwebtoken";
import { User } from "../modules/users/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import env from "../config/env.js";
import { catchAsync } from "../utils/catchAsync.js";

// Wipe any stale `jwt` cookie with the SAME attributes used to set it, otherwise
// the browser treats the clear as a new/second cookie and the stale one survives.
const clearJwtCookie = (res) => {
  const isProd = env.nodeEnv === 'production';
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  });
};

// 🔐 Authenticate User — accepts Authorization: Bearer <token> OR the `jwt` cookie.
// Bearer is the primary path in production because Vercel ↔ Render is cross-site and
// modern browsers aggressively block third-party cookies.
export const authMiddleware = catchAsync(async (req, res, next) => {
  let token;

  // 1️⃣ Prefer the Authorization header (works in cross-site contexts where
  //    third-party cookies are blocked by the browser).
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  // 2️⃣ Fallback to the httpOnly cookie (same-site / dev).
  if (!token && req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  if (!token || token === 'loggedout') {
    return next(
      new ApiError(401, "You are not logged in! Please log in to access this route.")
    );
  }

  // 3️⃣ Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    clearJwtCookie(res);
    return next(new ApiError(401, "Invalid or expired token."));
  }

  // 4️⃣ Check if user still exists
  const currentUser = await User.findById(decoded.id).select(
    "_id role passwordChangedAt isBlocked"
  );

  if (!currentUser) {
    // Defensive: burn the stale cookie so the client doesn't keep looping on
    // a token that points at a user who no longer exists (common after a DB
    // reset or redeploy where the old cookie still verifies).
    clearJwtCookie(res);
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