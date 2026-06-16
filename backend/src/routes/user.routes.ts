import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import {
  getAllUsers, updateProfile, changePassword, updateUserRole,
  listTeachers, getTeacher, createTeacher,
} from '../controllers/user.controller';

const router = Router();

// Teacher / instructor directory (auth required — visible to logged-in users only)
router.get('/teachers',          protect, listTeachers);
router.get('/teachers/:id',      protect, getTeacher);

router.get('/',                  protect, authorize('admin'), getAllUsers);
router.post('/teacher',          protect, authorize('admin'), createTeacher);
router.patch('/profile',         protect,                     updateProfile);
router.patch('/change-password', protect,                     changePassword);
router.patch('/:id/role',        protect, authorize('admin'), updateUserRole);

export default router;
