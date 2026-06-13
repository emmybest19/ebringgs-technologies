import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  createVoucher, getMyVouchers, lookupVoucher, cancelVoucher,
} from '../controllers/voucher.controller';

const router = Router();

router.post('/', protect, createVoucher);
router.get('/me', protect, getMyVouchers);
router.get('/lookup/:code', protect, lookupVoucher);
router.delete('/:id', protect, cancelVoucher);

export default router;
