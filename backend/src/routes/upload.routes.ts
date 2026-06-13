import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { uploadSingle } from '../middleware/upload.middleware';
import { uploadFile } from '../controllers/upload.controller';

const router = Router();

router.post('/', protect, uploadSingle('file'), uploadFile);

export default router;
