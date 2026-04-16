import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { catchAsync } from '../../utils/catchAsync.js';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

// Make sure to export these new schemas from your auth.validation.js file!
import {
    registerSchema,
    loginSchema,
    verifyOtpSchema,
    requestOtpSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
} from './auth.validation.js';

const router = Router();

// ========================
// SECURITY: Rate Limiters
// ========================
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 10, // Limit each IP to 10 password reset requests per hour
    message: { status: 'fail', message: 'Too many password reset attempts. Try again in an hour.' }
});

const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 OTP generation requests per 15 minutes
    message: { status: 'fail', message: 'Too many OTP requests. Please wait 15 minutes to prevent spam.' }
});

// ========================
// ROUTES: Route composition -> Intercept -> Validate -> Execute
// ========================

// 1. Account Creation & Verification Pipeline
router.post('/register', otpLimiter, validate(registerSchema), catchAsync(authController.register));
router.post('/verify-otp', validate(verifyOtpSchema), catchAsync(authController.verifyOTP));
router.post('/request-otp', otpLimiter, validate(requestOtpSchema), catchAsync(authController.requestOTP));

// 2. Session Management
router.post('/login', validate(loginSchema), catchAsync(authController.login));
router.post('/logout', authMiddleware, catchAsync(authController.logout));

// 3. Password Recovery Pipeline (OTP Based)
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), catchAsync(authController.forgotPassword));

// SENIOR NOTE: Removed '/:token' from the URL. The 6-digit OTP is now passed securely in req.body.otp
router.post('/reset-password', authMiddleware, validate(resetPasswordSchema), catchAsync(authController.resetPassword));

// Change password while logged in (requires current password).
router.post('/change-password', authMiddleware, validate(changePasswordSchema), catchAsync(authController.changePassword));

export default router;