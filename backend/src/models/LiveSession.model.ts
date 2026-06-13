import mongoose, { Document, Schema } from 'mongoose';

export interface ILiveSession extends Document {
  title: string;
  courseTitle?: string;
  instructor: string;
  scheduledAt: Date;
  durationMinutes: number;
  meetingUrl: string;
  roomId: string;
  status: 'upcoming' | 'live' | 'ended';
  enrolledCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const liveSessionSchema = new Schema<ILiveSession>(
  {
    title: { type: String, required: true, trim: true },
    courseTitle: { type: String, trim: true },
    instructor: { type: String, required: true, trim: true },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, default: 60 },
    meetingUrl: { type: String, default: '' },
    roomId: { type: String, required: true },
    status: {
      type: String,
      enum: ['upcoming', 'live', 'ended'],
      default: 'upcoming',
    },
    enrolledCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

liveSessionSchema.index({ scheduledAt: 1 });
liveSessionSchema.index({ status: 1 });

export default mongoose.model<ILiveSession>('LiveSession', liveSessionSchema);
