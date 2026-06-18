import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import {
  listPublic, getPublic, getNext, getMyNext, listAll, create, update, remove,
  listStudents, enrollStudent, unenrollStudent,
} from '../controllers/cohort.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Cohorts
 *   description: Public cohort intakes (start dates) + admin management
 */

/**
 * @swagger
 * /cohorts:
 *   get:
 *     summary: List public cohorts
 *     tags: [Cohorts]
 *     parameters:
 *       - in: query
 *         name: upcoming
 *         schema: { type: string, enum: ['true'] }
 *       - in: query
 *         name: program
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 50 }
 *     responses:
 *       200: { description: Array of cohorts (sorted by startDate ASC) }
 */
router.get('/', listPublic);

/**
 * @swagger
 * /cohorts/next:
 *   get:
 *     summary: Get the single soonest upcoming cohort (for the countdown)
 *     tags: [Cohorts]
 *     responses:
 *       200: { description: Cohort or null }
 */
router.get('/next', getNext);

/**
 * @swagger
 * /cohorts/my-next:
 *   get:
 *     summary: Get the caller's next cohort + countdown source date
 *     description: Returns `{ cohort, eligible, isPlaceholder }`. Eligible only for users who bought a cohort plan. Falls back to `today + 2 months` when no admin-created Cohort exists yet.
 *     tags: [Cohorts]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200: { description: Cohort or null }
 *       401: { description: Unauthenticated }
 */
router.get('/my-next', protect, getMyNext);

/**
 * @swagger
 * /cohorts/admin/all:
 *   get:
 *     summary: Admin — list every cohort including closed/ended
 *     tags: [Cohorts]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       200: { description: Array of cohorts }
 *       403: { description: Forbidden }
 */
router.get('/admin/all', protect, authorize('admin'), listAll);

/**
 * @swagger
 * /cohorts/{slug}:
 *   get:
 *     summary: Get a single public cohort by slug
 *     tags: [Cohorts]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Cohort }
 *       404: { description: Cohort not found }
 */
router.get('/:slug', getPublic);

/**
 * @swagger
 * /cohorts:
 *   post:
 *     summary: Create a cohort (admin only)
 *     tags: [Cohorts]
 *     security: [ { bearerAuth: [] } ]
 *     responses:
 *       201: { description: Created }
 *       400: { description: Validation error }
 */
router.post('/', protect, authorize('admin'), create);

/**
 * @swagger
 * /cohorts/{id}:
 *   patch:
 *     summary: Update a cohort (admin only)
 *     tags: [Cohorts]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Updated }
 *       404: { description: Not found }
 */
router.patch('/:id', protect, authorize('admin'), update);

/**
 * @swagger
 * /cohorts/{id}:
 *   delete:
 *     summary: Delete a cohort (admin only)
 *     tags: [Cohorts]
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deleted }
 *       404: { description: Not found }
 */
router.delete('/:id', protect, authorize('admin'), remove);

/**
 * @swagger
 * /cohorts/{id}/students:
 *   get:
 *     summary: List students enrolled in a cohort (admin)
 *     tags: [Cohorts]
 *     security: [ { bearerAuth: [] } ]
 *   post:
 *     summary: Enroll a student in a cohort (admin)
 *     tags: [Cohorts]
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId]
 *             properties:
 *               studentId: { type: string }
 */
router.get('/:id/students', protect, authorize('admin'), listStudents);
router.post('/:id/students', protect, authorize('admin'), enrollStudent);

/**
 * @swagger
 * /cohorts/{id}/students/{studentId}:
 *   delete:
 *     summary: Remove a student from a cohort (admin)
 *     tags: [Cohorts]
 *     security: [ { bearerAuth: [] } ]
 */
router.delete('/:id/students/:studentId', protect, authorize('admin'), unenrollStudent);

export default router;
