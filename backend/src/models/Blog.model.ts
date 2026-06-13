import mongoose, { Document, Schema } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: mongoose.Types.ObjectId;
  thumbnail?: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  publishedAt?: Date;
  seoTitle?: string;
  seoDescription?: string;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const blogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    content: { type: String, required: true },
    excerpt: { type: String, required: true, maxlength: 300 },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    thumbnail: { type: String },
    category: { type: String, required: true },
    tags: [{ type: String }],
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
    seoTitle: { type: String },
    seoDescription: { type: String },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

blogSchema.index({ title: 'text', content: 'text', tags: 'text' });

export default mongoose.model<IBlog>('Blog', blogSchema);
