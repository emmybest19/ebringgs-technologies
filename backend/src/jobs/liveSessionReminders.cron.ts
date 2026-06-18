import cron from 'node-cron';
import LiveSession from '../models/LiveSession.model';
import { sendPushToRole } from '../utils/pushNotification';

/**
 * Live-session "starting soon" reminder cron.
 *
 * Every 5 minutes, finds upcoming sessions whose `scheduledAt` falls in the
 * next 10–20 minute window and that haven't already been reminded. Pushes a
 * "starts in ~N minutes" notification to every student, then stamps
 * `notifiedStartReminderAt` so a re-run inside the same window is a no-op.
 *
 * Window math:
 *   - cron tick every 5 min
 *   - target window is T+10min .. T+20min from now
 *   - any session with a real scheduledAt will fall inside the window at
 *     exactly one tick → caught exactly once, dedup'd by the timestamp field.
 *
 * Schedule via `startLiveSessionRemindersCron()` from `jobs/index.ts`.
 * Safe to invoke `runLiveSessionRemindersCron()` directly from a script.
 */

const REMINDER_LEAD_MIN_MIN = 10;
const REMINDER_LEAD_MAX_MIN = 20;

function minutesFromNow(n: number): Date {
  return new Date(Date.now() + n * 60 * 1000);
}

export async function runLiveSessionRemindersCron(): Promise<{ notified: number }> {
  const windowStart = minutesFromNow(REMINDER_LEAD_MIN_MIN);
  const windowEnd = minutesFromNow(REMINDER_LEAD_MAX_MIN);

  const sessions = await LiveSession.find({
    status: 'upcoming',
    scheduledAt: { $gte: windowStart, $lte: windowEnd },
    notifiedStartReminderAt: { $exists: false },
  });

  let notified = 0;
  for (const session of sessions) {
    const minutesUntil = Math.max(
      1,
      Math.round((session.scheduledAt.getTime() - Date.now()) / 60000),
    );

    sendPushToRole('student', {
      title: `Class starts in ~${minutesUntil} min`,
      body: `"${session.title}" — tap to join when it goes live.`,
      url: `/classroom/${session.roomId}`,
      tag: 'live-session-reminder',
    }).catch(() => {});

    session.notifiedStartReminderAt = new Date();
    await session.save().catch((err) =>
      console.error('[live-session-reminder] save failed:', err),
    );

    notified += 1;
    console.log(
      `[live-session-reminder] sent for session ${session._id} ("${session.title}", T-${minutesUntil}min)`,
    );
  }

  return { notified };
}

let scheduledTask: ReturnType<typeof cron.schedule> | undefined;

/**
 * Register the every-5-min reminder cron. Idempotent — calling twice stops
 * the previous schedule first (handy for tests / hot reload).
 */
export function startLiveSessionRemindersCron(): void {
  if (scheduledTask) scheduledTask.stop();
  scheduledTask = cron.schedule('*/5 * * * *', () => {
    void runLiveSessionRemindersCron().catch((err) =>
      console.error('[live-session-reminder] tick failed:', err),
    );
  });
  console.log('[live-session-reminder] scheduled every 5 minutes');
}

/** For tests + graceful shutdown. */
export function stopLiveSessionRemindersCron(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = undefined;
  }
}
