import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, FileText, ChevronDown, ChevronUp, Loader2, X } from 'lucide-react';
import api from '@ebringgs/api';
import { PageLoader, useSEO } from '@ebringgs/ui';

interface Assignment {
  _id: string;
  title: string;
  description: string;
  fileUrl?: string;
  fileName?: string;
  status: 'submitted' | 'reviewed';
  feedback?: string;
  grade?: string;
  submittedAt: string;
  student: { _id: string; name: string; email: string };
  course: { _id: string; title: string };
  reviewedBy?: { name: string };
  reviewedAt?: string;
}

const GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'Incomplete', 'Pass', 'Fail'];

export default function AdminAssignments() {
  useSEO({ title: 'Assignments', siteName: 'E-Bringgs Admin' });
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'reviewed'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [grade, setGrade] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/assignments');
      setAssignments(data.data.assignments);
    } catch {
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssignments(); }, []);

  const openReview = (a: Assignment) => {
    setReviewing(a._id);
    setFeedback(a.feedback || '');
    setGrade(a.grade || '');
    setExpanded(a._id);
  };

  const submitReview = async (id: string) => {
    setSaving(true);
    try {
      await api.patch(`/assignments/${id}/review`, { feedback, grade });
      setAssignments(prev => prev.map(a =>
        a._id === id ? { ...a, status: 'reviewed', feedback, grade } : a,
      ));
    } catch {
      // Update locally for demo
      setAssignments(prev => prev.map(a =>
        a._id === id ? { ...a, status: 'reviewed', feedback, grade } : a,
      ));
    } finally {
      setSaving(false);
      setReviewing(null);
    }
  };

  const visible = assignments.filter(a =>
    filter === 'all' ? true : a.status === filter,
  );

  const pending = assignments.filter(a => a.status === 'submitted').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assignments</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            {assignments.length} total · {pending} pending review
          </p>
        </div>
        {/* Filter tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
          {(['all', 'submitted', 'reviewed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              aria-current={filter === f ? 'true' : undefined}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === f ? 'bg-white dark:bg-[#0e141c] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
              }`}>
              {f === 'submitted' ? 'Pending' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? <PageLoader /> : (
        <div className="space-y-3">
          {visible.length === 0 && (
            <div className="bg-white dark:bg-[#0e141c] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-12 text-center">
              <FileText size={36} className="text-gray-200 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-slate-400">No assignments {filter !== 'all' ? `with status "${filter}"` : 'yet'}.</p>
            </div>
          )}

          {visible.map(a => (
            <div key={a._id} className="bg-white dark:bg-[#0e141c] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
              {/* Row */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  a.status === 'reviewed' ? 'bg-green-100 dark:bg-green-900' : 'bg-amber-100 dark:bg-amber-900'
                }`}>
                  {a.status === 'reviewed'
                    ? <CheckCircle2 size={18} className="text-green-600" />
                    : <Clock size={18} className="text-amber-600" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{a.title}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      a.status === 'reviewed'
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400'
                        : 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-400'
                    }`}>
                      {a.status === 'reviewed' ? 'Reviewed' : 'Pending'}
                    </span>
                    {a.grade && (
                      <span className="text-xs font-bold bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-400 px-2 py-0.5 rounded-full">
                        {a.grade}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                    {a.student.name} · {a.course.title} ·{' '}
                    {new Date(a.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {a.status === 'submitted' && (
                    <button onClick={() => openReview(a)}
                      className="px-3 py-1.5 bg-cyan-600 text-white text-xs font-semibold rounded-lg hover:bg-cyan-700 transition-colors">
                      Review
                    </button>
                  )}
                  <button
                    onClick={() => setExpanded(prev => prev === a._id ? null : a._id)}
                    aria-label={expanded === a._id ? 'Collapse' : 'Expand'}
                    aria-expanded={expanded === a._id}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition-colors">
                    {expanded === a._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Expanded detail */}
              {expanded === a._id && (
                <div className="px-5 pb-5 border-t border-gray-50 dark:border-slate-800 space-y-4 pt-4">
                  {a.description && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">Description</p>
                      <p className="text-sm text-gray-700 dark:text-slate-300">{a.description}</p>
                    </div>
                  )}

                  {a.fileUrl && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">Submitted file</p>
                      <a href={a.fileUrl} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-cyan-600 hover:underline">
                        <FileText size={14} /> {a.fileName || 'Download file'}
                      </a>
                    </div>
                  )}

                  {/* Existing feedback */}
                  {a.status === 'reviewed' && reviewing !== a._id && (
                    <div className="p-3 bg-green-50 dark:bg-green-950 rounded-xl border border-green-100 dark:border-green-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-green-700 dark:text-green-400">Feedback from {a.reviewedBy?.name ?? 'instructor'}</p>
                        {a.grade && <span className="text-xs font-bold text-green-700 dark:text-green-400">{a.grade}</span>}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-slate-300">{a.feedback || '-'}</p>
                      <button onClick={() => openReview(a)}
                        className="text-xs text-cyan-600 hover:underline mt-1">
                        Edit feedback
                      </button>
                    </div>
                  )}

                  {/* Review form */}
                  {reviewing === a._id && (
                    <div className="space-y-3 p-4 bg-cyan-50 dark:bg-cyan-950 rounded-xl border border-cyan-100 dark:border-cyan-800">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Write feedback</p>
                        <button onClick={() => setReviewing(null)} aria-label="Close review form"
                          className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300">
                          <X size={16} />
                        </button>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1" htmlFor={`feedback-${a._id}`}>
                          Feedback
                        </label>
                        <textarea
                          id={`feedback-${a._id}`}
                          value={feedback}
                          onChange={e => setFeedback(e.target.value)}
                          rows={3}
                          placeholder="Write your feedback for the student…"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#0e141c] text-sm text-gray-900 dark:text-white outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 resize-none"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1" htmlFor={`grade-${a._id}`}>
                            Grade
                          </label>
                          <select
                            id={`grade-${a._id}`}
                            value={grade}
                            onChange={e => setGrade(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-sm text-gray-900 dark:text-white outline-none focus:border-cyan-500 bg-white dark:bg-[#0e141c]">
                            <option value="">No grade</option>
                            {GRADES.map(g => <option key={g}>{g}</option>)}
                          </select>
                        </div>
                        <button onClick={() => submitReview(a._id)} disabled={saving}
                          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors mt-4">
                          {saving && <Loader2 size={14} className="animate-spin" />}
                          Submit review
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
