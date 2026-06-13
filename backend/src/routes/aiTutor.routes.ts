import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { protect } from '../middleware/auth.middleware';
import { ask, getQuota } from '../controllers/aiTutor.controller';

const router = Router();

// Hard cap per IP to protect against runaway costs even before user-level limit kicks in
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { status: 'error', message: 'Too many AI requests. Slow down a bit.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/quota', protect, getQuota);
router.post('/ask', protect, aiLimiter, ask);

export default router;
