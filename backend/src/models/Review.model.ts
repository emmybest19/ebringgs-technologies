import mongoose, { Document, Schema } from 'mongoose';

export type ReviewTarget = 'program' | 'service' | 'platform';

export interface IReview extends Document {
  user: mongoose.Types.ObjectId;
  rating: number; // 1-5
  title?: string;
  content: string;
  targetType: ReviewTarget;
  targetId?: string; // plan id (e.g. "web-dev-cohort"), service id, or undefined for platform-wide
  targetName?: string; // denormalized for display (e.g. "Web Dev — Cohort")
  isApproved: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, maxlength: 120 },
    content: { type: String, required: true, minlength: 10, maxlength: 1000 },
    targetType: { type: String, enum: ['program', 'service', 'platform'], required: true, index: true },
    targetId: { type: String, index: true },
    targetName: { type: String },
    isApproved: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

// Prevent a user from leaving multiple reviews for the same target
reviewSchema.index(
  { user: 1, targetType: 1, targetId: 1 },
  { unique: true, partialFilterExpression: { targetId: { $exists: true } } },
);

export default mongoose.model<IReview>('Review', reviewSchema);
