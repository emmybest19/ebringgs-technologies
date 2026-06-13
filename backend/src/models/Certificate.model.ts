import mongoose, { Document, Schema } from 'mongoose';

export interface ICertificate extends Document {
  certificateId: string;
  student: mongoose.Types.ObjectId;
  studentName: string;
  program: string;
  instructor: string;
  completedAt: Date;
  isValid: boolean;
}

const certificateSchema = new Schema<ICertificate>(
  {
    certificateId: { type: String, required: true, unique: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true },
    program: { type: String, required: true },
    instructor: { type: String, required: true },
    completedAt: { type: Date, required: true },
    isValid: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model<ICertificate>('Certificate', certificateSchema);
