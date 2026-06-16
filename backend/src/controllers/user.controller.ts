import { Response, NextFunction, Request } from 'express';
import { AuthRequest } from '../types';
import User from '../models/User.model';
import { AppError } from '../middleware/error.middleware';

export const getAllUsers = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await User.find().select('-password');
    res.json({ status: 'success', data: { users } });
  } catch (err) { next(err); }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, bio, avatar, phone, whatsappOptIn, title, specialties, experience, social } = req.body;
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;
    if (phone !== undefined) updates.phone = phone;
    if (whatsappOptIn !== undefined) updates.whatsappOptIn = !!whatsappOptIn;

    // Teacher-only profile fields. Silently ignored for non-teacher roles
    // (so a student can't accidentally write 'title: CEO' to their record).
    if (req.user?.role === 'teacher') {
      if (title !== undefined) updates.title = title;
      if (Array.isArray(specialties)) {
        updates.specialties = specialties.map((s) => String(s).trim()).filter(Boolean).slice(0, 12);
      }
      if (experience !== undefined) updates.experience = experience;
      if (social && typeof social === 'object') {
        updates.social = {
          linkedin: typeof social.linkedin === 'string' ? social.linkedin.trim() : undefined,
          github: typeof social.github === 'string' ? social.github.trim() : undefined,
          website: typeof social.website === 'string' ? social.website.trim() : undefined,
        };
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      updates,
      { new: true, runValidators: true },
    );
    if (!user) return next(new AppError('User not found.', 404));
    res.json({ status: 'success', data: { user } });
  } catch (err) { next(err); }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return next(new AppError('currentPassword and newPassword are required.', 400));
    }
    if (newPassword.length < 8) {
      return next(new AppError('New password must be at least 8 characters.', 400));
    }
    const user = await User.findById(req.user!.userId).select('+password');
    if (!user) return next(new AppError('User not found.', 404));

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return next(new AppError('Current password is incorrect.', 401));

    user.password = newPassword; // pre-save hook hashes it
    await user.save();
    res.json({ status: 'success', message: 'Password updated successfully.' });
  } catch (err) { next(err); }
};

export const updateUserRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true },
    );
    if (!user) return next(new AppError('User not found.', 404));
    res.json({ status: 'success', data: { user } });
  } catch (err) { next(err); }
};

/**
 * POST /api/users/teacher — admin-only.
 *
 * Lets the admin create a teacher account directly with name/email/password
 * (and optional bio + title) instead of waiting for the teacher to register
 * themselves and then flipping their role. The admin shares the credentials
 * with the teacher out-of-band; the teacher signs in at /teacher/login.
 *
 * Email is auto-verified — the admin vouches for them, no verification mail.
 */
export const createTeacher = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, title, bio } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return next(new AppError('Name is required.', 400));
    }
    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
      return next(new AppError('A valid email is required.', 400));
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return next(new AppError('Password must be at least 8 characters.', 400));
    }

    const normalisedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalisedEmail });
    if (existing) return next(new AppError('Email already in use.', 409));

    const user = await User.create({
      name: name.trim(),
      email: normalisedEmail,
      password, // pre-save hook hashes it
      role: 'teacher',
      isEmailVerified: true,        // admin-created, no need to verify
      title: typeof title === 'string' ? title.trim() || undefined : undefined,
      bio: typeof bio === 'string' ? bio.trim() || undefined : undefined,
    });

    // Strip password before returning.
    const safe = await User.findById(user.id).select('-password');
    res.status(201).json({ status: 'success', data: { user: safe } });
  } catch (err) { next(err); }
};

/* ─── Teacher / instructor directory ─────────────────────────────────── */

const TEACHER_PUBLIC_FIELDS = 'name avatar bio title specialties experience social featured createdAt';

export const listTeachers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const teachers = await User.find({ role: 'teacher' })
      .select(TEACHER_PUBLIC_FIELDS)
      .sort({ featured: -1, name: 1 });
    res.json({ status: 'success', data: { teachers } });
  } catch (err) { next(err); }
};

export const getTeacher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' })
      .select(TEACHER_PUBLIC_FIELDS);
    if (!teacher) return next(new AppError('Instructor not found.', 404));
    res.json({ status: 'success', data: { teacher } });
  } catch (err) { next(err); }
};
