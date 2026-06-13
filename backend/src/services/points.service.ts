import User from '../models/User.model';
import PointsTransaction, { PointsReason } from '../models/PointsTransaction.model';

// 1 point = ₦100 discount
export const POINT_TO_NAIRA = 100;

// Single source of truth for how many points each action awards
export const POINT_VALUES: Record<Exclude<PointsReason, 'redemption' | 'admin_adjustment'>, number> = {
  assignment_submitted: 10,
  assignment_passed: 8,
  live_session_attended: 5,
  streak_7_days: 20,
  streak_30_days: 50,
  referral_enrolled: 50,
};

export interface AwardOptions {
  userId: string;
  reason: PointsReason;
  amount?: number; // optional override; defaults to POINT_VALUES[reason]
  referenceId?: string;
  note?: string;
}

/**
 * Award points to a user. Idempotent when `referenceId` is provided —
 * the same (user, reason, referenceId) tuple won't be awarded twice.
 */
export async function awardPoints({ userId, reason, amount, referenceId, note }: AwardOptions): Promise<number> {
  const value = amount ?? POINT_VALUES[reason as keyof typeof POINT_VALUES];
  if (!value || value <= 0) return 0;

  // Idempotency check
  if (referenceId) {
    const existing = await PointsTransaction.findOne({ user: userId, reason, referenceId });
    if (existing) return 0;
  }

  await PointsTransaction.create({ user: userId, amount: value, reason, referenceId, note });
  await User.findByIdAndUpdate(userId, { $inc: { points: value } });
  return value;
}

/**
 * Redeem points (deduct). Returns the amount actually redeemed (0 if insufficient).
 */
export async function redeemPoints(userId: string, points: number, referenceId?: string, note?: string): Promise<number> {
  if (points <= 0) return 0;

  const user = await User.findById(userId);
  if (!user || user.points < points) return 0;

  await User.findByIdAndUpdate(userId, { $inc: { points: -points } });
  await PointsTransaction.create({
    user: userId,
    amount: -points,
    reason: 'redemption',
    referenceId,
    note,
  });
  return points;
}

export async function getBalance(userId: string): Promise<number> {
  const user = await User.findById(userId).select('points');
  return user?.points ?? 0;
}

export function pointsToNaira(points: number): number {
  return points * POINT_TO_NAIRA;
}

export function nairaToPoints(naira: number): number {
  return Math.floor(naira / POINT_TO_NAIRA);
}
