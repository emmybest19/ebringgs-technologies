import { useEffect, useState, useRef } from 'react';
import { ClipboardList, Plus, X, Upload, Paperclip } from 'lucide-react';
import api from '@ebringgs/api';
import { formatDate } from './_utils';
import type { MyAssignment } from './_utils';

interface SubmitForm {
  courseId: string;
  title: string;
  description: string;
  file: File | null;
}

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState<MyAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [submitForm, setSubmitForm] = useState<SubmitForm>({ courseId: '', title: '', description: '', file: null });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    api.get('/assignments/my')
      .then(({ data }) => {
        const list = data?.data?.assignments ?? data?.data ?? [];
        setAssignments(Array.isArray(list) ? list : []);
      })
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitForm.courseId || !submitForm.title.trim() || !submitForm.description.trim()) {
      setSubmitError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const formData = new FormData();
      formData.append('courseId', submitForm.courseId);
      formData.append('title', submitForm.title);
      formData.append('description', submitForm.description);
      if (submitForm.file) formData.append('file', submitForm.file);
      const { data } = await api.post('/assignments', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAssignments((prev) => [data.data.assignment, ...prev]);
      setSubmitForm({ courseId: '', title: '', description: '', file: null });
      setShowSubmitForm(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSubmitError(msg || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Assignments</h1>
        <button
          onClick={() => { setShowSubmitForm((v) => !v); setSubmitError(''); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 text-white text-sm font-semibold rounded-xl hover:bg-cyan-700 transition-colors"
        >
          {showSubmitForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> Submit New</>}
        </button>
      </div>

      {showSubmitForm && (
        <div className="bg-white dark:bg-[#0e141c] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">New Submission</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Program / Topic <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={submitForm.courseId}
                onChange={(e) => setSubmitForm((f) => ({ ...f, courseId: e.target.value }))}
                placeholder="e.g. Web Dev Cohort, UI/UX Mentorship"
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={submitForm.title}
                onChange={(e) => setSubmitForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. React Hooks Exercise"
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Description / Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                value={submitForm.description}
                onChange={(e) => setSubmitForm((f) => ({ ...f, description: e.target.value }))}
                rows={4}
                placeholder="Briefly describe your submission…"
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Attachment (optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="*/*"
                onChange={(e) => setSubmitForm((f) => ({ ...f, file: e.target.files?.[0] ?? null }))}
              />
              {submitForm.file ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-cyan-50 dark:bg-cyan-950 border border-cyan-100 dark:border-cyan-800 rounded-xl text-sm">
                  <Paperclip size={14} className="text-cyan-600 shrink-0" />
                  <span className="flex-1 truncate text-gray-700 dark:text-slate-300">{submitForm.file.name}</span>
                  <button
                    type="button"
                    onClick={() => setSubmitForm((f) => ({ ...f, file: null }))}
                    className="text-gray-400 dark:text-slate-500 hover:text-red-500 shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 dark:border-slate-600 rounded-xl text-sm text-gray-500 dark:text-slate-400 hover:border-cyan-400 hover:text-cyan-600 transition-colors w-full"
                >
                  <Upload size={14} /> Click to attach a file
                </button>
              )}
            </div>
            {submitError && (
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded-lg px-3 py-2">{submitError}</p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitForm(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 bg-cyan-600 text-white text-sm font-semibold rounded-xl hover:bg-cyan-700 disabled:opacity-60 transition-colors"
              >
                {submitting ? 'Submitting…' : 'Submit Assignment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-gray-400 dark:text-slate-500">Loading...</div>
      ) : assignments.length === 0 ? (
        <div className="bg-white dark:bg-[#0e141c] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-12 text-center">
          <ClipboardList size={40} className="text-gray-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="font-medium text-gray-500 dark:text-slate-400">No assignments submitted yet</p>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Use the button above to submit your first assignment.</p>
        </div>
      ) : (
        assignments.map((a) => (
          <div key={a._id} className="bg-white dark:bg-[#0e141c] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                a.status === 'reviewed' ? 'bg-green-50 dark:bg-green-950' : 'bg-amber-50 dark:bg-amber-950'
              }`}>
                <ClipboardList size={18} className={a.status === 'reviewed' ? 'text-green-600' : 'text-amber-600'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{a.title}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    a.status === 'reviewed'
                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                      : 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
                  }`}>
                    {a.status === 'reviewed' ? 'Reviewed' : 'Pending review'}
                  </span>
                  {a.grade && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300">
                      Grade: {a.grade}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                  {a.program} · Submitted {formatDate(a.submittedAt)}
                </p>
                <p className="text-sm text-gray-600 dark:text-slate-400 mt-2 leading-relaxed">{a.description}</p>

                {a.fileUrl && (
                  <a href={a.fileUrl} target="_blank" rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-cyan-600 hover:underline">
                    <Paperclip size={12} /> {a.fileName ?? 'Download attachment'}
                  </a>
                )}

                {a.status === 'reviewed' && a.feedback && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 rounded-xl border border-green-100 dark:border-green-900">
                    <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">Instructor Feedback</p>
                    <p className="text-sm text-gray-700 dark:text-slate-300">{a.feedback}</p>
                    {a.reviewedAt && (
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Reviewed {formatDate(a.reviewedAt)}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
