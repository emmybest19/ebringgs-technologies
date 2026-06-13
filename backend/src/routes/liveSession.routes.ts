import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import {
  listSessions, getSession, createSession, updateSession, deleteSession,
} from '../controllers/liveSession.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Live Sessions
 *   description: Live class session management
 */

/**
 * @swagger
 * /live-sessions:
 *   get:
 *     summary: List live sessions (optionally filter upcoming only)
 *     tags: [Live Sessions]
 *     parameters:
 *       - in: query
 *         name: upcoming
 *         schema: { type: string, enum: ['true'] }
 *         description: Set to "true" to only return upcoming/live sessions
 *     responses:
 *       200:
 *         description: Array of live sessions
 */
router.get('/', listSessions);

/**
 * @swagger
 * /live-sessions/{id}:
 *   get:
 *     summary: Get a single live session by ID
 *     tags: [Live Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Live session object
 *       404:
 *         description: Session not found
 */
router.get('/:id', getSession);

/**
 * @swagger
 * /live-sessions:
 *   post:
 *     summary: Create a new live session (admin only)
 *     tags: [Live Sessions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, scheduledAt, roomId]
 *             properties:
 *               title: { type: string }
 *               courseTitle: { type: string }
 *               instructor: { type: string }
 *               scheduledAt: { type: string, format: date-time }
 *               durationMinutes: { type: number }
 *               meetingUrl: { type: string }
 *               roomId: { type: string }
 *     responses:
 *       201:
 *         description: Session created
 */
router.post('/', protect, authorize('admin'), createSession);

/**
 * @swagger
 * /live-sessions/{id}:
 *   patch:
 *     summary: Update a live session (admin only)
 *     tags: [Live Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated session
 *       404:
 *         description: Session not found
 */
router.patch('/:id', protect, authorize('admin'), updateSession);

/**
 * @swagger
 * /live-sessions/{id}:
 *   delete:
 *     summary: Delete a live session (admin only)
 *     tags: [Live Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Session deleted
 *       404:
 *         description: Session not found
 */
router.delete('/:id', protect, authorize('admin'), deleteSession);

export default router;
