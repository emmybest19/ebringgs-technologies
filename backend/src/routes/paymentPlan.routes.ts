import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import {
  getMyPaymentPlans, getPaymentPlan,
  adminListPaymentPlans, adminExtendPlan, adminMarkInstallmentPaid,
} from '../controllers/paymentPlan.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: PaymentPlans
 *   description: Installment payment plans (1×, 2×, 3× splits)
 */

/**
 * @swagger
 * /payment-plans/my:
 *   get:
 *     summary: List the current user's payment plans
 *     tags: [PaymentPlans]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Array of decorated plans (nextInstallment, paidCount, etc.) }
 */
router.get('/my', protect, getMyPaymentPlans);

/**
 * @swagger
 * /payment-plans/admin/all:
 *   get:
 *     summary: Admin — list every plan (optional status filter)
 *     tags: [PaymentPlans]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, completed, overdue, suspended, cancelled] }
 *     responses:
 *       200: { description: Array of plans }
 *       403: { description: Forbidden }
 */
router.get('/admin/all', protect, authorize('admin'), adminListPaymentPlans);

/**
 * @swagger
 * /payment-plans/{id}/extend:
 *   post:
 *     summary: Admin — extend the next installment's due date
 *     tags: [PaymentPlans]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               extraDays: { type: integer, minimum: 1, maximum: 30 }
 *     responses:
 *       200: { description: Plan with updated next-due date }
 */
router.post('/:id/extend', protect, authorize('admin'), adminExtendPlan);

/**
 * @swagger
 * /payment-plans/{id}/mark-paid:
 *   post:
 *     summary: Admin — mark the next installment paid (manual override)
 *     tags: [PaymentPlans]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note: { type: string, maxLength: 200 }
 *     responses:
 *       200: { description: Plan with installment marked 'manual' }
 */
router.post('/:id/mark-paid', protect, authorize('admin'), adminMarkInstallmentPaid);

/**
 * @swagger
 * /payment-plans/{id}:
 *   get:
 *     summary: Get one of the current user's payment plans by id
 *     tags: [PaymentPlans]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Decorated plan }
 *       404: { description: Not found }
 */
router.get('/:id', protect, getPaymentPlan);

export default router;
