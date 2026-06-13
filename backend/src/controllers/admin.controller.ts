import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../types';
import User from '../models/User.model';
import Blog from '../models/Blog.model';
import Transaction from '../models/Transaction.model';
import Assignment from '../models/Assignment.model';
import ServiceInquiry from '../models/ServiceInquiry.model';
import Project from '../models/Project.model';
import { AppError } from '../middleware/error.middleware';
import { sendEmail } from '../utils/email';
import { sendPushToUser } from '../utils/pushNotification';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

export const getStats = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [
      totalUsers,
      totalBlogs,
      publishedBlogs,
      revenueResult,
      pendingAssignments,
      newUsersThisMonth,
    ] = await Promise.all([
      User.countDocuments(),
      Blog.countDocuments(),
      Blog.countDocuments({ isPublished: true }),
      Transaction.aggregate([
        { $match: { status: 'succeeded' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Assignment.countDocuments({ status: 'submitted' }),
      User.countDocuments({ createdAt: { $gte: new Date(new Date().setDate(1)) } }),
    ]);

    res.json({
      status: 'success',
      data: {
        totalUsers,
        newUsersThisMonth,
        totalBlogs,
        publishedBlogs,
        revenue: revenueResult[0]?.total ?? 0,
        pendingAssignments,
      },
    });
  } catch (err) { next(err); }
};

// Unread counts shown as red badges on the admin sidebar
export const getUnreadCounts = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [newInquiries, pendingAssignments, pendingReviews] = await Promise.all([
      ServiceInquiry.countDocuments({ status: 'new' }),
      Assignment.countDocuments({ status: 'submitted' }),
      // Lazy import to avoid circular dependency at module load
      (await import('../models/Review.model')).default.countDocuments({ isApproved: false }),
    ]);
    res.json({
      status: 'success',
      data: {
        serviceRequests: newInquiries,
        assignments: pendingAssignments,
        reviews: pendingReviews,
      },
    });
  } catch (err) { next(err); }
};

export const getInquiries = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const inquiries = await ServiceInquiry.find().sort({ createdAt: -1 });
    res.json({ status: 'success', data: { inquiries } });
  } catch (err) { next(err); }
};

// Admin: convert an inquiry into a Project with a quoted price
export const convertInquiryToProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { totalCost, estimatedEndDate, notes, title } = req.body;

    if (!totalCost || isNaN(Number(totalCost)) || Number(totalCost) <= 0) {
      return next(new AppError('totalCost (in kobo) is required and must be > 0.', 400));
    }

    const inquiry = await ServiceInquiry.findById(req.params.id);
    if (!inquiry) return next(new AppError('Inquiry not found.', 404));
    if (inquiry.convertedProject) {
      return next(new AppError('This inquiry has already been converted.', 409));
    }

    // Resolve client account: use linked user, else lookup by email, else require registration
    let clientId: string | undefined = inquiry.user?.toString();
    if (!clientId) {
      const existing = await User.findOne({ email: inquiry.email.toLowerCase() }).select('_id role');
      if (!existing) {
        return next(new AppError(
          `No account exists for ${inquiry.email}. Ask the inquirer to register first as a client, then retry.`,
          400,
        ));
      }
      if (existing.role !== 'client') {
        return next(new AppError(
          `User ${inquiry.email} is registered but not as a client. Promote their role first.`,
          400,
        ));
      }
      clientId = existing._id.toString();
    }
    if (!clientId) return next(new AppError('Could not resolve client account.', 400));

    const project = await Project.create({
      client: clientId,
      serviceId: inquiry.serviceId || 'custom',
      serviceName: inquiry.serviceName || 'Custom service',
      title: title || `${inquiry.serviceName || 'Custom service'} for ${inquiry.name}`,
      description: [
        inquiry.goals && `Goals: ${inquiry.goals}`,
        inquiry.budgetRange && `Budget: ${inquiry.budgetRange}`,
        inquiry.timeline && `Timeline: ${inquiry.timeline}`,
        inquiry.message,
      ].filter(Boolean).join('\n\n'),
      status: 'pending',
      progress: 0,
      totalCost: Number(totalCost),
      estimatedEndDate: estimatedEndDate ? new Date(estimatedEndDate) : undefined,
      notes,
    });

    // Mark inquiry as converted
    inquiry.status = 'quoted';
    inquiry.convertedProject = project._id as mongoose.Types.ObjectId;
    await inquiry.save();

    // Notify the client (push + email)
    sendPushToUser(clientId, {
      title: 'New project quote ready',
      body: `Your inquiry "${inquiry.serviceName || 'project'}" has been quoted. Review and pay to start.`,
      url: `/client/projects/${project._id}`,
      tag: 'project-quoted',
    }).catch(() => {});

    sendEmail({
      to: inquiry.email,
      subject: `Your project quote is ready — ${project.title}`,
      html: quoteReadyEmailHtml(inquiry.name, project.title, Number(totalCost), CLIENT_URL, project.id),
    }).catch((err) => console.error('[email] quote-ready failed:', err.message));

    res.status(201).json({ status: 'success', data: { project, inquiry } });
  } catch (err) { next(err); }
};

function quoteReadyEmailHtml(name: string, projectTitle: string, kobo: number, clientUrl: string, projectId: string): string {
  const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(kobo / 100);
  return `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background:linear-gradient(135deg,#0d9488,#06b6d4);border-radius:12px;padding:12px 20px;">
          <span style="color:white;font-weight:bold;font-size:18px;">E-Bringgs</span>
        </div>
      </div>
      <div style="background:white;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
        <h2 style="color:#111827;margin-top:0;">Hi ${name},</h2>
        <p style="color:#6b7280;">Great news — we've reviewed your request and prepared a quote.</p>
        <div style="background:#f0fdfa;border-left:4px solid #0d9488;padding:20px;border-radius:8px;margin:24px 0;">
          <p style="margin:0 0 4px;color:#134e4a;font-size:13px;font-weight:600;">Project</p>
          <p style="margin:0 0 12px;color:#111827;font-size:16px;font-weight:600;">${projectTitle}</p>
          <p style="margin:0 0 4px;color:#134e4a;font-size:13px;font-weight:600;">Total cost</p>
          <p style="margin:0;color:#0d9488;font-size:24px;font-weight:800;">${naira}</p>
        </div>
        <p style="color:#6b7280;">Your project is now live in your dashboard with status "Awaiting Payment". Click below to review the details and pay securely via Paystack.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${clientUrl}/client/projects/${projectId}"
             style="background:#0d9488;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;display:inline-block;">
            Review & pay
          </a>
        </div>
        <p style="color:#9ca3af;font-size:13px;">Once paid, we'll start the project and post timeline updates you can track in real time.</p>
      </div>
    </div>
  `;
}

export const updateInquiryStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    if (!['new', 'contacted', 'closed'].includes(status)) {
      return next(new AppError('Invalid status value.', 400));
    }
    const inquiry = await ServiceInquiry.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!inquiry) return next(new AppError('Inquiry not found.', 404));
    res.json({ status: 'success', data: { inquiry } });
  } catch (err) { next(err); }
};
