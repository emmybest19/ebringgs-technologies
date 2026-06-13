import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import Review from '../models/Review.model';
import { AppError } from '../middleware/error.middleware';

// POST /api/reviews — auth'd user submits a review
export const submitReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { rating, title, content, targetType, targetId, targetName } = req.body;

    if (!rating || !content || !targetType) {
      return next(new AppError('rating, content, and targetType are required.', 400));
    }
    if (rating < 1 || rating > 5) {
      return next(new AppError('Rating must be between 1 and 5.', 400));
    }

    try {
      const review = await Review.create({
        user: req.user!.userId,
        rating,
        title,
        content,
        targetType,
        targetId,
        targetName,
        isApproved: false, // moderation-first
      });
      res.status(201).json({ status: 'success', data: { review } });
    } catch (err: unknown) {
      if ((err as { code?: number })?.code === 11000) {
        return next(new AppError('You have already reviewed this.', 409));
      }
      throw err;
    }
  } catch (err) { next(err); }
};

// GET /api/reviews — public, returns approved reviews
export const listReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetType, targetId, featured, limit } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = { isApproved: true };
    if (targetType) filter.targetType = targetType;
    if (targetId) filter.targetId = targetId;
    if (featured === 'true') filter.isFeatured = true;

    const reviews = await Review.find(filter)
      .populate('user', 'name avatar role')
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(Math.min(Number(limit) || 50, 100))
      .lean();

    // Aggregate stats for the filter
    const stats = await Review.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          avg: { $avg: '$rating' },
          count: { $sum: 1 },
          breakdown: { $push: '$rating' },
        },
      },
    ]);

    const counts = [0, 0, 0, 0, 0];
    if (stats[0]?.breakdown) {
      stats[0].breakdown.forEach((r: number) => { counts[r - 1]++; });
    }

    res.json({
      status: 'success',
      data: {
        reviews,
        stats: {
          average: stats[0]?.avg ?? 0,
          count: stats[0]?.count ?? 0,
          breakdown: { 5: counts[4], 4: counts[3], 3: counts[2], 2: counts[1], 1: counts[0] },
        },
      },
    });
  } catch (err) { next(err); }
};

// GET /api/reviews/me — auth'd user's own reviews
export const getMyReviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reviews = await Review.find({ user: req.user!.userId }).sort({ createdAt: -1 }).lean();
    res.json({ status: 'success', data: { reviews } });
  } catch (err) { next(err); }
};

// PATCH /api/reviews/:id — edit own review
export const updateMyReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { rating, title, content } = req.body;
    const review = await Review.findOne({ _id: req.params.id, user: req.user!.userId });
    if (!review) return next(new AppError('Review not found.', 404));

    if (rating !== undefined) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (content !== undefined) review.content = content;
    review.isApproved = false; // re-moderate after edit
    await review.save();

    res.json({ status: 'success', data: { review } });
  } catch (err) { next(err); }
};

// DELETE /api/reviews/:id — delete own review
export const deleteMyReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await Review.deleteOne({ _id: req.params.id, user: req.user!.userId });
    if (result.deletedCount === 0) return next(new AppError('Review not found.', 404));
    res.json({ status: 'success' });
  } catch (err) { next(err); }
};

// ─── Admin ──────────────────────────────────────────────────────────────────

// GET /api/reviews/admin — admin only, all reviews including pending
export const listAllReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};
    if (status === 'pending') filter.isApproved = false;
    if (status === 'approved') filter.isApproved = true;

    const reviews = await Review.find(filter)
      .populate('user', 'name email avatar role')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ status: 'success', data: { reviews } });
  } catch (err) { next(err); }
};

// PATCH /api/reviews/:id/approve — admin toggle approval
export const setApproval = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isApproved } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved: !!isApproved },
      { new: true },
    );
    if (!review) return next(new AppError('Review not found.', 404));
    res.json({ status: 'success', data: { review } });
  } catch (err) { next(err); }
};

// PATCH /api/reviews/:id/feature — admin toggle featured
export const setFeatured = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isFeatured } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isFeatured: !!isFeatured },
      { new: true },
    );
    if (!review) return next(new AppError('Review not found.', 404));
    res.json({ status: 'success', data: { review } });
  } catch (err) { next(err); }
};

// DELETE /api/reviews/admin/:id — admin delete any review
export const adminDeleteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await Review.findByIdAndDelete(req.params.id);
    if (!result) return next(new AppError('Review not found.', 404));
    res.json({ status: 'success' });
  } catch (err) { next(err); }
};
