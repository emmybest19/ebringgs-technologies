import cron from 'node-cron';
import Cohort from '../models/Cohort.model';
import { issueCertificatesForCohort } from '../services/certificate.service';

/**
 * Daily certificate-issuance cron.
 *
 * Sweeps every Cohort whose `endDate` is in the past and issues a certificate
 * to every student in `cohort.students[]` who doesn't already have one.
 *
 * Idempotent on three levels:
 *   1. `Certificate.{student, cohort}` is a unique partial index — duplicate
 *      creates fail at the DB layer, not just the application.
 *   2. `issueCertificatesForCohort()` checks each student first before calling
 *      the issuance service — so we never burn a sequence number on a no-op.
 *   3. The cron itself can re-run safely; freshly-enrolled students get caught
 *      next tick.
 *
 * Runs at 09:30 Africa/Lagos (30 min after the installments cron, so we don't
 * stack the two big sweeps on the same minute).
 */

let scheduledTask: ReturnType<typeof cron.schedule> | undefined;

export async function runCertificateIssuanceCron(): Promise<{ cohorts: number; issued: number }> {
  const now = new Date();
  // Cohorts whose end date has passed. No `status` filter — `deriveCohortStatus`
  // is informational; we want hard date facts here.
  const cohorts = await Cohort.find({
    endDate: { $lte: now, $exists: true },
    students: { $exists: true, $not: { $size: 0 } },
  }).select('_id title endDate students');

  let totalIssued = 0;
  for (const cohort of cohorts) {
    try {
      const result = await issueCertificatesForCohort(cohort._id.toString());
      totalIssued += result.issued;
      if (result.issued > 0) {
        console.log(
          `[certificates] cohort ${cohort._id} ("${cohort.title}") — ` +
          `${result.issued} new cert(s), ${result.skipped} already issued`,
        );
      }
    } catch (err) {
      console.error(`[certificates] cohort ${cohort._id} sweep failed:`, err);
    }
  }

  return { cohorts: cohorts.length, issued: totalIssued };
}

/**
 * Register the daily cron. Idempotent — calling twice stops the previous
 * schedule first (useful for tests / hot reload).
 */
export function startCertificateIssuanceCron(): void {
  if (scheduledTask) scheduledTask.stop();
  scheduledTask = cron.schedule('30 9 * * *', () => {
    void runCertificateIssuanceCron().catch((err) =>
      console.error('[certificates] cron tick failed:', err),
    );
  }, {
    timezone: 'Africa/Lagos',
  });
  console.log('[certificates] scheduled daily at 09:30 Africa/Lagos');
}

/** For tests + graceful shutdown. */
export function stopCertificateIssuanceCron(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = undefined;
  }
}
