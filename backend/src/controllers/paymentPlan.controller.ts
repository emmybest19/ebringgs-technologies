import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import PaymentPlan, { IInstallment, IPaymentPlan } from '../models/PaymentPlan.model';
import { AppError } from '../middleware/error.middleware';

/**
 * Decorate a PaymentPlan with derived fields the frontend needs but we don't
 * want to recompute everywhere:
 *   - nextInstallment    → the next unpaid installment (or null if completed)
 *   - paidCount          → how many installments are already paid
 *   - amountPaid         → sum of paid installment amounts (kobo)
 *   - amountRemaining    → totalAmount - amountPaid (kobo)
 */
function decorate(plan: IPaymentPlan) {
  const obj = plan.toObject({ virtuals: false }) as IPaymentPlan & { installments: IInstallment[] };
  const installments = obj.installments;
  const paidCount = installments.filter((i: IInstallment) => i.status === 'paid' || i.status === 'manual').length;
  const amountPaid = installments
    .filter((i: IInstallment) => i.status === 'paid' || i.status === 'manual')
    .reduce((sum: number, i: IInstallment) => sum + i.amount, 0);
  const nextInstallment =
    installments.find((i: IInstallment) => i.status === 'pending' || i.status === 'failed') ?? null;
  return {
    ...obj,
    paidCount,
    amountPaid,
    amountRemaining: obj.totalAmount - amountPaid,
    nextInstallment,
  };
}

/* ─── Client ─────────────────────────────────────────────────────────── */

/** GET /api/payment-plans/my — current user's plans, newest first. */
export const getMyPaymentPlans = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const plans = await PaymentPlan.find({ user: req.user!.userId })
      .sort({ createdAt: -1 });
    res.json({ status: 'success', data: { plans: plans.map(decorate) } });
  } catch (err) { next(err); }
};

/** GET /api/payment-plans/:id — owner-only. */
export const getPaymentPlan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const plan = await PaymentPlan.findOne({
      _id: req.params.id,
      user: req.user!.userId,
    });
    if (!plan) return next(new AppError('Payment plan not found.', 404));
    res.json({ status: 'success', data: { plan: decorate(plan) } });
  } catch (err) { next(err); }
};

/* ─── Admin ──────────────────────────────────────────────────────────── */

/** GET /api/payment-plans/admin/all — every plan with optional status filter. */
export const adminListPaymentPlans = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    const plans = await PaymentPlan.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json({ status: 'success', data: { plans: plans.map(decorate) } });
  } catch (err) { next(err); }
};

/**
 * POST /api/payment-plans/:id/extend — admin grants a deadline extension on
 * the next unpaid installment. Body: `{ extraDays: number }`. Clears overdue
 * state if the plan was overdue.
 */
export const adminExtendPlan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const extraDays = Math.max(1, Math.min(30, Math.floor(Number(req.body.extraDays))));
    if (!extraDays) return next(new AppError('extraDays must be between 1 and 30.', 400));

    const plan = await PaymentPlan.findById(req.params.id);
    if (!plan) return next(new AppError('Payment plan not found.', 404));

    const next_ = plan.installments.find((i) => i.status === 'pending' || i.status === 'failed');
    if (!next_) return next(new AppError('No pending installment to extend.', 400));

    next_.dueDate = new Date(next_.dueDate.getTime() + extraDays * 24 * 60 * 60 * 1000);
    // If the plan was suspended or overdue, give it another chance.
    if (plan.status === 'overdue' || plan.status === 'suspended') {
      plan.status = 'active';
      plan.gracePeriodEndsAt = undefined;
      plan.suspendedAt = undefined;
    }
    await plan.save();
    res.json({ status: 'success', data: { plan: decorate(plan) } });
  } catch (err) { next(err); }
};

/**
 * POST /api/payment-plans/:id/mark-paid — admin manually marks the next
 * unpaid installment as paid (e.g. client wired the money offline).
 * Body: `{ note?: string }`.
 */
export const adminMarkInstallmentPaid = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const plan = await PaymentPlan.findById(req.params.id);
    if (!plan) return next(new AppError('Payment plan not found.', 404));

    const installment = plan.installments.find((i) => i.status === 'pending' || i.status === 'failed');
    if (!installment) return next(new AppError('No pending installment to mark.', 400));

    installment.status = 'manual';
    installment.paidAt = new Date();
    installment.lastChargeMessage = req.body?.note ? String(req.body.note).slice(0, 200) : 'Marked paid by admin';

    const allPaid = plan.installments.every((i) => i.status === 'paid' || i.status === 'manual');
    if (allPaid) {
      plan.status = 'completed';
      plan.completedAt = new Date();
      plan.gracePeriodEndsAt = undefined;
    } else if (plan.status === 'overdue' || plan.status === 'suspended') {
      plan.status = 'active';
      plan.gracePeriodEndsAt = undefined;
      plan.suspendedAt = undefined;
    }
    await plan.save();
    res.json({ status: 'success', data: { plan: decorate(plan) } });
  } catch (err) { next(err); }
};
