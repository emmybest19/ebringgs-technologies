import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import {
  getStats, getInquiries, updateInquiryStatus, getUnreadCounts, convertInquiryToProject,
} from '../controllers/admin.controller';

const router = Router();

router.get('/stats',                  protect, authorize('admin'), getStats);
router.get('/unread',                 protect, authorize('admin'), getUnreadCounts);
router.get('/inquiries',              protect, authorize('admin'), getInquiries);
router.patch('/inquiries/:id/status', protect, authorize('admin'), updateInquiryStatus);

export default router;
