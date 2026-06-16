import { Router } from 'express';
import { getPublicStats } from '../controllers/public.controller';

/**
 * Unauthenticated routes for content shown on the marketing site (landing
 * page stats strip, future "wall of work" page, etc.). The /api rate limiter
 * mounted in `app.ts` still applies — these aren't a backdoor.
 */
const router = Router();

router.get('/stats', getPublicStats);

export default router;
