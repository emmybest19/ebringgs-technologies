import mongoose, { Document, Schema } from 'mongoose';

export type UpdateType = 'progress' | 'commit' | 'deploy' | 'note' | 'milestone' | 'attachment';

export interface IProjectUpdate extends Document {
  project: mongoose.Types.ObjectId;
  // Optional — system-generated entries (e.g. GitHub commit poller) have no human author.
  author?: mongoose.Types.ObjectId;
  type: UpdateType;
  title: string;
  message?: string;
  url?: string;
  progressChange?: number; // new progress value (0-100) if applicable
  // Free-form per-type extras. Currently used by `commit` entries to carry
  // `{ avatarUrl, sha }` from GitHub so the timeline can render an avatar.
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const projectUpdateSchema = new Schema<IProjectUpdate>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: ['progress', 'commit', 'deploy', 'note', 'milestone', 'attachment'],
      required: true,
    },
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, maxlength: 2000 },
    url: { type: String, maxlength: 500 },
    progressChange: { type: Number, min: 0, max: 100 },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export default mongoose.model<IProjectUpdate>('ProjectUpdate', projectUpdateSchema);
