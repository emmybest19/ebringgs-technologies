import { Router, Request, Response, NextFunction } from 'express';
import Certificate from '../models/Certificate.model';

const router = Router();

// Public endpoint — verify a certificate by its ID
router.get('/verify/:certificateId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.certificateId });
    if (!cert) {
      return res.status(404).json({
        status: 'error',
        message: 'Certificate not found. Please check the ID and try again.',
      });
    }
    res.json({
      status: 'success',
      data: {
        certificateId: cert.certificateId,
        studentName: cert.studentName,
        program: cert.program,
        instructor: cert.instructor,
        completedAt: cert.completedAt,
        isValid: cert.isValid,
      },
    });
  } catch (err) { next(err); }
});

export default router;
