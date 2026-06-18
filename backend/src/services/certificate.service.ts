import Certificate, { ICertificate } from '../models/Certificate.model';
import Counter from '../models/Counter.model';
import Cohort, { ICohort } from '../models/Cohort.model';
import User from '../models/User.model';
import { sendPushToUser } from '../utils/pushNotification';

/**
 * Derive a 2–4 char human-readable program code from a cohort. Used as the
 * middle segment of the certificate ID. Order of preference:
 *   1. The cohort's `planId` first segment uppercased and stripped (e.g.
 *      "web-dev-cohort" → "WD") — gives stable codes that don't change when
 *      the title gets edited.
 *   2. Falls back to the first letters of words in `program` ("UI/UX Design"
 *      → "UIUX").
 *   3. Last-resort: "EB" so the ID is still well-formed.
 */
export function deriveProgramCode(cohort: Pick<ICohort, 'planId' | 'program'>): string {
  if (cohort.planId) {
    // 'web-dev-cohort' → 'WD'; 'uiux-mentor' → 'UI'
    const parts = cohort.planId.split('-').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (parts[0]) return parts[0].slice(0, 4).toUpperCase();
  }
  if (cohort.program) {
    const initials = cohort.program
      .replace(/[^a-zA-Z\s]/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 4);
    if (initials) return initials;
  }
  return 'EB';
}

/**
 * Generate the next certificate ID in the format `EB-<CODE>-<YEAR>-<NNNN>`.
 * Atomic — uses the Counter collection so two concurrent issuances can't
 * mint the same ID even if they race.
 *
 * Examples: EB-WD-2026-0001, EB-UI-2026-0042
 */
export async function generateCertificateId(programCode: string, year?: number): Promise<string> {
  const yr = year ?? new Date().getFullYear();
  const key = `certificate:${programCode}:${yr}`;
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true },
  );
  const seq = String(counter.seq).padStart(4, '0');
  return `EB-${programCode}-${yr}-${seq}`;
}

interface IssueArgs {
  studentId: string;
  cohortId?: string;
  /** Override for manual issuance — defaults to cohort data. */
  program?: string;
  instructor?: string;
  completedAt?: Date;
}

/**
 * Issue a single certificate. Idempotent — if one already exists for the
 * {student, cohort} pair, returns the existing one. Fires a push to the
 * student on first issuance.
 *
 * Used by both the auto-issuance cron and the admin manual-issue endpoint.
 */
export async function issueCertificate(args: IssueArgs): Promise<ICertificate> {
  // Idempotency check first — avoid burning a sequence number if a cert exists.
  if (args.cohortId) {
    const existing = await Certificate.findOne({
      student: args.studentId,
      cohort: args.cohortId,
    });
    if (existing) return existing;
  }

  const student = await User.findById(args.studentId).select('name');
  if (!student) throw new Error(`Student ${args.studentId} not found`);

  let program = args.program;
  let instructor = args.instructor;
  let programCode = 'EB';
  let cohortDoc: ICohort | null = null;

  if (args.cohortId) {
    cohortDoc = await Cohort.findById(args.cohortId);
    if (!cohortDoc) throw new Error(`Cohort ${args.cohortId} not found`);
    program = program ?? cohortDoc.title;
    instructor = instructor ?? cohortDoc.instructor ?? 'E-Bringgs Instructor';
    programCode = deriveProgramCode(cohortDoc);
  }

  if (!program) throw new Error('program is required when no cohort is provided');
  if (!instructor) instructor = 'E-Bringgs Instructor';

  const completedAt = args.completedAt ?? cohortDoc?.endDate ?? new Date();
  const certificateId = await generateCertificateId(programCode);

  const cert = await Certificate.create({
    certificateId,
    student: args.studentId,
    studentName: student.name, // snapshot at issuance — survives later renames
    cohort: args.cohortId,
    program,
    instructor,
    completedAt,
    issuedAt: new Date(),
    isValid: true,
  });

  // Notify the student — uses the push infra we built earlier.
  sendPushToUser(args.studentId, {
    title: '🎓 Your certificate is ready',
    body: `${program} — tap to view, download, or share.`,
    url: `/certificate/${certificateId}`,
    tag: `certificate-${certificateId}`,
  }).catch(() => {});

  return cert;
}

/**
 * Issue certificates for every student in a cohort that doesn't already
 * have one. Used by the auto-issuance cron when a cohort ends.
 * Returns the count of *newly* issued certs (existing ones are skipped).
 */
export async function issueCertificatesForCohort(cohortId: string): Promise<{ issued: number; skipped: number }> {
  const cohort = await Cohort.findById(cohortId);
  if (!cohort) throw new Error(`Cohort ${cohortId} not found`);

  let issued = 0;
  let skipped = 0;
  for (const studentId of cohort.students) {
    const sid = studentId.toString();
    const existing = await Certificate.findOne({ student: sid, cohort: cohortId });
    if (existing) {
      skipped += 1;
      continue;
    }
    try {
      await issueCertificate({ studentId: sid, cohortId });
      issued += 1;
    } catch (err) {
      console.error(`[certificates] issuance failed for student ${sid} in cohort ${cohortId}:`, err);
    }
  }
  return { issued, skipped };
}
