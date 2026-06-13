import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import Voucher from '../models/Voucher.model';
import { AppError } from '../middleware/error.middleware';
import { redeemPoints, awardPoints, pointsToNaira } from '../services/points.service';

const MIN_GIFT_POINTS = 10; // 10 pts = ₦1,000 minimum
const MAX_NOTE_LEN = 200;

function generateCode(): string {
  // Format: GIFT-XXXX-XXXX (12 chars + 2 dashes, ~28 trillion combos)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous I, O, 0, 1
  const part = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `GIFT-${part(4)}-${part(4)}`;
}

// POST /api/vouchers — create a new voucher (deducts points immediately)
export const createVoucher = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { points, note, expiresInDays } = req.body;
    const pointsNum = Math.floor(Number(points));

    if (!pointsNum || pointsNum < MIN_GIFT_POINTS) {
      return next(new AppError(`Minimum gift is ${MIN_GIFT_POINTS} points (₦${pointsToNaira(MIN_GIFT_POINTS).toLocaleString()}).`, 400));
    }

    if (note && typeof note === 'string' && note.length > MAX_NOTE_LEN) {
      return next(new AppError(`Note must be ${MAX_NOTE_LEN} characters or fewer.`, 400));
    }

    // Deduct points first; abort if insufficient
    const deducted = await redeemPoints(
      req.user!.userId,
      pointsNum,
      undefined,
      `Gift voucher (${pointsNum} pts)`,
    );

    if (deducted === 0) {
      return next(new AppError('Insufficient points balance.', 400));
    }

    let code = generateCode();
    // Extremely unlikely collision, but be safe
    while (await Voucher.exists({ code })) {
      code = generateCode();
    }

    const expiresAt = expiresInDays
      ? new Date(Date.now() + Math.min(Number(expiresInDays), 365) * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // default 90 days

    const voucher = await Voucher.create({
      code,
      creator: req.user!.userId,
      points: pointsNum,
      nairaValue: pointsToNaira(pointsNum),
      note: note || undefined,
      expiresAt,
    });

    res.status(201).json({ status: 'success', data: { voucher } });
  } catch (err) { next(err); }
};

// GET /api/vouchers/me — my created vouchers (and redeemed-by-me)
export const getMyVouchers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const created = await Voucher.find({ creator: req.user!.userId })
      .sort({ createdAt: -1 })
      .lean();

    const redeemed = await Voucher.find({ recipient: req.user!.userId })
      .populate('creator', 'name')
      .sort({ redeemedAt: -1 })
      .lean();

    res.json({ status: 'success', data: { created, redeemed } });
  } catch (err) { next(err); }
};

// GET /api/vouchers/lookup/:code — verify a voucher code (used at checkout)
export const lookupVoucher = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const code = String(req.params.code || '').trim().toUpperCase();
    const voucher = await Voucher.findOne({ code });
    if (!voucher) return next(new AppError('Invalid voucher code.', 404));

    // Auto-expire if past expiry date
    if (voucher.expiresAt && voucher.expiresAt < new Date() && voucher.status === 'active') {
      voucher.status = 'expired';
      await voucher.save();
    }

    if (voucher.status !== 'active') {
      return next(new AppError(`This voucher is ${voucher.status}.`, 400));
    }

    if (voucher.creator.toString() === req.user!.userId) {
      return next(new AppError('You cannot redeem your own voucher.', 400));
    }

    res.json({
      status: 'success',
      data: {
        code: voucher.code,
        points: voucher.points,
        nairaValue: voucher.nairaValue,
        note: voucher.note,
        expiresAt: voucher.expiresAt,
      },
    });
  } catch (err) { next(err); }
};

// Internal helper used by paystack.controller — atomically claim a voucher
export async function claimVoucher(code: string, userId: string, paystackRef: string): Promise<{ success: boolean; nairaValue?: number; error?: string }> {
  const upper = code.trim().toUpperCase();
  const voucher = await Voucher.findOneAndUpdate(
    { code: upper, status: 'active', creator: { $ne: userId } },
    { status: 'redeemed', recipient: userId, redeemedAt: new Date(), redeemedOnReference: paystackRef },
    { new: true },
  );

  if (!voucher) return { success: false, error: 'Voucher not available.' };

  // Expiry check after the fact
  if (voucher.expiresAt && voucher.expiresAt < new Date()) {
    voucher.status = 'expired';
    await voucher.save();
    return { success: false, error: 'Voucher has expired.' };
  }

  return { success: true, nairaValue: voucher.nairaValue };
}

// Internal helper to refund a voucher if payment fails
export async function refundVoucher(code: string): Promise<void> {
  const upper = code.trim().toUpperCase();
  const voucher = await Voucher.findOne({ code: upper });
  if (!voucher || voucher.status !== 'redeemed') return;

  voucher.status = 'active';
  voucher.recipient = undefined;
  voucher.redeemedAt = undefined;
  voucher.redeemedOnReference = undefined;
  await voucher.save();
}

// DELETE /api/vouchers/:id — cancel an unredeemed voucher (refund points to creator)
export const cancelVoucher = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const voucher = await Voucher.findOne({ _id: req.params.id, creator: req.user!.userId });
    if (!voucher) return next(new AppError('Voucher not found.', 404));
    if (voucher.status !== 'active') return next(new AppError('Only active vouchers can be cancelled.', 400));

    voucher.status = 'expired';
    await voucher.save();

    // Refund the points to creator
    await awardPoints({
      userId: req.user!.userId,
      reason: 'admin_adjustment',
      amount: voucher.points,
      referenceId: `cancel:${voucher._id}`,
      note: `Refund for cancelled voucher ${voucher.code}`,
    });

    res.json({ status: 'success', message: 'Voucher cancelled and points refunded.' });
  } catch (err) { next(err); }
};

// Standalone request type for routes that don't need AuthRequest
export type _RequestUnused = Request;
