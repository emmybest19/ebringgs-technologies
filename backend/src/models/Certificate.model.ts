import mongoose, { Document, Schema } from 'mongoose';

/**
 * A Certificate is the persisted, verifiable record that a student completed
 * a specific cohort. Fields are deliberately **snapshotted** at issuance time —
 * if the student renames themselves, or the cohort's instructor field is
 * edited, the certificate is unaffected. The whole point of a credential is
 * that it asserts what was true on `completedAt`.
 *
 * Verification is via the public endpoint `/api/certificates/verify/:certificateId`,
 * which the printed cert advertises in fine print at the bottom.
 */
export interface ICertificate extends Document {
  certificateId: string;
  student: mongoose.Types.ObjectId;
  studentName: string;
  /** Cohort the cert was earned from. Used for dedup — one cert per {student, cohort}. */
  cohort?: mongoose.Types.ObjectId;
  program: string;
  instructor: string;
  completedAt: Date;
  /** When the cert was actually created (may differ from completedAt for backfills). */
  issuedAt: Date;
  isValid: boolean;
  /** Why the cert was revoked, if isValid is false. */
  revokedReason?: string;
}

const certificateSchema = new Schema<ICertificate>(
  {
    certificateId: { type: String, required: true, unique: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentName: { type: String, required: true },
    cohort: { type: Schema.Types.ObjectId, ref: 'Cohort', index: true },
    program: { type: String, required: true },
    instructor: { type: String, required: true },
    completedAt: { type: Date, required: true },
    issuedAt: { type: Date, default: Date.now },
    isValid: { type: Boolean, default: true },
    revokedReason: { type: String, maxlength: 500 },
  },
  { timestamps: true },
);

// One cert per (student, cohort). Lets us call create() inside the auto-issuance
// cron without an existence check — the unique index makes it idempotent.
certificateSchema.index(
  { student: 1, cohort: 1 },
  { unique: true, partialFilterExpression: { cohort: { $exists: true } } },
);

export default mongoose.model<ICertificate>('Certificate', certificateSchema);
