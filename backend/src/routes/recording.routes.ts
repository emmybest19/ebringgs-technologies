import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import { uploadRecording } from '../middleware/upload.middleware';
import {
  createRecording, listRecordings, listMyRecordings, deleteRecording,
} from '../controllers/recording.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Recordings
 *   description: Class recordings — captured by teachers in-browser via MediaRecorder, uploaded as video blobs.
 */

// Student-facing list — visible recordings only.
router.get('/my', protect, listMyRecordings);

// Teacher / admin list. Teachers see their own, admins see all.
router.get('/', protect, authorize('teacher', 'admin'), listRecordings);

// Upload — teacher or admin only.
router.post('/', protect, authorize('teacher', 'admin'), uploadRecording, createRecording);

// Delete — controller enforces own-record or admin.
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteRecording);

export default router;
