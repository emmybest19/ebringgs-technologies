import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { UserRole } from "../types";

export type AuthProvider = 'local' | 'google' | 'apple';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  avatar?: string;
  bio?: string;
  phone?: string;
  whatsappOptIn?: boolean;
  // Teacher / instructor profile (optional, only meaningful when role === 'teacher')
  title?: string;
  specialties?: string[];
  experience?: string;
  social?: { linkedin?: string; github?: string; website?: string };
  featured?: boolean;
  points: number;
  referralCode: string;
  referredBy?: mongoose.Types.ObjectId;
  referralRewarded: boolean;
  // Client-specific referral reward — pays out as naira credit applied at checkout.
  // Separate from the (student-facing) points system; never overlaps with it.
  referralCreditNaira: number;
  clientReferralCredited: boolean;
  // OAuth
  authProvider: AuthProvider;
  googleId?: string;
  appleId?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Password is only required for local-auth users. OAuth users (Google /
    // Apple) sign in with an ID token and never set a password.
    password: {
      type: String,
      minlength: 8,
      select: false,
      required: function (this: IUser) {
        return this.authProvider === 'local';
      },
    },
    role: {
      type: String,
      enum: ["admin", "teacher", "student", "client"],
      default: "student",
    },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    avatar: { type: String },
    bio: { type: String, maxlength: 500 },
    phone: { type: String, maxlength: 20 },
    whatsappOptIn: { type: Boolean, default: true },
    title: { type: String, maxlength: 120 },
    specialties: [{ type: String, maxlength: 60 }],
    experience: { type: String, maxlength: 60 },
    social: {
      linkedin: { type: String, maxlength: 200 },
      github: { type: String, maxlength: 200 },
      website: { type: String, maxlength: 200 },
    },
    featured: { type: Boolean, default: false, index: true },
    points: { type: Number, default: 0, min: 0 },
    referralCode: { type: String, unique: true, sparse: true, index: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
    referralRewarded: { type: Boolean, default: false },
    referralCreditNaira: { type: Number, default: 0, min: 0 },
    clientReferralCredited: { type: Boolean, default: false },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'apple'],
      default: 'local',
      index: true,
    },
    googleId: { type: String, unique: true, sparse: true, index: true },
    appleId: { type: String, unique: true, sparse: true, index: true },
  },
  { timestamps: true },
);

// Auto-generate a referral code on creation
userSchema.pre('save', function (next) {
  if (!this.referralCode) {
    this.referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  }
  next();
});

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (
  candidate: string,
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model<IUser>("User", userSchema);
