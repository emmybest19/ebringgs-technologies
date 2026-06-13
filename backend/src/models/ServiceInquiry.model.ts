import mongoose, { Document, Schema } from 'mongoose';

export interface IServiceInquiry extends Document {
  name: string;
  email: string;
  user?: mongoose.Types.ObjectId; // set if submitted by an authenticated client
  serviceId?: string;
  serviceName?: string;
  goals?: string;
  budgetRange?: string;
  timeline?: string;
  referenceLinks?: string[];
  message: string;
  status: 'new' | 'contacted' | 'quoted' | 'closed';
  convertedProject?: mongoose.Types.ObjectId; // set after admin converts to a Project
  createdAt: Date;
  updatedAt: Date;
}

const serviceInquirySchema = new Schema<IServiceInquiry>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    serviceId: { type: String },
    serviceName: { type: String },
    goals: { type: String, maxlength: 1000 },
    budgetRange: { type: String, maxlength: 80 },
    timeline: { type: String, maxlength: 80 },
    referenceLinks: [{ type: String, maxlength: 500 }],
    message: { type: String, required: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ['new', 'contacted', 'quoted', 'closed'],
      default: 'new',
      index: true,
    },
    convertedProject: { type: Schema.Types.ObjectId, ref: 'Project' },
  },
  { timestamps: true }
);

export default mongoose.model<IServiceInquiry>('ServiceInquiry', serviceInquirySchema);
