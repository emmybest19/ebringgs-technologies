import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../types';
import Project from '../models/Project.model';
import ProjectUpdate from '../models/ProjectUpdate.model';
import User from '../models/User.model';
import { AppError } from '../middleware/error.middleware';
import { sendPushToUser, sendPushToRole } from '../utils/pushNotification';
import { sendEmail, emailTemplates } from '../utils/email';
import { getProductizedService } from '../config/services.catalog';
import { notifyBriefSubmitted, notifyProjectUpdate } from '../services/whatsapp.service';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Client: list own projects
export const getMyProjects = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projects = await Project.find({ client: req.user!.userId })
      .sort({ createdAt: -1 });
    res.json({ status: 'success', data: { projects } });
  } catch (err) { next(err); }
};

// Client: get single project
export const getProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      client: req.user!.userId,
    });
    if (!project) return next(new AppError('Project not found.', 404));
    res.json({ status: 'success', data: { project } });
  } catch (err) { next(err); }
};

// Client: create a project (book a service)
export const createProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { serviceId, serviceName, title, description, totalCost } = req.body;
    if (!serviceId || !serviceName || !title || !description || !totalCost) {
      return next(new AppError('All fields are required: serviceId, serviceName, title, description, totalCost.', 400));
    }
    const project = await Project.create({
      client: req.user!.userId,
      serviceId,
      serviceName,
      title,
      description,
      totalCost,
    });
    res.status(201).json({ status: 'success', data: { project } });
  } catch (err) { next(err); }
};

// Admin: list all projects
export const getAllProjects = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projects = await Project.find()
      .populate('client', 'name email avatar')
      .sort({ createdAt: -1 });
    res.json({ status: 'success', data: { projects } });
  } catch (err) { next(err); }
};

// Admin: update project (status, progress, links, deliverables, timeline)
export const updateProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const allowed = [
      'status', 'progress', 'githubRepo', 'liveUrl', 'deliverables',
      'timeline', 'startDate', 'estimatedEndDate', 'completedAt', 'notes',
      'isPaid', 'paystackReference',
    ];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (updates.status === 'completed' && !updates.completedAt) {
      updates.completedAt = new Date();
    }

    // Load the pre-update snapshot so we can diff and auto-log meaningful
    // changes as activity entries the client will see in their timeline.
    const before = await Project.findById(req.params.id);
    if (!before) return next(new AppError('Project not found.', 404));

    updates.lastUpdatedBy = new mongoose.Types.ObjectId(req.user!.userId);

    const project = await Project.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('client', 'name email avatar');
    if (!project) return next(new AppError('Project not found.', 404));

    // Auto-post a ProjectUpdate for each meaningful change. Failures are
    // non-fatal — the project itself was already updated successfully.
    type ActivityEntry = {
      type: 'progress' | 'commit' | 'deploy' | 'note' | 'milestone' | 'attachment';
      title: string;
      message?: string;
      url?: string;
      progressChange?: number;
    };
    const activityEntries: ActivityEntry[] = [];

    if (updates.status && updates.status !== before.status) {
      activityEntries.push({
        type: 'milestone',
        title: `Status changed to ${String(updates.status).replace(/_/g, ' ')}`,
      });
    }
    if (typeof updates.progress === 'number' && updates.progress !== before.progress) {
      activityEntries.push({
        type: 'progress',
        title: `Progress updated to ${updates.progress}%`,
        progressChange: updates.progress,
      });
    }
    if (typeof updates.githubRepo === 'string' && updates.githubRepo && updates.githubRepo !== before.githubRepo) {
      activityEntries.push({
        type: 'note',
        title: 'Linked GitHub repository',
        url: updates.githubRepo,
      });
    }
    if (typeof updates.liveUrl === 'string' && updates.liveUrl && updates.liveUrl !== before.liveUrl) {
      activityEntries.push({
        type: 'deploy',
        title: 'Live site published',
        url: updates.liveUrl,
      });
    }

    if (activityEntries.length > 0) {
      await Promise.all(
        activityEntries.map((entry) =>
          ProjectUpdate.create({
            project: project._id,
            author: req.user!.userId,
            ...entry,
          }).catch((err) => console.error('[project] auto-activity insert failed:', err)),
        ),
      );
    }

    // Notify the client about project status update
    if (updates.status) {
      sendPushToUser(project.client._id?.toString() || project.client.toString(), {
        title: 'Project Update',
        body: `Your project "${project.title}" status changed to ${updates.status}.`,
        url: `/client/projects/${project._id}`,
        tag: 'project-update',
      }).catch(() => {});
    }

    res.json({ status: 'success', data: { project } });
  } catch (err) { next(err); }
};

// Admin: delete project
export const deleteProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return next(new AppError('Project not found.', 404));
    await ProjectUpdate.deleteMany({ project: req.params.id });
    res.json({ status: 'success', message: 'Project deleted.' });
  } catch (err) { next(err); }
};

/* ─── Project Updates / Activity Timeline ─────────────────────────────── */

// GET /api/projects/:id/updates — auth (client owner OR admin)
export const getProjectUpdates = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate<{ lastUpdatedBy: { name: string; avatar?: string } | null }>('lastUpdatedBy', 'name avatar');
    if (!project) return next(new AppError('Project not found.', 404));

    const isOwner = project.client.toString() === req.user!.userId;
    const isAdmin = req.user!.role === 'admin';
    if (!isOwner && !isAdmin) return next(new AppError('Not authorized.', 403));

    const updates = await ProjectUpdate.find({ project: req.params.id })
      .populate('author', 'name avatar role')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      status: 'success',
      data: {
        updates,
        lastUpdatedAt: project.updatedAt,
        lastUpdatedByName: project.lastUpdatedBy?.name ?? null,
      },
    });
  } catch (err) { next(err); }
};

// POST /api/projects/:id/updates — admin only
export const addProjectUpdate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type, title, message, url, progressChange } = req.body;
    if (!type || !title) {
      return next(new AppError('type and title are required.', 400));
    }

    const project = await Project.findById(req.params.id);
    if (!project) return next(new AppError('Project not found.', 404));

    const update = await ProjectUpdate.create({
      project: req.params.id,
      author: req.user!.userId,
      type,
      title,
      message,
      url,
      progressChange,
    });

    // If the update changes progress, also patch the project itself
    if (typeof progressChange === 'number' && progressChange >= 0 && progressChange <= 100) {
      project.progress = progressChange;
    }
    // Touch updatedAt either way + record who acted
    project.lastUpdatedBy = new mongoose.Types.ObjectId(req.user!.userId);
    project.markModified('updatedAt');
    await project.save();

    // Notify the client (push + WhatsApp if opted in)
    sendPushToUser(project.client.toString(), {
      title: 'Project Update',
      body: `Update on "${project.title}": ${title}`,
      url: `/client/projects/${project._id}`,
      tag: 'project-update',
    }).catch(() => {});

    User.findById(project.client)
      .select('phone whatsappOptIn')
      .then((u) => {
        if (u?.phone && u.whatsappOptIn !== false) {
          notifyProjectUpdate(u.phone, project.title, title, project._id.toString(), CLIENT_URL).catch(() => {});
        }
      })
      .catch(() => {});

    const populated = await ProjectUpdate.findById(update._id).populate('author', 'name avatar role');
    res.status(201).json({ status: 'success', data: { update: populated, lastUpdatedAt: project.updatedAt } });
  } catch (err) { next(err); }
};

// POST /api/projects/:id/brief — client owner submits the post-payment intake brief
export const submitBrief = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      client: req.user!.userId,
    });
    if (!project) return next(new AppError('Project not found.', 404));

    if (project.status !== 'awaiting_brief') {
      return next(new AppError('Brief has already been submitted for this project.', 400));
    }

    const brief = req.body?.brief;
    if (!brief || typeof brief !== 'object' || Array.isArray(brief)) {
      return next(new AppError('A brief object is required.', 400));
    }

    const service = getProductizedService(project.serviceId);
    if (service?.intakeFields) {
      const missing = service.intakeFields
        .filter((f) => f.required)
        .filter((f) => {
          const v = (brief as Record<string, unknown>)[f.name];
          if (v === undefined || v === null || v === '') return true;
          if (Array.isArray(v) && v.length === 0) return true;
          return false;
        })
        .map((f) => f.label);
      if (missing.length > 0) {
        return next(new AppError(`Missing required field(s): ${missing.join(', ')}`, 400));
      }
    }

    project.brief = brief;
    project.briefSubmittedAt = new Date();
    project.status = 'in_progress';
    project.startDate = project.startDate || new Date();
    project.lastUpdatedBy = new mongoose.Types.ObjectId(req.user!.userId);
    await project.save();

    // Add an activity timeline entry
    await ProjectUpdate.create({
      project: project._id,
      author: req.user!.userId,
      type: 'milestone',
      title: 'Brief submitted',
      message: 'Client provided the project brief. Work can now begin.',
    }).catch(() => {});

    // Notify admins (push + email — fire & forget)
    sendPushToRole('admin', {
      title: 'Project brief received',
      body: `${project.serviceName} — ready to start.`,
      url: `/admin/projects/${project._id}`,
      tag: 'project-brief',
    }).catch(() => {});

    notifyAdminsOfBrief(project._id.toString(), project.serviceName, req.user!.userId, brief as Record<string, unknown>)
      .catch((err) => console.error('[email] brief notification failed:', err.message));

    // WhatsApp the client (no-op if not configured / no phone)
    User.findById(req.user!.userId)
      .select('phone whatsappOptIn')
      .then((u) => {
        if (u?.phone && u.whatsappOptIn !== false) {
          notifyBriefSubmitted(u.phone, project.serviceName, project._id.toString(), CLIENT_URL).catch(() => {});
        }
      })
      .catch(() => {});

    res.json({ status: 'success', data: { project } });
  } catch (err) { next(err); }
};

async function notifyAdminsOfBrief(
  projectId: string,
  serviceName: string,
  clientUserId: string,
  brief: Record<string, unknown>,
): Promise<void> {
  const [admins, client] = await Promise.all([
    User.find({ role: 'admin' }).select('email').lean(),
    User.findById(clientUserId).select('name email').lean(),
  ]);
  if (!admins.length || !client) return;

  const { subject, html } = emailTemplates.projectBriefSubmitted(
    serviceName, client.name, client.email, projectId, brief, CLIENT_URL,
  );

  await Promise.allSettled(
    admins.map((a) => sendEmail({ to: a.email, subject, html })),
  );
}

// DELETE /api/projects/:id/updates/:updateId — admin only
export const deleteProjectUpdate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await ProjectUpdate.deleteOne({
      _id: req.params.updateId,
      project: req.params.id,
    });
    if (result.deletedCount === 0) return next(new AppError('Update not found.', 404));
    res.json({ status: 'success' });
  } catch (err) { next(err); }
};
