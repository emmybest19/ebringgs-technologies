import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import User, { IUser } from '../models/User.model';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../middleware/error.middleware';
import { sendEmail, emailTemplates } from '../utils/email';
import { AuthRequest } from '../types';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ─── OAuth verifiers (lazy-init so missing env vars fail loudly at the
//     endpoint, not at module-load time) ──────────────────────────────────
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID; // Apple Service ID
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;
const appleJWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

function issueAuthResponse(user: IUser, res: Response, status = 200): void {
  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id, role: user.role });
  res.status(status).json({
    status: 'success',
    data: {
      user: {
        id: user.id, name: user.name, email: user.email, role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        points: user.points, referralCode: user.referralCode,
        authProvider: user.authProvider,
      },
      accessToken,
      refreshToken,
    },
  });
}

async function resolveReferrer(referralCode: unknown): Promise<string | undefined> {
  if (!referralCode || typeof referralCode !== 'string') return undefined;
  const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() }).select('_id');
  return referrer ? referrer.id : undefined;
}

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
          referralCreditNaira: user.referralCreditNaira,
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
          referralCreditNaira: user.referralCreditNaira,
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
          referralCreditNaira: user.referralCreditNaira,
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

// ─── OAuth: Google ────────────────────────────────────────────────────────
// The frontend calls Google Identity Services, gets back an ID token (a JWT
// signed by Google), and POSTs it here. We verify the signature + audience
// against our Google Client ID, then either link the Google account to an
// existing email-matched user, log in an existing Google user, or create a
// new one. No password is set.
export const oauthGoogle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!googleClient || !GOOGLE_CLIENT_ID) {
      return next(new AppError('Google sign-in is not configured on this server.', 503));
    }
    const { idToken, role, referralCode } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      return next(new AppError('Invalid Google token.', 401));
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase();
    const name = payload.name || email.split('@')[0];
    const avatar = payload.picture;
    const emailVerified = payload.email_verified === true;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      const referredBy = await resolveReferrer(referralCode);
      user = await User.create({
        name,
        email,
        avatar,
        role: role === 'client' ? 'client' : 'student',
        authProvider: 'google',
        googleId,
        isEmailVerified: emailVerified,
        ...(referredBy ? { referredBy } : {}),
      });
    } else if (!user.googleId) {
      // Email-matched local user → link the Google account onto it
      user.googleId = googleId;
      if (!user.avatar && avatar) user.avatar = avatar;
      if (emailVerified) user.isEmailVerified = true;
      await user.save({ validateBeforeSave: false });
    }

    issueAuthResponse(user, res);
  } catch (err) {
    if ((err as Error)?.message?.toLowerCase().includes('token')) {
      return next(new AppError('Invalid or expired Google token.', 401));
    }
    next(err);
  }
};

// ─── OAuth: Apple ─────────────────────────────────────────────────────────
// Apple's flow is similar to Google's but with two quirks:
//   1. The ID token JWT must be verified against Apple's JWKS at
//      https://appleid.apple.com/auth/keys (RS256).
//   2. Apple only returns the user's name on the FIRST sign-in, sent
//      out-of-band (not in the JWT). The frontend forwards it in the
//      request body so we can populate the new account.
export const oauthApple = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!APPLE_CLIENT_ID) {
      return next(new AppError('Apple sign-in is not configured on this server.', 503));
    }
    const { idToken, name: providedName, role, referralCode } = req.body;

    const { payload } = await jwtVerify(idToken, appleJWKS, {
      issuer: 'https://appleid.apple.com',
      audience: APPLE_CLIENT_ID,
    });

    const appleId = payload.sub as string | undefined;
    const email = (payload.email as string | undefined)?.toLowerCase();
    const emailVerified = payload.email_verified === true || payload.email_verified === 'true';

    if (!appleId || !email) {
      return next(new AppError('Apple token did not include a user identifier or email.', 401));
    }

    let user = await User.findOne({ $or: [{ appleId }, { email }] });

    if (!user) {
      const referredBy = await resolveReferrer(referralCode);
      user = await User.create({
        name: providedName || email.split('@')[0],
        email,
        role: role === 'client' ? 'client' : 'student',
        authProvider: 'apple',
        appleId,
        isEmailVerified: emailVerified,
        ...(referredBy ? { referredBy } : {}),
      });
    } else if (!user.appleId) {
      user.appleId = appleId;
      if (emailVerified) user.isEmailVerified = true;
      await user.save({ validateBeforeSave: false });
    }

    issueAuthResponse(user, res);
  } catch (err) {
    if ((err as Error)?.message?.toLowerCase().includes('jwt') ||
        (err as Error)?.message?.toLowerCase().includes('signature')) {
      return next(new AppError('Invalid or expired Apple token.', 401));
    }
    next(err);
  }
};
