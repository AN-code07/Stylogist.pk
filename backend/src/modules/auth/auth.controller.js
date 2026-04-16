import { User } from '../users/user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { sendEmail } from '../../utils/email.js';
import { createSendToken } from './auth.service.js';
import env from '../../config/env.js';
import crypto from 'node:crypto';

const generateNumericOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const register = async (req, res, next) => {
  const { name, email, phone, password } = req.validated.body;

  const existingUser = await User.findOne({ $or: [{ email }, { phone }] });

  if (existingUser) {
    if (!existingUser.isVerified) {
      return next(new ApiError(403, 'Account exists but is unverified. Please request a new OTP.'));
    }
    return next(new ApiError(409, 'Email or phone number is already in use.'));
  }

  const otp = generateNumericOTP();

  const newUser = await User.create({
    name,
    email,
    phone,
    password,
    isVerified: false,
    otp: crypto.createHash('sha256').update(otp).digest('hex'),
    otpExpires: Date.now() + 10 * 60 * 1000,
  });

  // 3. Send Email
  try {
    await sendEmail({
      email: newUser.email,
      subject: "Stylogist - Your Verification Code",
      message: `
  <div style="background:#f9fafb;padding:15px;font-family:Arial,Helvetica,sans-serif">

  <div style="max-width:420px;margin:auto;background:#fff;border-radius:14px;border:1px solid #eee;overflow:hidden">

    <div style="height:4px;background:linear-gradient(to right,#007074,#2dd4bf,#007074)"></div>

    <div style="padding:18px">

      <div style="text-align:center;margin-bottom:16px">
        <div style="display:inline-block;width:34px;height:34px;background:#222;border-radius:8px;line-height:34px">
          <span style="color:#fff;font-size:16px;font-weight:900;font-style:italic">S</span>
        </div>

        <p style="font-size:10px;font-weight:700;letter-spacing:3px;color:#999;margin-top:6px">
          STYLOGIST
        </p>
      </div>

      <div style="text-align:center">

        <h2 style="font-size:18px;font-weight:800;color:#222;margin-bottom:6px">
          Verify Your Identity
        </h2>

        <p style="color:#666;font-size:12px;line-height:1.4;margin-bottom:16px">
          Hello <b>${newUser.name}</b>, use this code to verify your account.
        </p>

        <div style="background:#f3f4f6;border-radius:10px;padding:14px;margin-bottom:14px;border:1px dashed #007074">
          <span style="font-size:28px;font-weight:900;letter-spacing:6px;color:#007074;font-family:monospace">
            ${otp}
          </span>
        </div>

        <p style="color:#999;font-size:10px;margin-bottom:18px">
          Expires in 10 minutes
        </p>

      </div>

      <div style="border-top:1px solid #eee;padding-top:12px">

        <p style="color:#222;font-size:12px;font-weight:700;margin-bottom:3px">
          Security Notice
        </p>

        <p style="color:#999;font-size:11px;line-height:1.4">
          If you didn't request this code, please ignore this email.
        </p>

      </div>

    </div>

    <div style="background:#222;padding:12px;text-align:center">

      <p style="color:#fff;font-size:9px;font-weight:700;letter-spacing:1px;margin-bottom:4px">
        Stylogist
      </p>

      <p style="color:#777;font-size:9px">
        Bahawalpur • Pakistan
      </p>

    </div>

  </div>

</div>
  `,
    });

    // Do NOT issue a JWT here — user is not yet verified. They must go through /verify-otp first.
    res.status(201).json({
      status: 'success',
      message: 'Account created. Please check your email for the OTP.',
      data: { email: newUser.email },
    });
  } catch (error) {
    console.error('[register] sendEmail failed:', error);
    await User.findByIdAndDelete(newUser._id);
    return next(new ApiError(500, 'Error sending verification email. Please try again.'));
  }
};

// src/controllers/auth.controller.js

export const forgotPassword = async (req, res, next) => {
  const { email } = req.validated.body;
  const user = await User.findOne({ email });

  if (!user) {
    return next(new ApiError(404, 'There is no user with that email address.'));
  }

  // 2. Generate 6-Digit Code
  const otp = generateNumericOTP();

  // 3. Hash the OTP and save it to the database using the unified OTP fields
  user.otp = crypto.createHash('sha256').update(otp).digest('hex');
  user.otpExpires = Date.now() + 10 * 60 * 1000; // Valid for 10 minutes

  // Skip Zod/Mongoose strict validation for this quick save
  await user.save({ validateBeforeSave: false });

  // 4. Send the Stylogist Branded Email
  try {
    await sendEmail({
      email: user.email,
      subject: "Stylogist - Your Verification Code",
      message: `
  <div style="background:#f9fafb;padding:15px;font-family:Arial,Helvetica,sans-serif">

  <div style="max-width:420px;margin:auto;background:#fff;border-radius:14px;border:1px solid #eee;overflow:hidden">

    <div style="height:4px;background:linear-gradient(to right,#007074,#2dd4bf,#007074)"></div>

    <div style="padding:18px">

      <div style="text-align:center;margin-bottom:16px">
        <div style="display:inline-block;width:34px;height:34px;background:#222;border-radius:8px;line-height:34px">
          <span style="color:#fff;font-size:16px;font-weight:900;font-style:italic">S</span>
        </div>

        <p style="font-size:10px;font-weight:700;letter-spacing:3px;color:#999;margin-top:6px">
          STYLOGIST
        </p>
      </div>

      <div style="text-align:center">

        <h2 style="font-size:18px;font-weight:800;color:#222;margin-bottom:6px">
          Verify Your Identity
        </h2>

        <p style="color:#666;font-size:12px;line-height:1.4;margin-bottom:16px">
          Hello <b>${user.name}</b>, use this code to verify your account.
        </p>

        <div style="background:#f3f4f6;border-radius:10px;padding:14px;margin-bottom:14px;border:1px dashed #007074">
          <span style="font-size:28px;font-weight:900;letter-spacing:6px;color:#007074;font-family:monospace">
            ${otp}
          </span>
        </div>

        <p style="color:#999;font-size:10px;margin-bottom:18px">
          Expires in 10 minutes
        </p>

      </div>

      <div style="border-top:1px solid #eee;padding-top:12px">

        <p style="color:#222;font-size:12px;font-weight:700;margin-bottom:3px">
          Security Notice
        </p>

        <p style="color:#999;font-size:11px;line-height:1.4">
          If you didn't request this code, please ignore this email.
        </p>

      </div>

    </div>

    <div style="background:#222;padding:12px;text-align:center">

      <p style="color:#fff;font-size:9px;font-weight:700;letter-spacing:1px;margin-bottom:4px">
        Stylogist
      </p>

      <p style="color:#777;font-size:9px">
        Bahawalpur • Pakistan
      </p>

    </div>

  </div>

</div>
  `,
    });

    res.status(200).json({
      status: 'success',
      message: 'OTP sent to email!'
    });

  } catch (err) {
    // If email fails, we MUST wipe the token from the DB to prevent dangling access
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ApiError(500, 'There was an error sending the email. Try again later!'));
  }
};

// export const resetPassword = async (req, res, next) => {
//   // 1. Get user based on the token (we must hash the incoming token to match the DB)
//   const hashedToken = crypto
//     .createHash('sha256')
//     .update(req.params.token)
//     .digest('hex');

//   // Find user where token matches AND expiration is strictly in the future
//   const user = await User.findOne({
//     passwordResetToken: hashedToken,
//     passwordResetExpires: { $gt: Date.now() },
//   });

//   // 2. If token has not expired, and there is a user, set the new password
//   if (!user) {
//     return next(new ApiError(400, 'Token is invalid or has expired'));
//   }

//   user.password = req.body.password;

//   // Force invalidation of the token immediately
//   user.passwordResetToken = undefined;
//   user.passwordResetExpires = undefined;

//   await user.save(); // This triggers our pre('save') Bcrypt hook perfectly

//   // 3. Log the user in automatically, send JWT
//   createSendToken(user, 200, res);
// };

export const login = async (req, res, next) => {
  const { email, password } = req.validated.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new ApiError(401, 'Incorrect email or password'));
  }

  const isCorrect = await user.correctPassword(password, user.password);
  if (!isCorrect) {
    return next(new ApiError(401, 'Incorrect email or password'));
  }

  // Block unverified accounts from logging in — they must go through OTP verification first.
  if (!user.isVerified) {
    return next(
      new ApiError(403, 'Please verify your email before logging in. A new OTP can be requested from the verification page.')
    );
  }

  // Blocked by an admin — refuse session.
  if (user.isBlocked) {
    return next(new ApiError(403, 'Your account has been suspended. Please contact support.'));
  }

  user.password = undefined;
  createSendToken(user, 200, res);
};



// ========================
// 1. VERIFY OTP (Now sets httpOnly Cookie)
// ========================
export const verifyOTP = async (req, res, next) => {
  const { email, otp } = req.validated.body;

  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

  const user = await User.findOne({
    email,
    otp: hashedOtp,
    otpExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ApiError(400, 'Invalid or expired OTP.'));
  }

  // Verification Logic
  user.isVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;

  await user.save({ validateBeforeSave: false });

  // SENIOR MOVE: Automatically log them in after verification
  createSendToken(user, 200, res);
};

// ========================
// 2. REQUEST OTP (Resend)
// ========================
export const requestOTP = async (req, res, next) => {
  const { email } = req.validated.body;

  const user = await User.findOne({ email });
  if (!user) {
    return next(new ApiError(404, 'No user found with this email.'));
  }

  if (user.isVerified) {
    return next(new ApiError(400, 'Account is already verified. Please login.'));
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = crypto.createHash('sha256').update(otp).digest('hex');
  user.otpExpires = Date.now() + 10 * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  try {
   await sendEmail({
      email: user.email,
      subject: "Stylogist - Your Verification Code",
      message: `
  <div style="background:#f9fafb;padding:15px;font-family:Arial,Helvetica,sans-serif">

  <div style="max-width:420px;margin:auto;background:#fff;border-radius:14px;border:1px solid #eee;overflow:hidden">

    <div style="height:4px;background:linear-gradient(to right,#007074,#2dd4bf,#007074)"></div>

    <div style="padding:18px">

      <div style="text-align:center;margin-bottom:16px">
        <div style="display:inline-block;width:34px;height:34px;background:#222;border-radius:8px;line-height:34px">
          <span style="color:#fff;font-size:16px;font-weight:900;font-style:italic">S</span>
        </div>

        <p style="font-size:10px;font-weight:700;letter-spacing:3px;color:#999;margin-top:6px">
          STYLOGIST
        </p>
      </div>

      <div style="text-align:center">

        <h2 style="font-size:18px;font-weight:800;color:#222;margin-bottom:6px">
          Verify Your Identity
        </h2>

        <p style="color:#666;font-size:12px;line-height:1.4;margin-bottom:16px">
          Hello <b>${user.name}</b>, use this code to verify your account.
        </p>

        <div style="background:#f3f4f6;border-radius:10px;padding:14px;margin-bottom:14px;border:1px dashed #007074">
          <span style="font-size:28px;font-weight:900;letter-spacing:6px;color:#007074;font-family:monospace">
            ${otp}
          </span>
        </div>

        <p style="color:#999;font-size:10px;margin-bottom:18px">
          Expires in 10 minutes
        </p>

      </div>

      <div style="border-top:1px solid #eee;padding-top:12px">

        <p style="color:#222;font-size:12px;font-weight:700;margin-bottom:3px">
          Security Notice
        </p>

        <p style="color:#999;font-size:11px;line-height:1.4">
          If you didn't request this code, please ignore this email.
        </p>

      </div>

    </div>

    <div style="background:#222;padding:12px;text-align:center">

      <p style="color:#fff;font-size:9px;font-weight:700;letter-spacing:1px;margin-bottom:4px">
        Stylogist
      </p>

      <p style="color:#777;font-size:9px">
        Bahawalpur • Pakistan
      </p>

    </div>

  </div>

</div>
  `,
    });

    // Note: No cookie is sent here, as they aren't verified yet
    res.status(200).json({
      status: 'success',
      message: 'A new OTP has been sent to your email.'
    });
  } catch (err) {
    return next(new ApiError(500, 'Error sending email. Please try again.'));
  }
};

// ========================
// 3. RESET PASSWORD (Now sets httpOnly Cookie)
// ========================
// src/controllers/auth.controller.js

export const resetPassword = async (req, res, next) => {
  // 1. User is already authenticated by authMiddleware! 
  // We can safely grab the ID from req.user
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ApiError(404, 'The user belonging to this session no longer exists.'));
  }

  // 2. Grab the new password from the validated body
  const { password } = req.validated.body;

  // 3. Update the password
  user.password = password;

  // Clean up any lingering database fields just to be pristine
  user.otp = undefined;
  user.otpExpires = undefined;

  // 🚨 Note: Ensure your user.model.js pre('save') hook sets `this.passwordChangedAt = Date.now() - 1000;`
  // so that your authMiddleware's password change detection works correctly!
  await user.save();

  // 4. Re-issue a fresh cookie with the newly updated user state
  createSendToken(user, 200, res);
};

// ========================
// CHANGE PASSWORD (authenticated)
// ========================
export const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.validated.body;

  // Pull user with password since it is select:false by default.
  const user = await User.findById(req.user.id).select('+password');
  if (!user) return next(new ApiError(404, 'User not found'));

  const ok = await user.correctPassword(currentPassword, user.password);
  if (!ok) return next(new ApiError(401, 'Current password is incorrect'));

  if (currentPassword === newPassword) {
    return next(new ApiError(400, 'New password must be different from the current one'));
  }

  user.password = newPassword;
  await user.save();

  // Re-issue the cookie so the live session stays valid with the new password.
  createSendToken(user, 200, res);
};

// ========================
// LOGOUT
// ========================
export const logout = (req, res) => {
  // 1. Overwrite JWT cookie (if using cookie) or instruct client to remove token
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10),
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    // THIS MUST MATCH HOW YOU CREATED IT
    sameSite: env.nodeEnv === 'production' ? 'none' : 'lax'
  });

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
};