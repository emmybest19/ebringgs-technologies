import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import {
  listPublic, getPublic, listAll, create, update, remove,
} from '../controllers/caseStudy.controller';

const router = Router();

// Public
router.get('/', listPublic);
router.get('/:slug', getPublic);

// Admin
router.get('/admin/all', protect, authorize('admin'), listAll);
router.post('/', protect, authorize('admin'), create);
router.patch('/:id', protect, authorize('admin'), update);
router.delete('/:id', protect, authorize('admin'), remove);

export default router;
