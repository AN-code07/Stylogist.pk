import jwt from "jsonwebtoken";
import { User } from "../modules/users/user.model.js";
import env from "../config/env.js";
import { catchAsync } from "../utils/catchAsync.js";

// Identical contract to authMiddleware, but treats the absence of a valid
// token as "anonymous user" instead of an error. Used by endpoints that
// work for both signed-in customers and guests (e.g. /orders for guest
// checkout): `req.user` is set when authenticated, undefined otherwise.
export const optionalAuthMiddleware = catchAsync(async (req, _res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  }
  if (!token && req.cookies?.jwt) token = req.cookies.jwt;
  if (!token || token === "loggedout") return next();

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch {
    return next();
  }

  const currentUser = await User.findById(decoded.id).select("_id role passwordChangedAt isBlocked");
  if (!currentUser || currentUser.isBlocked) return next();

  if (
    currentUser.passwordChangedAt &&
    decoded.iat < currentUser.passwordChangedAt.getTime() / 1000
  ) {
    return next();
  }

  req.user = { id: currentUser._id, role: currentUser.role };
  next();
});
