import mongoose, { Document, Schema } from 'mongoose';

export type ProjectStatus =
  | 'awaiting_brief'
  | 'pending'
  | 'in_progress'
  | 'review'
  | 'completed'
  | 'cancelled';

export interface IProject extends Document {
  client: mongoose.Types.ObjectId;
  serviceId: string;
  serviceName: string;
  title: string;
  description: string;
  status: ProjectStatus;
  progress: number; // 0-100
  githubRepo?: string;
  liveUrl?: string;
  deliverables: { name: string; url: string; uploadedAt: Date }[];
  timeline?: { milestone: string; dueDate?: Date; completed: boolean }[];
  totalCost: number; // in kobo (Paystack uses kobo)
  isPaid: boolean;
  paystackReference?: string;
  startDate?: Date;
  estimatedEndDate?: Date;
  completedAt?: Date;
  notes?: string;
  // Productized service flow
  brief?: Record<string, unknown>;
  briefSubmittedAt?: Date;
  source?: 'self_serve' | 'inquiry';
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    client: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    serviceId: { type: String, required: true },
    serviceName: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['awaiting_brief', 'pending', 'in_progress', 'review', 'completed', 'cancelled'],
      default: 'pending',
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    githubRepo: { type: String, trim: true },
    liveUrl: { type: String, trim: true },
    deliverables: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    timeline: [
      {
        milestone: { type: String, required: true },
        dueDate: { type: Date },
        completed: { type: Boolean, default: false },
      },
    ],
    totalCost: { type: Number, required: true },
    isPaid: { type: Boolean, default: false },
    paystackReference: { type: String, index: true },
    startDate: { type: Date },
    estimatedEndDate: { type: Date },
    completedAt: { type: Date },
    notes: { type: String },
    brief: { type: Schema.Types.Mixed },
    briefSubmittedAt: { type: Date },
    source: { type: String, enum: ['self_serve', 'inquiry'], default: 'inquiry' },
  },
  { timestamps: true }
);

export default mongoose.model<IProject>('Project', projectSchema);
