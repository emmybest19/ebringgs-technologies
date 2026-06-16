import cron from 'node-cron';
import Project from '../models/Project.model';
import ProjectUpdate from '../models/ProjectUpdate.model';
import { fetchLatestCommit, parseGithubRepoUrl } from '../services/github.service';

/**
 * GitHub commit-feed cron — polls every active project's linked repo and
 * inserts a `'commit'`-type ProjectUpdate when a new SHA is detected. The
 * timeline UI already renders commit-type entries; the only new work here is
 * keeping the feed fresh without manual admin posts.
 *
 * Idempotency: dedup is by the most-recent stored commit SHA per project.
 * Calling `runGithubCron()` twice in a row with no new commits is a no-op.
 *
 * Notifications: deliberately silent. Active sprints produce many commits
 * per day; pushing every one would train the user to mute notifications.
 * The activity feed itself is the channel.
 */

/* ─── Configurable schedule ───────────────────────────────────────────── */
// Standard cron syntax; default = every 10 minutes. Override with
// GITHUB_POLL_CRON if you want a faster cadence in dev (e.g. '* * * * *').
const DEFAULT_SCHEDULE = '*/10 * * * *';

/* ─── Polling pass ────────────────────────────────────────────────────── */

async function pollOneProject(project: { _id: unknown; githubRepo?: string; title: string }): Promise<'new' | 'unchanged' | 'skipped'> {
  if (!project.githubRepo || !parseGithubRepoUrl(project.githubRepo)) return 'skipped';

  const latest = await fetchLatestCommit(project.githubRepo);
  if (!latest) return 'skipped';

  // Compare against the most-recent stored commit for this project. If the
  // SHA matches, no new code since the last poll — skip.
  const lastStored = await ProjectUpdate.findOne({ project: project._id, type: 'commit' })
    .sort({ createdAt: -1 })
    .select('meta')
    .lean();

  const lastSha = (lastStored?.meta as { sha?: string } | undefined)?.sha;
  if (lastSha === latest.sha) return 'unchanged';

  // Title = first line of commit message, capped at 100 chars.
  const firstLine = latest.message.split('\n')[0].trim().slice(0, 100) || 'New commit';

  await ProjectUpdate.create({
    project: project._id,
    // No human author — system-generated. Renders without an author badge.
    type: 'commit',
    title: firstLine,
    message: `by ${latest.authorName}`,
    url: latest.commitUrl,
    meta: { sha: latest.sha, avatarUrl: latest.authorAvatarUrl },
    // Use the commit's own timestamp so the timeline reads chronologically
    // even if the cron is delayed by several minutes.
    createdAt: new Date(latest.committedAt),
  });

  // Bump the project's `updatedAt` so the "last updated X ago" header on
  // the client view stays fresh without a manual save.
  await Project.findByIdAndUpdate(project._id, { $set: { updatedAt: new Date() } });

  return 'new';
}

/** Run one full sweep. Exposed for tests / manual invocation. */
export async function runGithubCron(): Promise<void> {
  const start = Date.now();
  console.log('[github] cron tick begin');
  try {
    // Only poll projects that are actively being worked on. Skip completed +
    // cancelled to keep API usage proportional to actual work.
    const projects = await Project.find({
      status: { $in: ['awaiting_brief', 'in_progress', 'review'] },
      githubRepo: { $exists: true, $ne: '' },
    }).select('_id githubRepo title').lean();

    if (projects.length === 0) {
      console.log(`[github] no active projects with repos (${Date.now() - start}ms)`);
      return;
    }

    let news = 0;
    let unchanged = 0;
    let skipped = 0;
    // Sequential — at most 1 request per project per tick. Even at 100 active
    // projects this is ~100 requests / 10 min — well under the 5000/hr token
    // limit and the 60/hr unauthenticated limit (per IP, shared across all).
    for (const p of projects) {
      const result = await pollOneProject(p as { _id: unknown; githubRepo?: string; title: string });
      if (result === 'new') news += 1;
      else if (result === 'unchanged') unchanged += 1;
      else skipped += 1;
    }

    console.log(`[github] done in ${Date.now() - start}ms — ${news} new, ${unchanged} unchanged, ${skipped} skipped`);
  } catch (err) {
    console.error('[github] cron failed:', err);
  }
}

/* ─── Scheduler lifecycle ─────────────────────────────────────────────── */

let scheduledTask: ReturnType<typeof cron.schedule> | undefined;

export function startGithubCron(): void {
  if (scheduledTask) scheduledTask.stop();
  const schedule = process.env.GITHUB_POLL_CRON || DEFAULT_SCHEDULE;
  scheduledTask = cron.schedule(schedule, () => { void runGithubCron(); });
  console.log(`[github] scheduled poller (${schedule})`);
}

export function stopGithubCron(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = undefined;
  }
}
