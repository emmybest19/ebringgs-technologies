import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getMyPoints, getLeaderboard } from '../controllers/points.controller';

const router = Router();

router.get('/me', protect, getMyPoints);
router.get('/leaderboard', protect, getLeaderboard);

export default router;
