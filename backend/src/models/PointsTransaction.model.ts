import mongoose, { Document, Schema } from 'mongoose';

export type PointsReason =
  | 'assignment_submitted'
  | 'assignment_passed'
  | 'live_session_attended'
  | 'streak_7_days'
  | 'streak_30_days'
  | 'referral_enrolled'
  | 'redemption'
  | 'admin_adjustment';

export interface IPointsTransaction extends Document {
  user: mongoose.Types.ObjectId;
  amount: number; // positive = earned, negative = redeemed
  reason: PointsReason;
  referenceId?: string; // optional link to assignment/session/transaction
  note?: string;
  createdAt: Date;
}

const pointsTransactionSchema = new Schema<IPointsTransaction>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    reason: {
      type: String,
      required: true,
      enum: [
        'assignment_submitted',
        'assignment_passed',
        'live_session_attended',
        'streak_7_days',
        'streak_30_days',
        'referral_enrolled',
        'redemption',
        'admin_adjustment',
      ],
    },
    referenceId: { type: String },
    note: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export default mongoose.model<IPointsTransaction>('PointsTransaction', pointsTransactionSchema);
