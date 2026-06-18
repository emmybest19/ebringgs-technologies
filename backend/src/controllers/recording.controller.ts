import { Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../types';
import { AppError } from '../middleware/error.middleware';
import Recording from '../models/Recording.model';
import { sendPushToRole } from '../utils/pushNotification';

/**
 * POST /api/recordings — teacher / admin upload a class recording.
 * Multipart body: `recording` (file), `title`, optional description / roomId
 * / planId / durationSec / visibleToStudents.
 */
export const createRecording = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) return next(new AppError('No recording file uploaded.', 400));

    const { title, description, roomId, planId, durationSec, visibleToStudents } = req.body || {};
    if (!title || typeof title !== 'string' || !title.trim()) {
      // Tidy up the orphaned file so disk doesn't bloat on bad requests.
      fs.unlink(req.file.path, () => {});
      return next(new AppError('A title is required for the recording.', 400));
    }

    const recording = await Recording.create({
      uploader: req.user!.userId,
      title: title.trim(),
      description: typeof description === 'string' ? description.trim() || undefined : undefined,
      url: `/uploads/recordings/${req.file.filename}`,
      filename: req.file.filename,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      durationSec: durationSec !== undefined ? Math.max(0, Number(durationSec)) || undefined : undefined,
      roomId: typeof roomId === 'string' ? roomId.trim() || undefined : undefined,
      planId: typeof planId === 'string' ? planId.trim() || undefined : undefined,
      visibleToStudents: visibleToStudents === 'false' ? false : true,
    });

    if (recording.visibleToStudents) {
      sendPushToRole('student', {
        title: 'New recording available',
        body: recording.title,
        url: '/dashboard/recordings',
        tag: 'recording-new',
      }).catch(() => {});
    }

    res.status(201).json({ status: 'success', data: { recording } });
  } catch (err) { next(err); }
};

/**
 * GET /api/recordings — admin sees all, teacher sees own. Most recent first.
 */
export const listRecordings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.user!.role === 'teacher') filter.uploader = req.user!.userId;

    const recordings = await Recording.find(filter)
      .populate('uploader', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ status: 'success', data: { recordings } });
  } catch (err) { next(err); }
};

/**
 * GET /api/recordings/my — student-facing list: every recording flagged as
 * `visibleToStudents`. v1 has no per-cohort filtering — admin/teacher control
 * visibility via the visibleToStudents flag.
 */
export const listMyRecordings = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const recordings = await Recording.find({ visibleToStudents: true })
      .populate('uploader', 'name')
      .sort({ createdAt: -1 });

    res.json({ status: 'success', data: { recordings } });
  } catch (err) { next(err); }
};

/**
 * DELETE /api/recordings/:id — teacher can delete their own, admin can delete
 * any. Removes the file from disk too so /uploads doesn't accumulate dead
 * blobs.
 */
export const deleteRecording = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const recording = await Recording.findById(req.params.id);
    if (!recording) return next(new AppError('Recording not found.', 404));

    const isOwner = recording.uploader.toString() === req.user!.userId;
    const isAdmin = req.user!.role === 'admin';
    if (!isOwner && !isAdmin) return next(new AppError('You can only delete your own recordings.', 403));

    // Best-effort file removal — don't fail the delete if the file is already gone.
    const fullPath = path.join(process.cwd(), 'uploads', 'recordings', recording.filename);
    fs.unlink(fullPath, () => { /* ignore */ });

    await recording.deleteOne();
    res.json({ status: 'success', message: 'Recording deleted.' });
  } catch (err) { next(err); }
};
