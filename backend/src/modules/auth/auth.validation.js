import { z } from 'zod';

const emailField = z
  .string({ required_error: 'Email is required' })
  .email('Invalid email format')
  .trim()
  .toLowerCase();

const strongPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').trim(),
    email: emailField,
    phone: z.string().regex(/^(\+92|03)\d{9}$/, 'Invalid phone number format').trim(),
    password: strongPassword,
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: emailField,
    otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  }),
});

export const requestOtpSchema = z.object({
  body: z.object({
    email: emailField,
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailField,
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    password: strongPassword,
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: strongPassword,
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: emailField,
    password: z.string().min(1, 'Password is required'),
  }),
});
