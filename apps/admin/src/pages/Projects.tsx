import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  FolderKanban, ArrowLeft, Loader2, Plus, Activity, GitCommit, Rocket, FileText, Flag, Paperclip,
  Send, ExternalLink, Github, Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ActivityTimeline from '../components/projects/ActivityTimeline';
import {
  useAdminProjects, useAdminProject, useUpdateProject, useAddProjectUpdate,
  type ProjectUpdateType,
} from '../services/queries';
import { useSEO } from '@ebringgs/ui';

const statusColor = (s: string) => {
  switch (s) {
    case 'completed': return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400';
    case 'in_progress': return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-400';
    case 'review': return 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-400';
    case 'cancelled': return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-400';
    default: return 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-400';
  }
};

const updateTypes: { id: ProjectUpdateType; label: string; icon: typeof Activity }[] = [
  { id: 'progress',   label: 'Progress',   icon: Activity },
  { id: 'commit',     label: 'Commit',     icon: GitCommit },
  { id: 'deploy',     label: 'Deploy',     icon: Rocket },
  { id: 'milestone',  label: 'Milestone',  icon: Flag },
  { id: 'note',       label: 'Note',       icon: FileText },
  { id: 'attachment', label: 'Attachment', icon: Paperclip },
];

export function AdminProjectsList() {
  useSEO({ title: 'Projects', siteName: 'E-Bringgs Admin' });
  const { data: projects = [], isLoading: loading } = useAdminProjects();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Manage all client projects and post status updates.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 size={28} className="animate-spin text-cyan-600" />
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white dark:bg-[#0e141c] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-12 text-center">
          <FolderKanban size={36} className="text-gray-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-slate-400">No client projects yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => {
            const clientName = typeof p.client === 'string' ? '-' : p.client?.name || '-';
            return (
              <Link
                key={p._id}
                to={`/admin/projects/${p._id}`}
                className="block bg-white dark:bg-[#0e141c] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-4 hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{p.title}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusColor(p.status)}`}>
                    {p.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-2">
                  {clientName} · {p.serviceName}
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                  </div>
                  <span className="text-xs font-medium text-gray-500 dark:text-slate-400">{p.progress}%</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AdminProjectDetail() {
  useSEO({ title: 'Project', siteName: 'E-Bringgs Admin' });
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // useAdminProject derives from the cached useAdminProjects list, no extra
  // round trip when navigating from the list page, and `refreshKey` is gone
  // because mutations auto-invalidate the underlying query.
  const { data: project, isLoading: loading } = useAdminProject(id);

  const updateProject = useUpdateProject();
  const addProjectUpdate = useAddProjectUpdate();

  // Add update form
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<ProjectUpdateType>('progress');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('');
  const [progressChange, setProgressChange] = useState<string>('');

  // Quick-edit links, local copies, synced whenever the project's persisted
  // values change (e.g. after a save invalidates and refetches).
  const [githubRepo, setGithubRepo] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  useEffect(() => {
    if (project) {
      setGithubRepo(project.githubRepo || '');
      setLiveUrl(project.liveUrl || '');
    }
  }, [project?.githubRepo, project?.liveUrl, project]);

  const submitting = addProjectUpdate.isPending;
  const savingLinks = updateProject.isPending;

  const handleAddUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !id) return;
    const payload: { type: ProjectUpdateType; title: string; message?: string; url?: string; progressChange?: number } = {
      type, title: title.trim(),
    };
    if (message.trim()) payload.message = message.trim();
    if (url.trim()) payload.url = url.trim();
    if (progressChange !== '' && !isNaN(Number(progressChange))) {
      payload.progressChange = Math.max(0, Math.min(100, Number(progressChange)));
    }
    addProjectUpdate.mutate({ projectId: id, payload }, {
      onSuccess: () => {
        toast.success('Update posted. Client will be notified.');
        setTitle(''); setMessage(''); setUrl(''); setProgressChange('');
        setShowForm(false);
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to post update.';
        toast.error(msg);
      },
    });
  };

  const handleSaveLinks = () => {
    if (!id) return;
    updateProject.mutate({
      id,
      payload: {
        githubRepo: githubRepo.trim() || undefined,
        liveUrl: liveUrl.trim() || undefined,
      },
    }, {
      onSuccess: () => toast.success('Project links saved.'),
      onError: () => toast.error('Failed to save links.'),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 size={28} className="animate-spin text-cyan-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Project not found.</p>
        <button onClick={() => navigate('/admin/projects')} className="mt-4 text-sm text-cyan-600 hover:underline">
          ← Back to projects
        </button>
      </div>
    );
  }

  const clientName = typeof project.client === 'string' ? '-' : project.client?.name || '-';
  const clientEmail = typeof project.client === 'string' ? '' : project.client?.email || '';

  return (
    <div className="max-w-4xl">
      <button onClick={() => navigate('/admin/projects')}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors">
        <ArrowLeft size={15} /> Back to projects
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.title}</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {clientName}{clientEmail && ` · ${clientEmail}`} · {project.serviceName}
          </p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize ${statusColor(project.status)}`}>
          {project.status.replace('_', ' ')}
        </span>
      </div>

      {/* Project links editor */}
      <div className="bg-white dark:bg-[#0e141c] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 mb-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">Project links</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
              <Github size={12} /> GitHub repository
            </label>
            <input
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
              placeholder="https://github.com/..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
              <ExternalLink size={12} /> Live URL
            </label>
            <input
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-sm"
            />
          </div>
        </div>
        <button
          onClick={handleSaveLinks}
          disabled={savingLinks}
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white text-xs font-semibold rounded-lg hover:bg-cyan-700 disabled:opacity-60"
        >
          {savingLinks ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save links
        </button>
      </div>

      {/* Add update */}
      <div className="bg-white dark:bg-[#0e141c] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Post an update</p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 text-white text-xs font-semibold rounded-lg hover:bg-cyan-700"
            >
              <Plus size={13} /> New update
            </button>
          )}
        </div>
        {showForm && (
          <form onSubmit={handleAddUpdate} className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {updateTypes.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      type === t.id
                        ? 'bg-cyan-600 text-white'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon size={12} /> {t.label}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              placeholder="Title (e.g. Deployed v0.3 to staging)"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-sm"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Message (optional), what changed, what to expect..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-sm resize-none"
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Optional URL (commit, deploy preview, file)"
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-sm"
              />
              {(type === 'progress' || type === 'milestone') && (
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={progressChange}
                  onChange={(e) => setProgressChange(e.target.value)}
                  placeholder="New progress % (optional)"
                  className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-sm"
                />
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !title.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white text-xs font-semibold rounded-lg hover:bg-cyan-700 disabled:opacity-60"
              >
                {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                Post update
              </button>
            </div>
          </form>
        )}
      </div>

      <ActivityTimeline projectId={project._id} />
    </div>
  );
}
