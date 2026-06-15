import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  FolderKanban, ArrowLeft, ExternalLink, Github, Clock,
  CheckCircle2, Loader2, FileDown, AlertCircle, ClipboardList,
} from 'lucide-react';
import ActivityTimeline from '../../components/projects/ActivityTimeline';
import { useMyProjects, useMyProject, useMyPaymentPlans } from '../../services/queries';
import NextPaymentBanner from '../../components/payments/NextPaymentBanner';

const statusColor = (s: string) => {
  switch (s) {
    case 'completed': return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400';
    case 'in_progress': return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-400';
    case 'review': return 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-400';
    case 'awaiting_brief': return 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-400';
    case 'cancelled': return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-400';
    default: return 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-400';
  }
};

function formatDate(iso?: string) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ─── Project list ─── */
function ProjectList() {
  const { data: projects = [], isLoading: loading } = useMyProjects();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filtered = projects.filter(p => {
    if (filter === 'active') return !['completed', 'cancelled'].includes(p.status);
    if (filter === 'completed') return p.status === 'completed';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Projects</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">{projects.length} total project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
          {(['all', 'active', 'completed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-12 text-center">
          <FolderKanban size={40} className="text-gray-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-slate-400">
            {filter !== 'all' ? `No ${filter} projects.` : 'No projects yet.'}
          </p>
          <Link to="/services" className="inline-block mt-3 text-sm text-teal-600 hover:underline font-medium">
            Browse our services
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <Link key={p._id} to={`/client/projects/${p._id}`}
              className="block bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 hover:border-teal-300 dark:hover:border-teal-700 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{p.title}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{p.serviceName}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${statusColor(p.status)}`}>
                  {p.status.replace('_', ' ')}
                </span>
              </div>

              {p.status === 'awaiting_brief' ? (
                <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl px-4 py-3 flex items-center gap-3">
                  <ClipboardList size={18} className="text-purple-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Brief required</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Tell us about your project so we can start work.</p>
                  </div>
                  <span className="text-sm font-semibold text-purple-600 shrink-0">Continue →</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-slate-400 w-10 text-right">{p.progress}%</span>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 dark:text-slate-500">
                    {p.startDate && <span>Started: {formatDate(p.startDate)}</span>}
                    {p.estimatedEndDate && <span>Due: {formatDate(p.estimatedEndDate)}</span>}
                    {p.githubRepo && <span className="flex items-center gap-1"><Github size={12} /> Repo linked</span>}
                    {p.liveUrl && <span className="flex items-center gap-1"><ExternalLink size={12} /> Live site</span>}
                  </div>
                </>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Project detail ─── */
function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading: loading, isError } = useMyProject(projectId);

  // Find the installment plan tied to THIS specific project (if any). Other
  // plans the user has for unrelated projects don't surface here.
  const { data: plans } = useMyPaymentPlans();
  const projectPlan = plans?.find((p) => p.linkedProject === projectId);

  // Mirror the old catch-and-redirect behavior, if the fetch fails (typically
  // 404 because the project doesn't exist or isn't owned), bounce to the list.
  useEffect(() => {
    if (isError) navigate('/client/projects');
  }, [isError, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-teal-600" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate('/client/projects')}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors">
        <ArrowLeft size={15} /> Back to projects
      </button>

      {/* Surface this project's installment plan if there's anything urgent
          (overdue, suspended, or due within 7 days). Hidden otherwise. */}
      {projectPlan && <NextPaymentBanner plan={projectPlan} />}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.title}</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">{project.serviceName}</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize ${statusColor(project.status)}`}>
          {project.status.replace('_', ' ')}
        </span>
      </div>

      {project.status === 'awaiting_brief' && (
        <div className="bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl p-5 mb-4 flex items-center gap-4">
          <div className="inline-flex p-3 bg-purple-100 dark:bg-purple-900 rounded-xl">
            <ClipboardList size={20} className="text-purple-700 dark:text-purple-300" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 dark:text-white">Brief required to kick off</p>
            <p className="text-sm text-gray-600 dark:text-slate-400">A 5-minute form so we know exactly what to build.</p>
          </div>
          <Link to={`/client/projects/${project._id}/brief`}
            className="px-5 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-colors shrink-0">
            Submit brief
          </Link>
        </div>
      )}

      {/* Progress */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Progress</p>
          <p className="text-sm font-bold text-teal-600">{project.progress}%</p>
        </div>
        <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-linear-to-r from-teal-500 to-cyan-500 rounded-full transition-all" style={{ width: `${project.progress}%` }} />
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-3">
          <p className="text-xs text-gray-500 dark:text-slate-400">Started</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{formatDate(project.startDate)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-3">
          <p className="text-xs text-gray-500 dark:text-slate-400">Due</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{formatDate(project.estimatedEndDate)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-3">
          <p className="text-xs text-gray-500 dark:text-slate-400">Cost</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
            {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(project.totalCost / 100)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-3">
          <p className="text-xs text-gray-500 dark:text-slate-400">Payment</p>
          <p className={`text-sm font-semibold mt-0.5 ${project.isPaid ? 'text-green-600' : 'text-amber-600'}`}>
            {project.isPaid ? 'Paid' : 'Unpaid'}
          </p>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 mb-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Description</p>
          <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{project.description}</p>
        </div>
      )}

      {/* Links */}
      {(project.githubRepo || project.liveUrl) && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 mb-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">Links</p>
          <div className="flex flex-wrap gap-3">
            {project.githubRepo && (
              <a href={project.githubRepo} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-sm text-gray-700 dark:text-slate-300 hover:border-teal-400 hover:text-teal-600 transition-colors">
                <Github size={16} /> GitHub Repository
              </a>
            )}
            {project.liveUrl && (
              <a href={project.liveUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-sm text-gray-700 dark:text-slate-300 hover:border-teal-400 hover:text-teal-600 transition-colors">
                <ExternalLink size={16} /> Live Website
              </a>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      {project.timeline && project.timeline.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 mb-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">Timeline</p>
          <div className="space-y-3">
            {project.timeline.map((t, i) => (
              <div key={i} className="flex items-start gap-3">
                {t.completed ? (
                  <CheckCircle2 size={18} className="text-green-500 mt-0.5 shrink-0" />
                ) : (
                  <Clock size={18} className="text-gray-300 dark:text-slate-600 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className={`text-sm font-medium ${t.completed ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400'}`}>
                    {t.milestone}
                  </p>
                  {t.dueDate && <p className="text-xs text-gray-400 dark:text-slate-500">{formatDate(t.dueDate)}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deliverables */}
      {project.deliverables.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 mb-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">Deliverables</p>
          <div className="space-y-2">
            {project.deliverables.map((d, i) => (
              <a key={i} href={d.url} target="_blank" rel="noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 transition-colors">
                <FileDown size={16} className="text-teal-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{d.name}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">{formatDate(d.uploadedAt)}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Activity timeline */}
      <div className="mb-4">
        <ActivityTimeline projectId={project._id} />
      </div>

      {/* Notes */}
      {project.notes && (
        <div className="bg-amber-50 dark:bg-amber-950 rounded-2xl border border-amber-200 dark:border-amber-800 p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16} className="text-amber-600" />
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Notes from team</p>
          </div>
          <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{project.notes}</p>
        </div>
      )}
    </div>
  );
}

export { ProjectList, ProjectDetail };
