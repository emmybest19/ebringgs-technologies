import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import Assignment from '../models/Assignment.model';
import { AppError } from '../middleware/error.middleware';
import { sendPushToUser, sendPushToRole } from '../utils/pushNotification';
import { awardPoints } from '../services/points.service';

export const submitAssignment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, courseId } = req.body;
    if (!title || !courseId) {
      return next(new AppError('Title and program are required.', 400));
    }
    const assignment = await Assignment.create({
      student: req.user!.userId,
      program: courseId,
      title,
      description: description || '',
      fileUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      fileName: req.file?.originalname,
    });

    // Award points for submitting (idempotent on assignment id)
    awardPoints({
      userId: req.user!.userId,
      reason: 'assignment_submitted',
      referenceId: assignment.id,
    }).catch((err) => console.error('[points] award failed:', err));

    // Notify admins about new assignment submission
    sendPushToRole('admin', {
      title: 'New Assignment Submitted',
      body: `A student submitted "${title}".`,
      url: '/admin/assignments',
      tag: 'assignment-new',
    }).catch(() => {});

    res.status(201).json({ status: 'success', data: { assignment } });
  } catch (err) { next(err); }
};

export const getMyAssignments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const assignments = await Assignment.find({ student: req.user!.userId })
      .sort({ submittedAt: -1 });
    res.json({ status: 'success', data: { assignments } });
  } catch (err) { next(err); }
};

export const getAllAssignments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query as Record<string, string>;
    const query: Record<string, unknown> = {};
    if (status) query.status = status;

    const assignments = await Assignment.find(query)
      .populate('student', 'name email')
      .populate('reviewedBy', 'name')
      .sort({ submittedAt: -1 });

    res.json({ status: 'success', data: { assignments } });
  } catch (err) { next(err); }
};

export const reviewAssignment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { feedback, grade } = req.body;
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      { feedback, grade, status: 'reviewed', reviewedBy: req.user!.userId, reviewedAt: new Date() },
      { new: true },
    );
    if (!assignment) return next(new AppError('Assignment not found.', 404));

    // Award points for passing (only if a grade was given that isn't a fail)
    const passed = !!grade && !/^f$/i.test(String(grade).trim());
    if (passed) {
      awardPoints({
        userId: assignment.student.toString(),
        reason: 'assignment_passed',
        referenceId: assignment.id,
      }).catch((err) => console.error('[points] award failed:', err));
    }

    // Notify the student that their assignment was reviewed
    sendPushToUser(assignment.student.toString(), {
      title: 'Assignment Reviewed',
      body: `Your assignment "${assignment.title}" has been graded${grade ? `: ${grade}` : ''}.`,
      url: '/dashboard',
      tag: 'assignment-reviewed',
    }).catch(() => {});

    res.json({ status: 'success', data: { assignment } });
  } catch (err) { next(err); }
};
