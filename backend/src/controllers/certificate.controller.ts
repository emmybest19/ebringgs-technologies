import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import Certificate from '../models/Certificate.model';
import { AppError } from '../middleware/error.middleware';
import { issueCertificate, issueCertificatesForCohort } from '../services/certificate.service';

/**
 * GET /api/certificates/verify/:certificateId — PUBLIC, unauthenticated.
 * Anyone with an ID can confirm authenticity. Used by the /verify-certificate page.
 */
export const verifyCertificate = async (req: Request, res: Response, next: NextFunction) => {
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
        revokedReason: cert.isValid ? undefined : cert.revokedReason,
      },
    });
  } catch (err) { next(err); }
};

/**
 * GET /api/certificates/my — authenticated student lists their own certs.
 */
export const getMyCertificates = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const certs = await Certificate.find({ student: req.user!.userId })
      .sort({ issuedAt: -1 })
      .lean();
    res.json({ status: 'success', data: { certificates: certs } });
  } catch (err) { next(err); }
};

/**
 * GET /api/certificates/:certificateId — authenticated, returns the cert if
 * the caller is the owner OR an admin. Used by the print/download page.
 * (Public verification goes through /verify/:certificateId which returns less.)
 */
export const getCertificate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.certificateId });
    if (!cert) return next(new AppError('Certificate not found.', 404));

    const isOwner = cert.student.toString() === req.user!.userId;
    const isAdmin = req.user!.role === 'admin';
    if (!isOwner && !isAdmin) {
      return next(new AppError('You do not have permission to view this certificate.', 403));
    }

    res.json({ status: 'success', data: { certificate: cert } });
  } catch (err) { next(err); }
};

/**
 * POST /api/certificates/issue — admin manually issues a cert.
 * Body: { studentId, cohortId?, program?, instructor?, completedAt? }
 * If cohortId is provided, idempotent on {student, cohort}.
 */
export const adminIssueCertificate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { studentId, cohortId, program, instructor, completedAt } = req.body;
    if (!studentId) return next(new AppError('studentId is required.', 400));
    if (!cohortId && !program) {
      return next(new AppError('Either cohortId or program is required.', 400));
    }

    const cert = await issueCertificate({
      studentId,
      cohortId,
      program,
      instructor,
      completedAt: completedAt ? new Date(completedAt) : undefined,
    });

    res.status(201).json({ status: 'success', data: { certificate: cert } });
  } catch (err) {
    if (err instanceof Error && /not found/i.test(err.message)) {
      return next(new AppError(err.message, 404));
    }
    next(err);
  }
};

/**
 * POST /api/certificates/issue-cohort/:cohortId — admin triggers bulk issuance
 * for every student in a cohort. Idempotent; safe to re-run.
 */
export const adminIssueForCohort = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await issueCertificatesForCohort(req.params.cohortId);
    res.json({ status: 'success', data: result });
  } catch (err) {
    if (err instanceof Error && /not found/i.test(err.message)) {
      return next(new AppError(err.message, 404));
    }
    next(err);
  }
};

/**
 * GET /api/certificates — admin lists all issued certs (filterable).
 */
export const adminListCertificates = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { studentId, cohortId, isValid } = req.query as Record<string, string | undefined>;
    const filter: Record<string, unknown> = {};
    if (studentId) filter.student = studentId;
    if (cohortId) filter.cohort = cohortId;
    if (isValid === 'true') filter.isValid = true;
    if (isValid === 'false') filter.isValid = false;

    const certs = await Certificate.find(filter)
      .populate('student', 'name email')
      .populate('cohort', 'title program startDate endDate')
      .sort({ issuedAt: -1 })
      .lean();

    res.json({ status: 'success', data: { certificates: certs } });
  } catch (err) { next(err); }
};

/**
 * PATCH /api/certificates/:certificateId/revoke — admin marks a cert invalid.
 * The verify page renders this as "Certificate Revoked" with the reason.
 */
export const adminRevokeCertificate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const cert = await Certificate.findOneAndUpdate(
      { certificateId: req.params.certificateId },
      { isValid: false, revokedReason: typeof reason === 'string' ? reason.slice(0, 500) : undefined },
      { new: true },
    );
    if (!cert) return next(new AppError('Certificate not found.', 404));
    res.json({ status: 'success', data: { certificate: cert } });
  } catch (err) { next(err); }
};

/**
 * PATCH /api/certificates/:certificateId/restore — admin reverses a revocation.
 */
export const adminRestoreCertificate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const cert = await Certificate.findOneAndUpdate(
      { certificateId: req.params.certificateId },
      { isValid: true, $unset: { revokedReason: 1 } },
      { new: true },
    );
    if (!cert) return next(new AppError('Certificate not found.', 404));
    res.json({ status: 'success', data: { certificate: cert } });
  } catch (err) { next(err); }
};
