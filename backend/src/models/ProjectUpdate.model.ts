import mongoose, { Document, Schema } from 'mongoose';

export type UpdateType = 'progress' | 'commit' | 'deploy' | 'note' | 'milestone' | 'attachment';

export interface IProjectUpdate extends Document {
  project: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  type: UpdateType;
  title: string;
  message?: string;
  url?: string;
  progressChange?: number; // new progress value (0-100) if applicable
  createdAt: Date;
}

const projectUpdateSchema = new Schema<IProjectUpdate>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['progress', 'commit', 'deploy', 'note', 'milestone', 'attachment'],
      required: true,
    },
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, maxlength: 2000 },
    url: { type: String, maxlength: 500 },
    progressChange: { type: Number, min: 0, max: 100 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export default mongoose.model<IProjectUpdate>('ProjectUpdate', projectUpdateSchema);
