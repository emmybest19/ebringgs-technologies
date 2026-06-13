import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import { requireProjectAccess } from '../middleware/feature-access.middleware';
import {
  getMyProjects, getProject, createProject,
  getAllProjects, updateProject, deleteProject,
  getProjectUpdates, addProjectUpdate, deleteProjectUpdate,
  submitBrief,
} from '../controllers/project.controller';

const router = Router();

// Client routes — `getProject` + activity timeline GET are gated by
// `requireProjectAccess`: blocks if THIS project has a suspended PaymentPlan.
// The list endpoint stays open so clients can always see their bill summary.
router.get('/my', protect, authorize('client'), getMyProjects);
router.post('/', protect, authorize('client'), createProject);
router.get('/my/:id', protect, authorize('client'), requireProjectAccess, getProject);
router.post('/:id/brief', protect, authorize('client'), submitBrief);

// Activity timeline (client owner or admin) — owner-side gated, admin path unaffected
router.get('/:id/updates', protect, requireProjectAccess, getProjectUpdates);
router.post('/:id/updates', protect, authorize('admin'), addProjectUpdate);
router.delete('/:id/updates/:updateId', protect, authorize('admin'), deleteProjectUpdate);

// Admin routes
router.get('/', protect, authorize('admin'), getAllProjects);
router.patch('/:id', protect, authorize('admin'), updateProject);
router.delete('/:id', protect, authorize('admin'), deleteProject);

export default router;
