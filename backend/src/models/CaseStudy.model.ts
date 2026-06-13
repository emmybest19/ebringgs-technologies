import mongoose, { Document, Schema } from 'mongoose';

export type CaseStudyType = 'client_work' | 'student_project';

export interface ICaseStudy extends Document {
  type: CaseStudyType;
  title: string;
  slug: string;
  summary: string;          // ~1-2 sentence pitch
  description?: string;     // longer markdown body
  coverImage?: string;
  gallery?: string[];
  category?: string;        // e.g. "Web Development", "Mobile Development"
  tags?: string[];
  techStack?: string[];

  // Client work fields
  serviceId?: string;       // ID from servicesCatalog (e.g. "1", "11", "13")
  clientName?: string;
  clientLogo?: string;
  results?: string[];       // bullet outcomes ("3x conversion lift", "Launched in 14 days")
  deliveryDays?: number;
  priceKobo?: number;       // optional — admin can hide

  // Student project fields
  studentName?: string;
  studentAvatar?: string;
  studentRole?: string;          // e.g. "Software Engineer at FinTech Co."
  studentBio?: string;           // short bio shown on the portfolio detail page
  cohortBatch?: string;

  // Shared
  liveUrl?: string;
  githubUrl?: string;
  testimonial?: {
    quote: string;
    name: string;
    title?: string;
    avatar?: string;
  };

  featured: boolean;
  published: boolean;
  order: number;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

const caseStudySchema = new Schema<ICaseStudy>(
  {
    type: { type: String, enum: ['client_work', 'student_project'], required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    summary: { type: String, required: true, maxlength: 400 },
    description: { type: String, maxlength: 8000 },
    coverImage: { type: String },
    gallery: [{ type: String }],
    category: { type: String, maxlength: 80, index: true },
    tags: [{ type: String, maxlength: 40 }],
    techStack: [{ type: String, maxlength: 40 }],

    serviceId: { type: String, index: true },
    clientName: { type: String, maxlength: 120 },
    clientLogo: { type: String },
    results: [{ type: String, maxlength: 200 }],
    deliveryDays: { type: Number, min: 1, max: 365 },
    priceKobo: { type: Number, min: 0 },

    studentName: { type: String, maxlength: 120 },
    studentAvatar: { type: String },
    studentRole: { type: String, maxlength: 200 },
    studentBio: { type: String, maxlength: 600 },
    cohortBatch: { type: String, maxlength: 120 },

    liveUrl: { type: String, maxlength: 500 },
    githubUrl: { type: String, maxlength: 500 },
    testimonial: {
      quote: { type: String, maxlength: 1000 },
      name: { type: String, maxlength: 120 },
      title: { type: String, maxlength: 200 },
      avatar: { type: String },
    },

    featured: { type: Boolean, default: false, index: true },
    published: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

caseStudySchema.pre('validate', async function (next) {
  if (!this.slug && this.title) {
    let base = slugify(this.title) || 'case-study';
    let candidate = base;
    let i = 2;
    const Model = mongoose.model<ICaseStudy>('CaseStudy');
    // eslint-disable-next-line no-await-in-loop
    while (await Model.exists({ slug: candidate, _id: { $ne: this._id } })) {
      candidate = `${base}-${i++}`;
      if (i > 100) break;
    }
    this.slug = candidate;
  }
  next();
});

export default mongoose.model<ICaseStudy>('CaseStudy', caseStudySchema);
