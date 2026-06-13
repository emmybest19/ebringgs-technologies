import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import PaymentPlan from '../models/PaymentPlan.model';

/**
 * Route guards that return `403 PAYMENT_REQUIRED` when the user has a
 * suspended PaymentPlan covering the resource they're trying to access.
 *
 * Response shape (read by the frontend axios interceptor):
 * ```json
 * {
 *   "status": "error",
 *   "error":  "PAYMENT_REQUIRED",
 *   "message": "...human-readable...",
 *   "paymentPlanId": "...",
 *   "amountDue":     <kobo>
 * }
 * ```
 *
 * The interceptor (`frontend/src/services/api.ts`) catches this shape, toasts
 * the user, and redirects them to the plan page so they can pay to restore.
 *
 * Deliberate non-blocks (so users can always settle): /api/payment-plans/*,
 * /api/auth/*, /api/users/profile, /api/admin/*. Apply these middlewares only
 * to the "paid feature" routes listed in the implementation plan.
 */

function buildResponse(planId: string, amountDue: number, message: string) {
  return {
    status: 'error' as const,
    error: 'PAYMENT_REQUIRED' as const,
    message,
    paymentPlanId: planId,
    amountDue,
  };
}

/**
 * Gate for student "paid feature" routes (live classes, assignments,
 * recordings). Blocks if the user has any suspended PaymentPlan linked to a
 * training plan or cohort — that's the entire learning surface they bought.
 */
export const requireStudentAccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) return next();
    const suspended = await PaymentPlan.findOne({
      user: req.user.userId,
      status: 'suspended',
      linkedKind: { $in: ['plan', 'cohort'] },
    }).select('_id installments description');
    if (!suspended) return next();

    const next_ = suspended.installments.find((i) => i.status === 'pending' || i.status === 'failed');
    const amountDue = next_?.amount ?? 0;

    res.status(403).json(buildResponse(
      suspended._id.toString(),
      amountDue,
      `Access to ${suspended.description} is paused. Settle your outstanding installment to restore.`,
    ));
  } catch (err) { next(err); }
};

/**
 * Gate for project routes (`GET /api/projects/my/:id` and any nested route
 * that exposes deliverables). Blocks only when the specific project being
 * accessed has a suspended PaymentPlan attached.
 *
 * The `:id` URL param must hold the Project's ObjectId — both `req.params.id`
 * and `req.params.projectId` are checked so this works on both route shapes.
 */
export const requireProjectAccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) return next();
    const projectId = req.params.id || req.params.projectId;
    if (!projectId) return next();

    const suspended = await PaymentPlan.findOne({
      user: req.user.userId,
      status: 'suspended',
      linkedProject: projectId,
    }).select('_id installments description');
    if (!suspended) return next();

    const next_ = suspended.installments.find((i) => i.status === 'pending' || i.status === 'failed');
    const amountDue = next_?.amount ?? 0;

    res.status(403).json(buildResponse(
      suspended._id.toString(),
      amountDue,
      `This project's payment is overdue. Settle the outstanding installment to view deliverables.`,
    ));
  } catch (err) { next(err); }
};
