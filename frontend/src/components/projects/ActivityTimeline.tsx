import { Activity, GitCommit, Rocket, FileText, Flag, Paperclip, ExternalLink, RefreshCw } from 'lucide-react';
import { useProjectUpdates, type ProjectUpdate } from '../../services/queries';

export type { ProjectUpdate };

interface Props {
  projectId: string;
}

const typeMeta: Record<ProjectUpdate['type'], { label: string; icon: typeof Activity; color: string; bg: string }> = {
  progress:   { label: 'Progress',   icon: Activity,    color: 'text-teal-600',   bg: 'bg-teal-50 dark:bg-teal-950' },
  commit:     { label: 'Commit',     icon: GitCommit,   color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950' },
  deploy:     { label: 'Deploy',     icon: Rocket,      color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950' },
  note:       { label: 'Note',       icon: FileText,    color: 'text-gray-600',   bg: 'bg-gray-100 dark:bg-slate-800' },
  milestone:  { label: 'Milestone',  icon: Flag,        color: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-950' },
  attachment: { label: 'Attachment', icon: Paperclip,   color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950' },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ActivityTimeline({ projectId }: Props) {
  const { data, isLoading: loading, isFetching, refetch } = useProjectUpdates(projectId);
  const updates = data?.updates ?? [];
  const lastUpdatedAt = data?.lastUpdatedAt ?? null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Activity</p>
          {lastUpdatedAt && (
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              Last updated {timeAgo(lastUpdatedAt)}
            </p>
          )}
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-gray-400 hover:text-teal-600 disabled:opacity-50 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 dark:text-slate-500 py-6 text-center">Loading activity...</p>
      ) : updates.length === 0 ? (
        <div className="py-8 text-center">
          <Activity size={28} className="text-gray-200 dark:text-slate-700 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-slate-400">No updates yet</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Updates from your project lead will appear here.</p>
        </div>
      ) : (
        <ol className="relative border-l-2 border-gray-100 dark:border-slate-800 ml-3 space-y-5">
          {updates.map((u) => {
            const meta = typeMeta[u.type] || typeMeta.note;
            const Icon = meta.icon;
            return (
              <li key={u._id} className="ml-6">
                {/* Bullet */}
                <span className={`absolute -left-[13px] flex items-center justify-center w-6 h-6 rounded-full ${meta.bg} ring-4 ring-white dark:ring-slate-900`}>
                  <Icon size={12} className={meta.color} />
                </span>

                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded ${meta.bg} ${meta.color}`}>
                    {meta.label}
                  </span>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{u.title}</p>
                </div>
                {u.message && (
                  <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed mb-1.5 whitespace-pre-wrap">
                    {u.message}
                  </p>
                )}
                {u.url && (
                  <a
                    href={u.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 hover:underline mb-1.5"
                  >
                    <ExternalLink size={11} /> {u.url}
                  </a>
                )}
                {typeof u.progressChange === 'number' && (
                  <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                    Progress → {u.progressChange}%
                  </p>
                )}
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                  {u.author?.name || 'Team'} · {timeAgo(u.createdAt)}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
