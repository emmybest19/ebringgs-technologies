import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import { listPosts, getPost, createPost, updatePost, deletePost } from '../controllers/blog.controller';

const router = Router();

router.get('/',       listPosts);
router.get('/:slug',  getPost);
router.post('/',      protect, authorize('admin'), createPost);
router.patch('/:id',  protect, authorize('admin'), updatePost);
router.delete('/:id', protect, authorize('admin'), deletePost);

export default router;
