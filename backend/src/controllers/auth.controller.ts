import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import User from '../models/User.model';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../middleware/error.middleware';
import { sendEmail, emailTemplates } from '../utils/email';
import { AuthRequest } from '../types';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, role, referralCode } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return next(new AppError('Email already in use.', 409));

    // Resolve referrer (if a valid code was provided)
    let referredBy: string | undefined;
    if (referralCode && typeof referralCode === 'string') {
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() }).select('_id');
      if (referrer) referredBy = referrer.id;
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      name,
      email,
      password,
      role: role === 'client' ? 'client' : 'student',
      emailVerificationToken: verificationToken,
      ...(referredBy ? { referredBy } : {}),
    });

    // Send verification email (non-blocking — don't fail registration if email fails)
    const { subject, html } = emailTemplates.verifyEmail(name, verificationToken, CLIENT_URL);
    sendEmail({ to: email, subject, html }).catch(err =>
      console.error('Failed to send verification email:', err)
    );

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id, role: user.role });

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user.id, name: user.name, email: user.email, role: user.role,
          isEmailVerified: user.isEmailVerified,
          points: user.points, referralCode: user.referralCode,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.query as { token: string };
    if (!token) return next(new AppError('Verification token is required.', 400));

    const user = await User.findOne({ emailVerificationToken: token }).select('+emailVerificationToken');
    if (!user) return next(new AppError('Invalid or expired verification token.', 400));

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({ status: 'success', message: 'Email verified successfully.' });
  } catch (err) {
    next(err);
  }
};

export const resendVerification = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId).select('+emailVerificationToken');
    if (!user) return next(new AppError('User not found.', 404));
    if (user.isEmailVerified) {
      res.json({ status: 'success', message: 'Email is already verified.' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = token;
    await user.save({ validateBeforeSave: false });

    const { subject, html } = emailTemplates.verifyEmail(user.name, token, CLIENT_URL);
    await sendEmail({ to: user.email, subject, html });

    res.json({ status: 'success', message: 'Verification email sent.' });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password.', 401));
    }

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id, role: user.role });

    res.json({
      status: 'success',
      data: {
        user: {
          id: user.id, name: user.name, email: user.email, role: user.role,
          isEmailVerified: user.isEmailVerified,
          points: user.points, referralCode: user.referralCode,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return next(new AppError('Refresh token required.', 400));

    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.userId);
    if (!user) return next(new AppError('User not found.', 404));

    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    res.json({ status: 'success', data: { accessToken } });
  } catch {
    next(new AppError('Invalid or expired refresh token.', 401));
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) return next(new AppError('User not found.', 404));

    res.json({
      status: 'success',
      data: {
        user: {
          id: user.id, name: user.name, email: user.email, role: user.role,
          avatar: user.avatar, bio: user.bio, isEmailVerified: user.isEmailVerified,
          points: user.points, referralCode: user.referralCode,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      res.json({ status: 'success', message: 'If that email exists, a reset link has been sent.' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const { subject, html } = emailTemplates.passwordReset(user.name, resetToken, CLIENT_URL);
    await sendEmail({ to: user.email, subject, html });

    res.json({ status: 'success', message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) return next(new AppError('Invalid or expired reset token.', 400));

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ status: 'success', message: 'Password reset successful. Please log in.' });
  } catch (err) {
    next(err);
  }
};
