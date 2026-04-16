// src/modules/auth/auth.service.js
import jwt from 'jsonwebtoken';
import env from '../../config/env.js';

const signToken = (id) => {
  return jwt.sign({ id }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
};

export const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const isProd = env.nodeEnv === 'production';

  // In production we need `secure + sameSite=none` for cross-site cookies (e.g. Vercel -> Render).
  // In development (http://localhost) browsers silently drop `secure` cookies, which is why
  // login "works" but the cookie never lands. Fall back to `lax` so dev just works.
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  };

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
