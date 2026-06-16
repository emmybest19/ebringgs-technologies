import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import {
  tutoringCatalog,
  getTutoringTrack,
  groupedTutoringCatalog,
  isTutoringInstallmentEligible,
  TutoringTrack,
} from '../config/tutoring.catalog';

function decorate(track: TutoringTrack) {
  return { ...track, installmentEligible: isTutoringInstallmentEligible(track) };
}

/**
 * GET /api/tutoring — flat list of every tutoring track (cohort + mentorship)
 * across all categories. Use `?grouped=true` to receive a category-grouped
 * structure shaped for the student dashboard's sections.
 */
export const listTutoring = (req: Request, res: Response) => {
  if (req.query.grouped === 'true') {
    const grouped = groupedTutoringCatalog().map((g) => ({
      ...g,
      tracks: g.tracks.map(decorate),
    }));
    return res.json({ status: 'success', data: { groups: grouped } });
  }
  res.json({ status: 'success', data: { tracks: tutoringCatalog.map(decorate) } });
};

/**
 * GET /api/tutoring/:id — single track for the detail page.
 * IDs match planDetails in frontend/src/pages/Checkout.tsx (e.g.
 * "frontend-cohort", "uiux-mentor") so the checkout flow is unified.
 */
export const getTutoring = (req: Request, res: Response, next: NextFunction) => {
  const track = getTutoringTrack(req.params.id);
  if (!track) return next(new AppError('Tutoring track not found.', 404));
  res.json({ status: 'success', data: { track: decorate(track) } });
};
