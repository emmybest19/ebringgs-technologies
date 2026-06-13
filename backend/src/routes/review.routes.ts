import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import {
  submitReview, listReviews, getMyReviews, updateMyReview, deleteMyReview,
  listAllReviews, setApproval, setFeatured, adminDeleteReview,
} from '../controllers/review.controller';

const router = Router();

// Public
router.get('/', listReviews);

// Auth'd user
router.post('/', protect, submitReview);
router.get('/me', protect, getMyReviews);
router.patch('/:id', protect, updateMyReview);
router.delete('/:id', protect, deleteMyReview);

// Admin
router.get('/admin/all', protect, authorize('admin'), listAllReviews);
router.patch('/:id/approve', protect, authorize('admin'), setApproval);
router.patch('/:id/feature', protect, authorize('admin'), setFeatured);
router.delete('/admin/:id', protect, authorize('admin'), adminDeleteReview);

export default router;
