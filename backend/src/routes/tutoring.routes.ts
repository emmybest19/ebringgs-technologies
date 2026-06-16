import { Router } from 'express';
import { listTutoring, getTutoring } from '../controllers/tutoring.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Tutoring
 *   description: Student-facing tutoring catalog — cohorts + 1-on-1 mentorship across Software Dev, Mobile, Data Analysis, Research Writing, and UI/UX
 */

/**
 * @swagger
 * /tutoring:
 *   get:
 *     summary: List all tutoring tracks
 *     description: Pass `?grouped=true` for the category-grouped structure used by the student dashboard.
 *     tags: [Tutoring]
 *     parameters:
 *       - in: query
 *         name: grouped
 *         schema: { type: string, enum: ['true'] }
 *     responses:
 *       200: { description: Tracks (flat) or groups (grouped=true) }
 */
router.get('/', listTutoring);

/**
 * @swagger
 * /tutoring/{id}:
 *   get:
 *     summary: Get one tutoring track by ID
 *     tags: [Tutoring]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Tutoring track }
 *       404: { description: Not found }
 */
router.get('/:id', getTutoring);

export default router;
