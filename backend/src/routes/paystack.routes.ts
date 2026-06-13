import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  initializeTransaction,
  verifyTransaction,
  getMyTransactions,
  paystackWebhook,
} from '../controllers/paystack.controller';

const router = Router();

router.post('/initialize', protect, initializeTransaction);
router.get('/verify/:reference', protect, verifyTransaction);
router.get('/transactions', protect, getMyTransactions);
router.post('/webhook', paystackWebhook);

export default router;
