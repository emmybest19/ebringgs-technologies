import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import PushSubscription from '../models/PushSubscription.model';

/**
 * POST /api/push/subscribe
 * Save a push subscription for the authenticated user.
 */
export const subscribe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      res.status(400).json({ message: 'Invalid subscription object.' });
      return;
    }

    // Upsert: update if same endpoint exists, otherwise create
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { userId: req.user!.userId, endpoint, keys },
      { upsert: true, new: true },
    );

    res.status(201).json({ message: 'Push subscription saved.' });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/push/unsubscribe
 * Remove a push subscription for the authenticated user.
 */
export const unsubscribe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      res.status(400).json({ message: 'Endpoint is required.' });
      return;
    }

    await PushSubscription.findOneAndDelete({ endpoint, userId: req.user!.userId });
    res.json({ message: 'Push subscription removed.' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/push/vapid-key
 * Return the public VAPID key so the frontend can subscribe.
 */
export const getVapidKey = (_req: AuthRequest, res: Response): void => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
};
