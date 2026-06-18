import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import {
  verifyCertificate,
  getMyCertificates,
  getCertificate,
  adminIssueCertificate,
  adminIssueForCohort,
  adminListCertificates,
  adminRevokeCertificate,
  adminRestoreCertificate,
} from '../controllers/certificate.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Certificates
 *   description: Auto-issued completion certificates with public verification
 */

// ─── Public ──────────────────────────────────────────────────────────────

/**
 * @swagger
 * /certificates/verify/{certificateId}:
 *   get:
 *     summary: Verify a certificate (public)
 *     tags: [Certificates]
 *     parameters:
 *       - in: path
 *         name: certificateId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Certificate found }
 *       404: { description: Not found }
 */
router.get('/verify/:certificateId', verifyCertificate);

// ─── Student / owner ─────────────────────────────────────────────────────

/**
 * @swagger
 * /certificates/my:
 *   get:
 *     summary: List the caller's earned certificates
 *     tags: [Certificates]
 *     security: [ { bearerAuth: [] } ]
 */
router.get('/my', protect, getMyCertificates);

// ─── Admin ───────────────────────────────────────────────────────────────

/**
 * @swagger
 * /certificates:
 *   get:
 *     summary: Admin — list all certificates
 *     tags: [Certificates]
 *     security: [ { bearerAuth: [] } ]
 */
router.get('/', protect, authorize('admin'), adminListCertificates);

/**
 * @swagger
 * /certificates/issue:
 *   post:
 *     summary: Admin — manually issue a certificate
 *     tags: [Certificates]
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
 *               cohortId: { type: string }
 *               program: { type: string }
 *               instructor: { type: string }
 *               completedAt: { type: string, format: date-time }
 */
router.post('/issue', protect, authorize('admin'), adminIssueCertificate);

/**
 * @swagger
 * /certificates/issue-cohort/{cohortId}:
 *   post:
 *     summary: Admin — issue certificates for every enrolled student in a cohort (idempotent)
 *     tags: [Certificates]
 *     security: [ { bearerAuth: [] } ]
 */
router.post('/issue-cohort/:cohortId', protect, authorize('admin'), adminIssueForCohort);

/**
 * @swagger
 * /certificates/{certificateId}/revoke:
 *   patch:
 *     summary: Admin — revoke a certificate
 *     tags: [Certificates]
 *     security: [ { bearerAuth: [] } ]
 */
router.patch('/:certificateId/revoke', protect, authorize('admin'), adminRevokeCertificate);

/**
 * @swagger
 * /certificates/{certificateId}/restore:
 *   patch:
 *     summary: Admin — restore a revoked certificate
 *     tags: [Certificates]
 *     security: [ { bearerAuth: [] } ]
 */
router.patch('/:certificateId/restore', protect, authorize('admin'), adminRestoreCertificate);

// ─── Authenticated fetch by ID (keep last — catch-all path) ──────────────

/**
 * @swagger
 * /certificates/{certificateId}:
 *   get:
 *     summary: Get a certificate by ID (owner or admin)
 *     tags: [Certificates]
 *     security: [ { bearerAuth: [] } ]
 */
router.get('/:certificateId', protect, getCertificate);

export default router;
