import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { askPublic } from '../controllers/siteAssistant.controller';

const router = Router();

// Public-site assistant. No auth required, so the rate limit needs to be
// tighter than the authenticated AI tutor: cap per IP both burst (per
// minute) and daily. Both numbers are deliberately conservative until we
// see real traffic patterns.
const burstLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 8,
  message: { status: 'error', message: 'Slow down a moment, then ask again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const dailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 40,
  message: { status: 'error', message: "You've reached today's free question limit. Try again tomorrow, or reach us on WhatsApp." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/ask', burstLimiter, dailyLimiter, askPublic);

export default router;
