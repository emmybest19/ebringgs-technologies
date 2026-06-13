import { Router } from 'express';
import { subscribe, unsubscribe, getVapidKey } from '../controllers/push.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Push Notifications
 *   description: Web push subscription management
 */

/**
 * @swagger
 * /push/vapid-key:
 *   get:
 *     summary: Get the public VAPID key for push subscription
 *     tags: [Push Notifications]
 *     security: []
 *     responses:
 *       200:
 *         description: Returns the VAPID public key
 */
router.get('/vapid-key', getVapidKey);

/**
 * @swagger
 * /push/subscribe:
 *   post:
 *     summary: Save a push subscription for the authenticated user
 *     tags: [Push Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [endpoint, keys]
 *             properties:
 *               endpoint: { type: string }
 *               keys:
 *                 type: object
 *                 properties:
 *                   p256dh: { type: string }
 *                   auth: { type: string }
 *     responses:
 *       201:
 *         description: Subscription saved
 *       400:
 *         description: Invalid subscription object
 */
router.post('/subscribe', protect, subscribe);

/**
 * @swagger
 * /push/unsubscribe:
 *   delete:
 *     summary: Remove a push subscription
 *     tags: [Push Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [endpoint]
 *             properties:
 *               endpoint: { type: string }
 *     responses:
 *       200:
 *         description: Subscription removed
 */
router.delete('/unsubscribe', protect, unsubscribe);

export default router;
