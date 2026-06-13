import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import LiveSession from '../models/LiveSession.model';
import { AppError } from '../middleware/error.middleware';
import { sendPushToRole } from '../utils/pushNotification';

/**
 * GET /api/live-sessions
 * List all sessions. Supports ?upcoming=true to filter future sessions only.
 */
export const listSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { upcoming } = req.query as Record<string, string>;
    const query: Record<string, unknown> = {};
    if (upcoming === 'true') {
      query.status = { $in: ['upcoming', 'live'] };
    }

    const sessions = await LiveSession.find(query).sort({ scheduledAt: 1 });
    res.json({ status: 'success', data: sessions });
  } catch (err) { next(err); }
};

/**
 * GET /api/live-sessions/:id
 */
export const getSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await LiveSession.findById(req.params.id);
    if (!session) return next(new AppError('Live session not found.', 404));
    res.json({ status: 'success', data: session });
  } catch (err) { next(err); }
};

/**
 * POST /api/live-sessions  (admin)
 */
export const createSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, courseTitle, instructor, scheduledAt, durationMinutes, meetingUrl, roomId } = req.body;
    if (!title || !scheduledAt || !roomId) {
      return next(new AppError('title, scheduledAt and roomId are required.', 400));
    }

    const session = await LiveSession.create({
      title,
      courseTitle: courseTitle || '',
      instructor: instructor || '',
      scheduledAt,
      durationMinutes: durationMinutes || 60,
      meetingUrl: meetingUrl || '',
      roomId,
      status: new Date(scheduledAt) > new Date() ? 'upcoming' : 'ended',
    });

    // Notify all students about the new live session
    sendPushToRole('student', {
      title: 'New Live Session Scheduled',
      body: `"${title}" — ${new Date(scheduledAt).toLocaleDateString()}`,
      url: `/classroom/${roomId}`,
      tag: 'live-session-new',
    }).catch(() => {});

    res.status(201).json({ status: 'success', data: session });
  } catch (err) { next(err); }
};

/**
 * PATCH /api/live-sessions/:id  (admin)
 */
export const updateSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const allowed = [
      'title', 'courseTitle', 'instructor', 'scheduledAt',
      'durationMinutes', 'meetingUrl', 'roomId', 'status',
    ];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const session = await LiveSession.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!session) return next(new AppError('Live session not found.', 404));
    res.json({ status: 'success', data: session });
  } catch (err) { next(err); }
};

/**
 * DELETE /api/live-sessions/:id  (admin)
 */
export const deleteSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await LiveSession.findByIdAndDelete(req.params.id);
    if (!session) return next(new AppError('Live session not found.', 404));
    res.json({ status: 'success', message: 'Session deleted.' });
  } catch (err) { next(err); }
};
