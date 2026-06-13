import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import CaseStudy from '../models/CaseStudy.model';
import { AppError } from '../middleware/error.middleware';

const ALLOWED_FIELDS = [
  'type', 'title', 'slug', 'summary', 'description', 'coverImage', 'gallery',
  'category', 'tags', 'techStack', 'serviceId', 'clientName', 'clientLogo',
  'results', 'deliveryDays', 'priceKobo', 'studentName', 'studentAvatar',
  'studentRole', 'studentBio', 'cohortBatch', 'liveUrl', 'githubUrl',
  'testimonial', 'featured', 'published', 'order',
] as const;

function pickFields(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of ALLOWED_FIELDS) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  return out;
}

// GET /api/case-studies — public
export const listPublic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, category, serviceId, featured, cohort, limit } = req.query as Record<string, string>;
    const query: Record<string, unknown> = { published: true };
    if (type) query.type = type;
    if (category && category !== 'All') query.category = category;
    if (serviceId) query.serviceId = serviceId;
    if (cohort && cohort !== 'All') query.cohortBatch = cohort;
    if (featured === 'true') query.featured = true;

    let cursor = CaseStudy.find(query)
      .sort({ featured: -1, order: -1, createdAt: -1 });

    const lim = Number(limit);
    if (Number.isFinite(lim) && lim > 0 && lim <= 50) {
      cursor = cursor.limit(lim);
    }

    const studies = await cursor.lean();
    res.json({ status: 'success', data: { studies } });
  } catch (err) { next(err); }
};

// GET /api/case-studies/:slug — public
export const getPublic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const study = await CaseStudy.findOne({ slug: req.params.slug, published: true }).lean();
    if (!study) return next(new AppError('Case study not found.', 404));
    res.json({ status: 'success', data: { study } });
  } catch (err) { next(err); }
};

// GET /api/case-studies/admin/all — admin only (incl. unpublished)
export const listAll = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const studies = await CaseStudy.find()
      .sort({ featured: -1, order: -1, createdAt: -1 });
    res.json({ status: 'success', data: { studies } });
  } catch (err) { next(err); }
};

// POST /api/case-studies — admin only
export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const body = pickFields(req.body);
    if (!body.title || !body.summary || !body.type) {
      return next(new AppError('type, title and summary are required.', 400));
    }
    const study = await CaseStudy.create({ ...body, createdBy: req.user!.userId });
    res.status(201).json({ status: 'success', data: { study } });
  } catch (err) { next(err); }
};

// PATCH /api/case-studies/:id — admin only
export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const body = pickFields(req.body);
    const study = await CaseStudy.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!study) return next(new AppError('Case study not found.', 404));
    res.json({ status: 'success', data: { study } });
  } catch (err) { next(err); }
};

// DELETE /api/case-studies/:id — admin only
export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const study = await CaseStudy.findByIdAndDelete(req.params.id);
    if (!study) return next(new AppError('Case study not found.', 404));
    res.json({ status: 'success', message: 'Case study deleted.' });
  } catch (err) { next(err); }
};
