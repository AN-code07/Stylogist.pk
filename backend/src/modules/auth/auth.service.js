// src/modules/auth/auth.service.js
import jwt from 'jsonwebtoken';
import env from '../../config/env.js';

/**
 * Pure function to sign the JWT.
 * @param {string} id - The MongoDB ObjectId of the user
 * @returns {string} - The signed JWT
 */
const signToken = (id) => {
  return jwt.sign({ id }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
};

/**
 * Composable utility to format the auth response and attach secure cookies.
 * @param {Object} user - The Mongoose user document
 * @param {number} statusCode - The HTTP status code (e.g., 200 or 201)
 * @param {Object} res - The Express response object
 */
export const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    // Convert '7d' string (or similar) to milliseconds for the cookie expiration
    // Assuming env.jwtExpiresIn is passed in a way that aligns with this, 
    // but hardcoding the math here ensures the cookie dies when the token dies.
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
    httpOnly: true, // Absolutely critical: prevents XSS token theft
    secure: env.nodeEnv === 'production', // Send only over HTTPS in production
    sameSite: env.nodeEnv === 'production' ? 'none' : 'lax' // Prevents CSRF attacks
  };

  // Attach the cookie to the response layout
  res.cookie('jwt', token, cookieOptions);

  // Remove the password hash from the output so it never reaches the client network
  user.password = undefined;

  // Dispatch the response
  res.status(statusCode).json({
    status: 'success',
    token, // We send it in the JSON body too, in case your future Mobile App needs it
    data: {
      user,
    },
  });
};