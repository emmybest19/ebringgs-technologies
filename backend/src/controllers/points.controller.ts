import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import User from '../models/User.model';
import PointsTransaction from '../models/PointsTransaction.model';
import { POINT_TO_NAIRA, pointsToNaira } from '../services/points.service';

// GET /api/points/me
export const getMyPoints = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.userId).select('points referralCode');
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

    const history = await PointsTransaction.find({ user: req.user!.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({
      status: 'success',
      data: {
        points: user.points,
        nairaValue: pointsToNaira(user.points),
        conversionRate: POINT_TO_NAIRA,
        referralCode: user.referralCode,
        history,
      },
    });
  } catch (err) { next(err); }
};

// GET /api/points/leaderboard
export const getLeaderboard = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const top = await User.find({ role: 'student', points: { $gt: 0 } })
      .select('name avatar points')
      .sort({ points: -1 })
      .limit(20)
      .lean();

    const leaderboard = top.map((u, i) => ({
      rank: i + 1,
      id: u._id,
      name: u.name,
      avatar: (u as { avatar?: string }).avatar,
      initials: u.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase(),
      points: u.points,
      nairaValue: pointsToNaira(u.points),
    }));

    res.json({ status: 'success', data: { leaderboard, conversionRate: POINT_TO_NAIRA } });
  } catch (err) { next(err); }
};
