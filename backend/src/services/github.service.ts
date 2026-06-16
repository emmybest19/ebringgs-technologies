import https from 'https';

/**
 * GitHub REST API client — wraps a single endpoint we need: "give me the
 * latest commit on the default branch of this repo." Designed to be called
 * from the polling cron, so it NEVER throws — failures resolve to `null` and
 * the caller logs/skips. Matches the raw-https pattern used by
 * `paystackRequest` in `paystack.controller.ts` so we don't pull in `axios`
 * just for one service.
 */

export interface LatestCommit {
  sha: string;
  message: string;
  authorName: string;
  authorAvatarUrl?: string;
  commitUrl: string;
  committedAt: string; // ISO8601
}

interface RepoCoords { owner: string; repo: string }

const TOKEN = (): string | undefined => process.env.GITHUB_TOKEN;
const USER_AGENT = 'ebringgs-portal';

/**
 * Parse `https://github.com/{owner}/{repo}` (with or without `.git`, trailing
 * slash, or extra path segments like `/tree/main`). Returns `null` for any
 * input we can't confidently parse — the cron will skip that project.
 */
export function parseGithubRepoUrl(url: string | undefined | null): RepoCoords | null {
  if (!url || typeof url !== 'string') return null;
  const cleaned = url.trim();
  // Match the host + the first two path segments after it.
  const m = cleaned.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/\s]+)\/([^\/\s?#]+)/i);
  if (!m) return null;
  const owner = m[1];
  let repo = m[2];
  if (repo.endsWith('.git')) repo = repo.slice(0, -4);
  if (!owner || !repo) return null;
  return { owner, repo };
}

function githubRequest(path: string): Promise<{ statusCode: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': USER_AGENT,
      'X-GitHub-Api-Version': '2022-11-28',
    };
    const token = TOKEN();
    if (token) headers.Authorization = `Bearer ${token}`;

    const req = https.request(
      { hostname: 'api.github.com', port: 443, path, method: 'GET', headers },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          try {
            const parsed = raw ? JSON.parse(raw) : null;
            resolve({ statusCode: res.statusCode ?? 500, body: parsed });
          } catch {
            // Non-JSON body (rare for the GitHub API but possible on 5xx).
            resolve({ statusCode: res.statusCode ?? 500, body: null });
          }
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}

/**
 * Fetch the most recent commit on the default branch of a public (or
 * token-accessible) repository. Returns `null` on any error — 404 (no such
 * repo), 403 (rate-limited or private without token), 401 (bad token), or
 * network/parse failures. The cron treats `null` as "skip this tick."
 */
export async function fetchLatestCommit(repoUrl: string): Promise<LatestCommit | null> {
  const coords = parseGithubRepoUrl(repoUrl);
  if (!coords) return null;

  try {
    const path = `/repos/${encodeURIComponent(coords.owner)}/${encodeURIComponent(coords.repo)}/commits?per_page=1`;
    const { statusCode, body } = await githubRequest(path);
    if (statusCode !== 200 || !Array.isArray(body) || body.length === 0) return null;

    const top = body[0] as {
      sha?: string;
      html_url?: string;
      commit?: { message?: string; author?: { name?: string; date?: string } };
      author?: { login?: string; avatar_url?: string } | null;
    };
    if (!top.sha || !top.commit?.message) return null;

    return {
      sha: top.sha,
      message: top.commit.message,
      authorName: top.commit.author?.name || top.author?.login || 'Unknown',
      authorAvatarUrl: top.author?.avatar_url,
      commitUrl: top.html_url || `https://github.com/${coords.owner}/${coords.repo}/commit/${top.sha}`,
      committedAt: top.commit.author?.date || new Date().toISOString(),
    };
  } catch (err) {
    console.error('[github] fetchLatestCommit failed:', (err as Error).message);
    return null;
  }
}
