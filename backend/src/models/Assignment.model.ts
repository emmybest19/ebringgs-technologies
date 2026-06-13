import mongoose, { Document, Schema } from 'mongoose';

export interface IAssignment extends Document {
  student: mongoose.Types.ObjectId;
  program: string;
  title: string;
  description: string;
  fileUrl?: string;
  fileName?: string;
  status: 'submitted' | 'reviewed';
  feedback?: string;
  grade?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  submittedAt: Date;
}

const assignmentSchema = new Schema<IAssignment>(
  {
    student:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    program:    { type: String, required: true, trim: true },
    title:      { type: String, required: true, trim: true },
    description:{ type: String, default: '' },
    fileUrl:    { type: String },
    fileName:   { type: String },
    status:     { type: String, enum: ['submitted', 'reviewed'], default: 'submitted' },
    feedback:   { type: String },
    grade:      { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    submittedAt:{ type: Date, default: Date.now },
  },
  { timestamps: true },
);

assignmentSchema.index({ student: 1, program: 1 });

export default mongoose.model<IAssignment>('Assignment', assignmentSchema);
