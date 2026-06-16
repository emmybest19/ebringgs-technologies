import { Request, Response, NextFunction } from 'express';
import Project from '../models/Project.model';
import ProjectUpdate from '../models/ProjectUpdate.model';
import Transaction from '../models/Transaction.model';
import User from '../models/User.model';

/**
 * Public homepage "wall of work" stats — aggregate counts shown unauthenticated
 * on the landing page. Every figure comes from real production data; if any
 * aggregation fails we still return the others (zeros), never throw, so the
 * homepage never breaks on a bad query.
 *
 * Cached in-memory for 5 minutes — the same constants are shown to every
 * visitor and the underlying counts change on the order of hours, not seconds.
 * If you ever need per-process cache invalidation, call `clearPublicStatsCache()`
 * after a relevant write.
 */

export interface PublicStats {
  projectsInFlight: number;
  projectsDelivered: number;
  commitsThisWeek: number;
  studentsTrained: number;
  nairaDelivered: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cache: { data: PublicStats; expiresAt: number } | null = null;

export function clearPublicStatsCache(): void {
  cache = null;
}

async function computeStats(): Promise<PublicStats> {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Run all aggregations in parallel. `Promise.allSettled` so one failing
  // query doesn't take down the whole response.
  const [
    inFlight,
    delivered,
    commits,
    students,
    revenueAgg,
  ] = await Promise.allSettled([
    Project.countDocuments({ status: { $in: ['awaiting_brief', 'in_progress', 'review'] } }),
    Project.countDocuments({ status: 'completed' }),
    ProjectUpdate.countDocuments({ type: 'commit', createdAt: { $gte: oneWeekAgo } }),
    User.countDocuments({ role: 'student' }),
    Transaction.aggregate<{ _id: null; total: number }>([
      { $match: { status: 'succeeded' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const settled = <T>(r: PromiseSettledResult<T>, fallback: T): T =>
    r.status === 'fulfilled' ? r.value : fallback;

  const revenue = settled(revenueAgg, []);
  const totalKobo = revenue[0]?.total ?? 0;

  return {
    projectsInFlight: settled(inFlight, 0),
    projectsDelivered: settled(delivered, 0),
    commitsThisWeek: settled(commits, 0),
    studentsTrained: settled(students, 0),
    nairaDelivered: Math.floor(totalKobo / 100), // kobo → naira
  };
}

export const getPublicStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = Date.now();
    if (cache && cache.expiresAt > now) {
      res.json({ status: 'success', data: cache.data, cached: true });
      return;
    }
    const data = await computeStats();
    cache = { data, expiresAt: now + CACHE_TTL_MS };
    res.json({ status: 'success', data, cached: false });
  } catch (err) {
    next(err);
  }
};
