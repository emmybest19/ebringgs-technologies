import mongoose, { Document, Schema } from 'mongoose';

export type VoucherStatus = 'active' | 'redeemed' | 'expired';

export interface IVoucher extends Document {
  code: string;
  creator: mongoose.Types.ObjectId;
  recipient?: mongoose.Types.ObjectId;
  points: number;
  nairaValue: number;
  status: VoucherStatus;
  note?: string;
  expiresAt?: Date;
  redeemedAt?: Date;
  redeemedOnReference?: string; // paystack tx reference if redeemed
  createdAt: Date;
  updatedAt: Date;
}

const voucherSchema = new Schema<IVoucher>(
  {
    code: { type: String, required: true, unique: true, index: true },
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User' },
    points: { type: Number, required: true, min: 1 },
    nairaValue: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['active', 'redeemed', 'expired'], default: 'active', index: true },
    note: { type: String, maxlength: 200 },
    expiresAt: { type: Date },
    redeemedAt: { type: Date },
    redeemedOnReference: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model<IVoucher>('Voucher', voucherSchema);
