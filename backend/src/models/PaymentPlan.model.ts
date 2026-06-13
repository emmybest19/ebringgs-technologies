import mongoose, { Document, Schema } from 'mongoose';

/**
 * A PaymentPlan is the installment schedule a user commits to at checkout.
 *
 *   - 1×  → never created (one-time payments stay as a single Transaction).
 *   - 2×  → 2 installments at +0d and +30d.
 *   - 3×  → 3 installments at +0d, +30d, +60d.
 *
 * Installment 1 is charged immediately at checkout (the normal Paystack flow);
 * subsequent installments are auto-charged by `jobs/installments.cron.ts` using
 * the `authorizationCode` captured during the first payment.
 *
 * If an auto-charge fails the plan enters a 7-day grace period (status='overdue'
 * + `gracePeriodEndsAt`). The cron checks daily and flips status to 'suspended'
 * once grace expires — at which point `feature-access.middleware.ts` blocks the
 * user from the paid feature linked to this plan (but never from the dashboard
 * or from /api/payment-plans, so they can always pay to restore).
 */

/**
 * What this PaymentPlan is paying for:
 *   - 'service' → a productized catalog entry (linkedServiceId = catalog id string)
 *   - 'plan'    → a training plan (linkedPlanId = Checkout plan id like 'frontend-cohort')
 *   - 'project' → a client project (linkedProject = Project ObjectId)
 *   - 'cohort'  → a specific cohort enrolment (linkedCohort = Cohort ObjectId)
 */
export type LinkedKind = 'service' | 'plan' | 'project' | 'cohort';

export type InstallmentStatus = 'pending' | 'paid' | 'failed' | 'manual';

export type PaymentPlanStatus =
  | 'active'      // payments on schedule
  | 'completed'   // all installments paid
  | 'overdue'     // a charge failed; in grace
  | 'suspended'   // grace expired; feature access blocked
  | 'cancelled';  // admin cancelled

export interface IInstallment {
  amount: number;                       // in kobo (matches Transaction.amount)
  dueDate: Date;
  status: InstallmentStatus;
  /** Set when status flips to 'paid' — links back to the Transaction row. */
  transactionId?: mongoose.Types.ObjectId;
  /** Last Paystack response message for the most recent charge attempt. */
  lastChargeMessage?: string;
  /** Count of auto-charge attempts (incremented by the cron on each try). */
  attemptCount: number;
  paidAt?: Date;
}

export interface IPaymentPlan extends Document {
  user: mongoose.Types.ObjectId;

  /** What this plan is paying for. Exactly one of the link fields is set. */
  linkedKind: LinkedKind;
  linkedServiceId?: string;             // matches services.catalog id (e.g. '12')
  linkedPlanId?: string;                // matches Checkout plan id (e.g. 'frontend-cohort')
  linkedProject?: mongoose.Types.ObjectId;
  linkedCohort?: mongoose.Types.ObjectId;
  /** Free-text description, useful in admin views (e.g. "Full-Stack Web App MVP"). */
  description: string;

  /** Sum of all installment amounts, in kobo. Matches the catalog price. */
  totalAmount: number;

  installments: IInstallment[];

  /**
   * Paystack authorization captured from installment 1. Lets the cron call
   * /transaction/charge_authorization for subsequent installments without
   * requiring the user to re-enter card details.
   */
  authorizationCode?: string;
  cardLast4?: string;
  cardBrand?: string;
  /** Paystack customer code (same customer across installments). */
  paystackCustomerCode?: string;

  status: PaymentPlanStatus;

  /**
   * When set, indicates the plan is in its 7-day grace window after a failed
   * charge. Cron suspends the plan once `Date.now() > gracePeriodEndsAt`.
   */
  gracePeriodEndsAt?: Date;

  /** Set when status → 'suspended' for audit. */
  suspendedAt?: Date;
  /** Set when status → 'completed'. */
  completedAt?: Date;

  /** Whether the user explicitly opted in to auto-charge. Required for 2×/3×. */
  autoChargeConsent: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const installmentSchema = new Schema<IInstallment>(
  {
    amount: { type: Number, required: true, min: 0 },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'paid', 'failed', 'manual'], default: 'pending' },
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    lastChargeMessage: { type: String },
    attemptCount: { type: Number, default: 0 },
    paidAt: { type: Date },
  },
  { _id: false },
);

const paymentPlanSchema = new Schema<IPaymentPlan>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    linkedKind: { type: String, enum: ['service', 'plan', 'project', 'cohort'], required: true },
    linkedServiceId: { type: String, index: true },
    linkedPlanId: { type: String, index: true },
    linkedProject: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    linkedCohort: { type: Schema.Types.ObjectId, ref: 'Cohort', index: true },
    description: { type: String, required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    installments: { type: [installmentSchema], required: true, validate: (v: IInstallment[]) => v.length >= 2 && v.length <= 3 },
    authorizationCode: { type: String },
    cardLast4: { type: String },
    cardBrand: { type: String },
    paystackCustomerCode: { type: String },
    status: {
      type: String,
      enum: ['active', 'completed', 'overdue', 'suspended', 'cancelled'],
      default: 'active',
      index: true,
    },
    gracePeriodEndsAt: { type: Date },
    suspendedAt: { type: Date },
    completedAt: { type: Date },
    autoChargeConsent: { type: Boolean, required: true },
  },
  { timestamps: true },
);

// Cron hot-path index: "find every plan with a pending installment due today or earlier".
// Compound (status, installments.dueDate) covers the most common query.
paymentPlanSchema.index({ status: 1, 'installments.status': 1, 'installments.dueDate': 1 });

// Convenience helper — derives the next-unpaid installment.
paymentPlanSchema.virtual('nextInstallment').get(function (this: IPaymentPlan) {
  return this.installments.find((i) => i.status === 'pending' || i.status === 'failed');
});

paymentPlanSchema.set('toJSON', { virtuals: true });
paymentPlanSchema.set('toObject', { virtuals: true });

export default mongoose.model<IPaymentPlan>('PaymentPlan', paymentPlanSchema);
