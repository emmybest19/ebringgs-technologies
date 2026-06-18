import mongoose, { Document, Schema } from 'mongoose';

/**
 * Generic atomic counter — used by the certificate ID generator and any other
 * code that needs a monotonic sequence (e.g. invoice numbers). Each key
 * (e.g. `certificate:WD:2026`) maintains its own running integer.
 *
 * Always increment via `Counter.findOneAndUpdate({ key }, { $inc: { seq: 1 } }, { upsert: true, new: true })`
 * so concurrent writers can't tie.
 */
export interface ICounter extends Document {
  key: string;
  seq: number;
}

const counterSchema = new Schema<ICounter>(
  {
    key: { type: String, required: true, unique: true, index: true },
    seq: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.model<ICounter>('Counter', counterSchema);
