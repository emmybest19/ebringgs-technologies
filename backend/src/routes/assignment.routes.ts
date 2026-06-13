import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import { requireStudentAccess } from '../middleware/feature-access.middleware';
import {
  submitAssignment, getMyAssignments, getAllAssignments, reviewAssignment,
} from '../controllers/assignment.controller';

const router = Router();

// Student-facing routes are gated by `requireStudentAccess` — blocks if the
// student has any suspended training-plan / cohort PaymentPlan. Admin routes
// are deliberately ungated (they don't pay for the platform).
router.post('/',           protect, authorize('student'), requireStudentAccess, upload.single('file'), submitAssignment);
router.get('/my',          protect, authorize('student'), requireStudentAccess,                        getMyAssignments);
router.get('/',            protect, authorize('admin'),                                                getAllAssignments);
router.patch('/:id/review', protect, authorize('admin'),                                               reviewAssignment);

export default router;
