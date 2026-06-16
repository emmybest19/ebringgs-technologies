import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import {
  initializeTransaction,
  verifyTransaction,
  getMyTransactions,
  getAllTransactions,
  paystackWebhook,
} from '../controllers/paystack.controller';

const router = Router();

router.post('/initialize', protect, initializeTransaction);
router.get('/verify/:reference', protect, verifyTransaction);
router.get('/transactions', protect, getMyTransactions);
// Admin ledger: every transaction across all users. Must be registered
// BEFORE the `/transactions` route is matched on auth path (Express picks
// the first match, but these are distinct paths so order is cosmetic only).
router.get('/admin/transactions', protect, authorize('admin'), getAllTransactions);
router.post('/webhook', paystackWebhook);

export default router;
