import mongoose, { Document, Schema } from 'mongoose';

/**
 * A Cohort represents a single *intake* of a training program — i.e. the
 * specific batch starting on a specific date. Distinct from LiveSession
 * (which is an individual class within a cohort).
 *
 * The `planId` column links this cohort to a Checkout plan (see
 * `frontend/src/pages/Checkout.tsx → planDetails`) so the "Enrol now" CTA
 * on the public /schedule page can deep-link the user straight into payment.
 */

export type CohortStatus = 'open' | 'closed' | 'in_progress' | 'ended';

export interface ICohort extends Document {
  /** Stable URL slug — auto-generated from title on first save. */
  slug: string;

  /** Free-text track name. Shown on cards. */
  program: string;

  /** Display title for the intake (e.g. "Web Dev — Live Cohort · May 2026"). */
  title: string;

  /** ID of the matching Checkout plan ("web-dev-cohort", "uiux-mentor", …). */
  planId: string;

  /** When the cohort kicks off — drives the countdown. */
  startDate: Date;

  /** Optional last date (mostly informational). */
  endDate?: Date;

  /** Human-readable duration label, e.g. "12 weeks". */
  durationLabel?: string;

  /** Full naira price (not kobo) — same units as services.catalog. */
  priceNgn: number;

  /** Hard cap on enrollees for this intake. */
  capacity: number;

  /** Current confirmed enrollees — kept in sync with `students.length` by pre-save. */
  enrolledCount: number;

  /**
   * The actual student userIds enrolled in this intake. Drives certificate
   * issuance — the auto-issuance cron iterates this list when the cohort ends.
   * Populated by admin enrollment endpoints (and, in a future PR, by the
   * Paystack success hook so paid enrollments land here automatically).
   */
  students: mongoose.Types.ObjectId[];

  /** When false, the cohort is hidden from the public schedule. */
  isEnrollmentOpen: boolean;

  /** Optional override; if not set, derived from startDate + endDate + capacity. */
  status?: CohortStatus;

  /** Short paragraph shown on the cohort detail card. */
  description?: string;

  /** Free-text instructor name (we don't FK to User to keep cohorts portable). */
  instructor?: string;

  /** Bullet list shown under the cohort card. */
  highlights?: string[];

  /** Order tiebreaker when two cohorts have the same startDate. */
  order: number;

  createdAt: Date;
  updatedAt: Date;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

const cohortSchema = new Schema<ICohort>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    program: { type: String, required: true, trim: true, maxlength: 120 },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    planId: { type: String, required: true, trim: true, maxlength: 80, index: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date },
    durationLabel: { type: String, trim: true, maxlength: 60 },
    priceNgn: { type: Number, required: true, min: 0 },
    capacity: { type: Number, required: true, min: 1, max: 1000 },
    enrolledCount: { type: Number, default: 0, min: 0 },
    students: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
    isEnrollmentOpen: { type: Boolean, default: true, index: true },
    status: { type: String, enum: ['open', 'closed', 'in_progress', 'ended'] },
    description: { type: String, maxlength: 1000 },
    instructor: { type: String, maxlength: 120 },
    highlights: [{ type: String, maxlength: 200 }],
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Helpful compound index for the most common query: upcoming, public list.
cohortSchema.index({ isEnrollmentOpen: 1, startDate: 1 });

// Auto-generate a unique slug from the title when not supplied.
cohortSchema.pre('validate', async function (next) {
  if (this.slug) return next();
  if (!this.title) return next();

  const base = slugify(this.title) || 'cohort';
  let candidate = base;
  let i = 2;
  const Model = mongoose.model<ICohort>('Cohort');
  // Cap iterations defensively — the unique index is the real guard.
  while (await Model.exists({ slug: candidate, _id: { $ne: this._id } })) {
    candidate = `${base}-${i++}`;
    if (i > 100) break;
  }
  this.slug = candidate;
  next();
});

// Keep enrolledCount in sync with the students[] array, then clamp to capacity.
// Idempotent — repeated saves don't drift.
cohortSchema.pre('save', function (next) {
  if (this.isModified('students')) {
    this.enrolledCount = this.students.length;
  }
  if (this.enrolledCount > this.capacity) this.enrolledCount = this.capacity;
  if (this.enrolledCount < 0) this.enrolledCount = 0;
  next();
});

export default mongoose.model<ICohort>('Cohort', cohortSchema);

/**
 * Derive a status from raw fields. Use this rather than reading
 * `cohort.status` directly so the value is always self-consistent
 * with the current date — even if the admin hasn't manually flipped it.
 */
export function deriveCohortStatus(c: Pick<ICohort, 'startDate' | 'endDate' | 'enrolledCount' | 'capacity' | 'isEnrollmentOpen' | 'status'>): CohortStatus {
  // Manual override wins.
  if (c.status) return c.status;

  const now = Date.now();
  const start = new Date(c.startDate).getTime();
  const end = c.endDate ? new Date(c.endDate).getTime() : null;

  if (end !== null && now > end) return 'ended';
  if (now >= start) return 'in_progress';
  if (!c.isEnrollmentOpen) return 'closed';
  if (c.enrolledCount >= c.capacity) return 'closed';
  return 'open';
}
