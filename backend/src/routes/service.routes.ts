import { Router } from 'express';
import { listServices, getService, submitInquiry } from '../controllers/service.controller';

const router = Router();

router.get('/',         listServices);
router.post('/inquire', submitInquiry);
router.get('/:id',      getService);

export default router;
