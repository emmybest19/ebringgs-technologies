import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  role: z.enum(['student', 'client']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const oauthGoogleSchema = z.object({
  idToken: z.string().min(10, 'Google ID token is required'),
  // role is optional — passed only during signup intent; on returning user it's ignored
  role: z.enum(['student', 'client']).optional(),
  referralCode: z.string().optional(),
});

export const oauthAppleSchema = z.object({
  idToken: z.string().min(10, 'Apple ID token is required'),
  // Apple only returns user.name on the FIRST sign-in; the frontend forwards
  // whatever it got so we can populate the account.
  name: z.string().max(120).optional(),
  role: z.enum(['student', 'client']).optional(),
  referralCode: z.string().optional(),
});
