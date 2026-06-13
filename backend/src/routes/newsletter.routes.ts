import { Router, Request, Response, NextFunction } from 'express';
import Newsletter from '../models/Newsletter.model';

const router = Router();

router.post('/subscribe', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ status: 'error', message: 'Valid email is required.' });
    }
    const existing = await Newsletter.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.json({ status: 'success', message: 'You are already subscribed!' });
    }
    await Newsletter.create({ email });
    res.status(201).json({ status: 'success', message: 'Subscribed successfully!' });
  } catch (err) { next(err); }
});

export default router;
