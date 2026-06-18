import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../types';
import Cohort, { deriveCohortStatus, ICohort } from '../models/Cohort.model';
import Transaction from '../models/Transaction.model';
import User from '../models/User.model';
import { getTutoringTrack } from '../config/tutoring.catalog';
import { AppError } from '../middleware/error.middleware';

/**
 * Fallback duration (in weeks) when no tutoring track matches the buyer's
 * planId — e.g. legacy plan IDs we kept for backwards-compat. Matches the
 * shortest current track so we don't over-promise time.
 */
const FALLBACK_DURATION_WEEKS = 8;

const ADMIN_EDITABLE_FIELDS = [
  'program', 'title', 'planId', 'startDate', 'endDate', 'durationLabel',
  'priceNgn', 'capacity', 'enrolledCount', 'isEnrollmentOpen', 'status',
  'description', 'instructor', 'highlights', 'order', 'slug',
] as const;

function pickAllowed(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of ADMIN_EDITABLE_FIELDS) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  return out;
}

/**
 * Decorate a cohort with the derived status + spots-remaining, without
 * persisting anything. Used on every public response so the client never
 * has to re-derive it.
 */
function decorate(c: ICohort & { _id: unknown }) {
  const status = deriveCohortStatus(c);
  const spotsRemaining = Math.max(0, c.capacity - c.enrolledCount);
  return { ...(c.toObject ? c.toObject() : c), status, spotsRemaining };
}

/**
 * GET /api/cohorts — public list.
 *
 * Query params:
 *   - upcoming=true   → only intakes that haven't started yet
 *   - program=Web…    → filter by track
 *   - limit=N         → cap result count (1-50)
 *
 * Sort order is startDate ASC, then `order` ASC. That makes the FIRST
 * element in the array the "next intake" for the public countdown.
 */
export const listPublic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { upcoming, program, limit } = req.query as Record<string, string>;
    const query: Record<string, unknown> = { isEnrollmentOpen: true };
    if (upcoming === 'true') {
      query.startDate = { $gte: new Date() };
    }
    if (program) {
      query.program = program;
    }

    let cursor = Cohort.find(query).sort({ startDate: 1, order: 1 });

    const lim = Number(limit);
    if (Number.isFinite(lim) && lim > 0 && lim <= 50) {
      cursor = cursor.limit(lim);
    }

    const cohorts = await cursor.exec();
    res.json({
      status: 'success',
      data: { cohorts: cohorts.map(decorate) },
    });
  } catch (err) { next(err); }
};

/**
 * GET /api/cohorts/next — convenience endpoint returning the single
 * soonest upcoming cohort (or null if none). Drives the schedule-page
 * countdown directly with no client-side ranking required.
 */
export const getNext = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cohort = await Cohort.findOne({
      isEnrollmentOpen: true,
      startDate: { $gte: new Date() },
    }).sort({ startDate: 1, order: 1 });

    res.json({
      status: 'success',
      data: { cohort: cohort ? decorate(cohort) : null },
    });
  } catch (err) { next(err); }
};

/**
 * GET /api/cohorts/my-next — student-only. Returns the next cohort the
 * caller is scheduled into, plus a live countdown source date.
 *
 * Eligibility: the caller must have at least one succeeded plan-type
 * Transaction whose metadata.planId contains "cohort" (matches all
 * -cohort plan IDs from frontend/src/pages/Checkout.tsx, plus the
 * legacy single "cohort" ID).
 *
 * Resolution:
 *   1. If an admin-created Cohort with the buyer's planId and a future
 *      startDate exists, that's the source of truth.
 *   2. Otherwise we synthesise: startDate = purchase date + 2 months
 *      (or now + 2 months, whichever is later — so refreshing the page
 *      a year after purchase doesn't show a negative timer).
 *
 * Returns `{ cohort: null, eligible: false }` when the user hasn't
 * bought a cohort plan — the frontend uses this to hide the block.
 */
export const getMyNext = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const purchase = await Transaction.findOne({
      user: req.user!.userId,
      status: 'succeeded',
      'metadata.purchaseType': 'plan',
      'metadata.planId': /cohort/i,
    }).sort({ createdAt: 1 }); // earliest cohort purchase wins

    if (!purchase) {
      return res.json({ status: 'success', data: { cohort: null, eligible: false } });
    }

    // metadata is a Mongoose Map — read via .get when present, fall back to plain access.
    const planIdRaw =
      (purchase.metadata && typeof (purchase.metadata as unknown as Map<string, string>).get === 'function'
        ? (purchase.metadata as unknown as Map<string, string>).get('planId')
        : (purchase.metadata as unknown as Record<string, string>)?.planId) || '';
    const planId = String(planIdRaw);

    // 1) Real admin-created cohort takes precedence.
    if (planId) {
      const real = await Cohort.findOne({
        planId,
        startDate: { $gte: new Date() },
      }).sort({ startDate: 1, order: 1 });

      if (real) {
        return res.json({
          status: 'success',
          data: {
            cohort: decorate(real),
            eligible: true,
            isPlaceholder: false,
            planId,
            purchaseDate: purchase.createdAt,
          },
        });
      }
    }

    // 2) Synthesise: look up the buyer's plan in the tutoring catalog and
    // use its real duration. Anchor `start` to the PURCHASE date (not
    // `now`) so the countdown actually counts down day by day — using
    // `now` made every refresh show the same number, which isn't a
    // countdown at all. The downside is two buyers of the same track see
    // different personal start dates; the fix for shared intakes is for
    // admin to create a real Cohort doc, which the branch above prefers.
    const track = getTutoringTrack(planId);
    const weeks = track?.durationWeeks ?? FALLBACK_DURATION_WEEKS;
    const durationLabel = track?.durationLabel ?? `${weeks} weeks`;
    const title = track?.title ?? purchase.description ?? 'Your cohort';

    const purchaseMs = new Date(purchase.createdAt).getTime();
    const cohortMs = weeks * 7 * 24 * 60 * 60 * 1000;
    const start = new Date(purchaseMs + cohortMs);
    const end = new Date(start.getTime() + cohortMs);

    return res.json({
      status: 'success',
      data: {
        cohort: {
          planId,
          title,
          startDate: start,
          endDate: end,
          durationLabel,
          status: 'open',
        },
        eligible: true,
        isPlaceholder: true,
        planId,
        purchaseDate: purchase.createdAt,
      },
    });
  } catch (err) { next(err); }
};

/**
 * GET /api/cohorts/:slug — public detail (returns 404 if the cohort
 * exists but has enrollment closed, so admins can hide it cleanly).
 */
export const getPublic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cohort = await Cohort.findOne({ slug: req.params.slug, isEnrollmentOpen: true });
    if (!cohort) return next(new AppError('Cohort not found.', 404));
    res.json({ status: 'success', data: { cohort: decorate(cohort) } });
  } catch (err) { next(err); }
};

/**
 * GET /api/cohorts/admin/all — admin only. Returns every cohort
 * including closed/ended ones, sorted by recency.
 */
export const listAll = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const cohorts = await Cohort.find().sort({ startDate: -1, order: 1 });
    res.json({
      status: 'success',
      data: { cohorts: cohorts.map(decorate) },
    });
  } catch (err) { next(err); }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const body = pickAllowed(req.body);
    if (!body.title || !body.program || !body.planId || !body.startDate || body.priceNgn === undefined || !body.capacity) {
      return next(new AppError('title, program, planId, startDate, priceNgn and capacity are required.', 400));
    }
    if (body.endDate && new Date(body.endDate as string) < new Date(body.startDate as string)) {
      return next(new AppError('endDate must be after startDate.', 400));
    }
    const cohort = await Cohort.create(body);
    res.status(201).json({ status: 'success', data: { cohort: decorate(cohort) } });
  } catch (err) { next(err); }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const body = pickAllowed(req.body);
    if (body.endDate && body.startDate && new Date(body.endDate as string) < new Date(body.startDate as string)) {
      return next(new AppError('endDate must be after startDate.', 400));
    }
    const cohort = await Cohort.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!cohort) return next(new AppError('Cohort not found.', 404));
    res.json({ status: 'success', data: { cohort: decorate(cohort) } });
  } catch (err) { next(err); }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const cohort = await Cohort.findByIdAndDelete(req.params.id);
    if (!cohort) return next(new AppError('Cohort not found.', 404));
    res.json({ status: 'success', message: 'Cohort deleted.' });
  } catch (err) { next(err); }
};

/**
 * GET /api/cohorts/:id/students — admin lists enrolled students.
 */
export const listStudents = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const cohort = await Cohort.findById(req.params.id)
      .populate('students', 'name email avatar');
    if (!cohort) return next(new AppError('Cohort not found.', 404));
    res.json({ status: 'success', data: { students: cohort.students } });
  } catch (err) { next(err); }
};

/**
 * POST /api/cohorts/:id/students — admin enrolls a student.
 * Body: { studentId }.  Idempotent — re-enrolling is a no-op, not an error.
 */
export const enrollStudent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.body;
    if (!studentId) return next(new AppError('studentId is required.', 400));
    if (!mongoose.isValidObjectId(studentId)) {
      return next(new AppError('Invalid studentId.', 400));
    }

    const [cohort, student] = await Promise.all([
      Cohort.findById(req.params.id),
      User.findById(studentId).select('name email'),
    ]);
    if (!cohort) return next(new AppError('Cohort not found.', 404));
    if (!student) return next(new AppError('Student not found.', 404));

    const sid = new mongoose.Types.ObjectId(studentId);
    const already = cohort.students.some((s) => s.equals(sid));
    if (!already) {
      if (cohort.students.length >= cohort.capacity) {
        return next(new AppError('Cohort is at capacity.', 409));
      }
      cohort.students.push(sid);
      await cohort.save();
    }

    res.json({ status: 'success', data: { cohort: decorate(cohort) } });
  } catch (err) { next(err); }
};

/**
 * DELETE /api/cohorts/:id/students/:studentId — admin removes a student.
 */
export const unenrollStudent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const cohort = await Cohort.findById(req.params.id);
    if (!cohort) return next(new AppError('Cohort not found.', 404));

    const sid = req.params.studentId;
    cohort.students = cohort.students.filter((s) => s.toString() !== sid);
    await cohort.save();

    res.json({ status: 'success', data: { cohort: decorate(cohort) } });
  } catch (err) { next(err); }
};
