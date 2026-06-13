import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  user: mongoose.Types.ObjectId;
  stripePaymentIntentId: string;
  stripeCustomerId?: string;
  amount: number; // in cents
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  type: 'one_time' | 'subscription' | 'installment';
  description: string;
  metadata?: Record<string, string>;
  /** Back-reference when this transaction is one slice of a PaymentPlan. */
  paymentPlanId?: mongoose.Types.ObjectId;
  /** 1-based position of this slice in the plan (1, 2, or 3). */
  installmentNumber?: number;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stripePaymentIntentId: { type: String, required: true, unique: true },
    stripeCustomerId: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'usd' },
    status: { type: String, enum: ['pending', 'succeeded', 'failed', 'refunded'], default: 'pending' },
    type: { type: String, enum: ['one_time', 'subscription', 'installment'], required: true },
    description: { type: String, required: true },
    metadata: { type: Map, of: String },
    paymentPlanId: { type: Schema.Types.ObjectId, ref: 'PaymentPlan', index: true },
    installmentNumber: { type: Number, min: 1, max: 3 },
  },
  { timestamps: true }
);

export default mongoose.model<ITransaction>('Transaction', transactionSchema);
