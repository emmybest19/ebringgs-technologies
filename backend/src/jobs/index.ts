import { startInstallmentsCron, stopInstallmentsCron } from './installments.cron';
import { startGithubCron, stopGithubCron } from './github.cron';
import { startLiveSessionRemindersCron, stopLiveSessionRemindersCron } from './liveSessionReminders.cron';
import { startCertificateIssuanceCron, stopCertificateIssuanceCron } from './certificateIssuance.cron';

/**
 * Single entry point for all background jobs. Called once from `index.ts`
 * after the MongoDB connection is established (jobs that hit Mongo would
 * crash if started earlier).
 *
 * Add new jobs here as the list grows — keeps `index.ts` clean.
 */
export function startJobs(): void {
  startInstallmentsCron();
  startGithubCron();
  startLiveSessionRemindersCron();
  startCertificateIssuanceCron();
}

/** Graceful-shutdown helper. Stops every registered cron. */
export function stopJobs(): void {
  stopInstallmentsCron();
  stopGithubCron();
  stopLiveSessionRemindersCron();
  stopCertificateIssuanceCron();
}
