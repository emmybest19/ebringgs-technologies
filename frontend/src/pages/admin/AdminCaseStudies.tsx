import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, Star, Eye, EyeOff, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useAdminCaseStudies, useCreateCaseStudy, useUpdateCaseStudy, useDeleteCaseStudy,
  type CaseStudy,
} from '../../services/queries';

const blank: Partial<CaseStudy> = {
  type: 'client_work',
  title: '',
  summary: '',
  description: '',
  category: '',
  featured: false,
  published: true,
  order: 0,
};

export default function AdminCaseStudies() {
  const { data: items = [], isLoading: loading, isError } = useAdminCaseStudies();
  const updateCaseStudy = useUpdateCaseStudy();
  const deleteCaseStudy = useDeleteCaseStudy();
  const [editing, setEditing] = useState<Partial<CaseStudy> | null>(null);

  useEffect(() => {
    if (isError) toast.error('Failed to load case studies.');
  }, [isError]);

  const handleDelete = (id: string) => {
    if (!confirm('Delete this case study? This cannot be undone.')) return;
    deleteCaseStudy.mutate(id, {
      onSuccess: () => toast.success('Deleted.'),
      onError: () => toast.error('Failed to delete.'),
    });
  };

  const togglePublished = (study: CaseStudy) => {
    updateCaseStudy.mutate(
      { id: study._id, payload: { published: !study.published } },
      { onError: () => toast.error('Failed to update.') },
    );
  };

  const toggleFeatured = (study: CaseStudy) => {
    updateCaseStudy.mutate(
      { id: study._id, payload: { featured: !study.featured } },
      { onError: () => toast.error('Failed to update.') },
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Case studies</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            Showcased on the public success-stories page and on each productized service detail page.
          </p>
        </div>
        <button onClick={() => setEditing({ ...blank })}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors">
          <Plus size={16} /> New case study
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 size={28} className="animate-spin text-teal-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-12 text-center">
          <p className="text-gray-500 dark:text-slate-400 mb-4">No case studies yet.</p>
          <button onClick={() => setEditing({ ...blank })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors">
            <Plus size={14} /> Create your first one
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-950 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3 text-center">Featured</th>
                <th className="px-5 py-3 text-center">Published</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s._id} className="border-t border-gray-100 dark:border-slate-800">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{s.title}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">/{s.slug}</p>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600 dark:text-slate-400">
                    {s.type === 'client_work' ? 'Client work' : 'Student project'}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600 dark:text-slate-400">{s.category || '—'}</td>
                  <td className="px-5 py-3 text-center">
                    <button onClick={() => toggleFeatured(s)} className="inline-flex">
                      <Star size={16} className={s.featured ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
                    </button>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button onClick={() => togglePublished(s)}
                      className={`inline-flex items-center gap-1 text-xs font-semibold ${s.published ? 'text-green-600' : 'text-gray-400'}`}>
                      {s.published ? <Eye size={14} /> : <EyeOff size={14} />}
                      {s.published ? 'Live' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button onClick={() => setEditing(s)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 hover:text-teal-600">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(s._id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-gray-500 hover:text-red-600">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {editing && (
        <CaseStudyEditor
          study={editing}
          onClose={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function CaseStudyEditor({ study, onClose, onSaved }: { study: Partial<CaseStudy>; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Partial<CaseStudy> & { resultsText?: string; tagsText?: string; techStackText?: string }>({
    ...study,
    resultsText: (study.results || []).join('\n'),
    tagsText: (study.tags || []).join(', '),
    techStackText: (study.techStack || []).join(', '),
  });
  const createCaseStudy = useCreateCaseStudy();
  const updateCaseStudy = useUpdateCaseStudy();
  const saving = createCaseStudy.isPending || updateCaseStudy.isPending;

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.summary || !form.type) {
      toast.error('Title, summary and type are required.');
      return;
    }

    const payload: Record<string, unknown> = {
      ...form,
      results: form.resultsText?.split('\n').map((s) => s.trim()).filter(Boolean) ?? [],
      tags: form.tagsText?.split(',').map((s) => s.trim()).filter(Boolean) ?? [],
      techStack: form.techStackText?.split(',').map((s) => s.trim()).filter(Boolean) ?? [],
    };
    delete payload.resultsText;
    delete payload.tagsText;
    delete payload.techStackText;

    const onError = (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Save failed.';
      toast.error(msg);
    };

    if (form._id) {
      updateCaseStudy.mutate({ id: form._id, payload }, {
        onSuccess: () => { toast.success('Updated.'); onSaved(); },
        onError,
      });
    } else {
      createCaseStudy.mutate(payload, {
        onSuccess: () => { toast.success('Created.'); onSaved(); },
        onError,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl my-8 relative max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {form._id ? 'Edit case study' : 'New case study'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Type */}
          <div className="grid grid-cols-2 gap-3">
            <label className={`flex items-center gap-2 px-4 py-3 rounded-xl border cursor-pointer ${form.type === 'client_work' ? 'border-teal-500 bg-teal-50 dark:bg-teal-950' : 'border-gray-200 dark:border-slate-700'}`}>
              <input type="radio" checked={form.type === 'client_work'} onChange={() => set('type', 'client_work')} className="accent-teal-600" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Client work</span>
            </label>
            <label className={`flex items-center gap-2 px-4 py-3 rounded-xl border cursor-pointer ${form.type === 'student_project' ? 'border-teal-500 bg-teal-50 dark:bg-teal-950' : 'border-gray-200 dark:border-slate-700'}`}>
              <input type="radio" checked={form.type === 'student_project'} onChange={() => set('type', 'student_project')} className="accent-teal-600" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Student project</span>
            </label>
          </div>

          <Field label="Title *">
            <input value={form.title || ''} onChange={(e) => set('title', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm focus:border-teal-500 outline-none" />
          </Field>

          <Field label="Slug (auto-generated if blank)">
            <input value={form.slug || ''} onChange={(e) => set('slug', e.target.value)}
              placeholder="leave blank to auto-generate from title"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm font-mono focus:border-teal-500 outline-none" />
          </Field>

          <Field label="Summary * (1-2 sentences shown on cards)">
            <textarea value={form.summary || ''} onChange={(e) => set('summary', e.target.value)} rows={2}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm focus:border-teal-500 outline-none resize-none" />
          </Field>

          <Field label="Full description (markdown supported, plain text fine)">
            <textarea value={form.description || ''} onChange={(e) => set('description', e.target.value)} rows={6}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm focus:border-teal-500 outline-none resize-none" />
          </Field>

          <Field label="Cover image URL">
            <input value={form.coverImage || ''} onChange={(e) => set('coverImage', e.target.value)}
              placeholder="https://… or /images/…"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm focus:border-teal-500 outline-none" />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Category">
              <input value={form.category || ''} onChange={(e) => set('category', e.target.value)}
                placeholder="Web Development"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm focus:border-teal-500 outline-none" />
            </Field>
            <Field label="Tags (comma-separated)">
              <input value={form.tagsText || ''} onChange={(e) => set('tagsText', e.target.value)}
                placeholder="react, mobile, mvp"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm focus:border-teal-500 outline-none" />
            </Field>
          </div>

          <Field label="Tech stack (comma-separated)">
            <input value={form.techStackText || ''} onChange={(e) => set('techStackText', e.target.value)}
              placeholder="React, Node.js, MongoDB"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm focus:border-teal-500 outline-none" />
          </Field>

          {/* Client work fields */}
          {form.type === 'client_work' && (
            <div className="border-t border-gray-100 dark:border-slate-800 pt-5 space-y-5">
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Client work details</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Service ID (matches catalog id)">
                  <input value={form.serviceId || ''} onChange={(e) => set('serviceId', e.target.value)}
                    placeholder="e.g. 1, 11, 13"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm focus:border-teal-500 outline-none" />
                </Field>
                <Field label="Client name (optional)">
                  <input value={form.clientName || ''} onChange={(e) => set('clientName', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm focus:border-teal-500 outline-none" />
                </Field>
                <Field label="Delivery days">
                  <input type="number" min="1" value={form.deliveryDays ?? ''} onChange={(e) => set('deliveryDays', Number(e.target.value) || undefined)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm focus:border-teal-500 outline-none" />
                </Field>
                <Field label="Investment (kobo, e.g. 25000000 = ₦250,000)">
                  <input type="number" min="0" value={form.priceKobo ?? ''} onChange={(e) => set('priceKobo', Number(e.target.value) || undefined)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm focus:border-teal-500 outline-none" />
                </Field>
              </div>
              <Field label="Results (one per line)">
                <textarea value={form.resultsText || ''} onChange={(e) => set('resultsText', e.target.value)} rows={3}
                  placeholder="3x conversion lift&#10;Launched in 14 days&#10;Featured on Product Hunt"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm focus:border-teal-500 outline-none resize-none" />
              </Field>
            </div>
          )}

          {/* Student project fields */}
          {form.type === 'student_project' && (
            <div className="border-t border-gray-100 dark:border-slate-800 pt-5 space-y-5">
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Student project details</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Student name">
                  <input value={form.studentName || ''} onChange={(e) => set('studentName', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm focus:border-teal-500 outline-none" />
                </Field>
                <Field label="Cohort batch">
                  <input value={form.cohortBatch || ''} onChange={(e) => set('cohortBatch', e.target.value)}
                    placeholder="Web Dev — Batch 3"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm focus:border-teal-500 outline-none" />
                </Field>
                <Field label="Current role">
                  <input value={form.studentRole || ''} onChange={(e) => set('studentRole', e.target.value)}
                    placeholder="Software Engineer at FinTech Co."
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm focus:border-teal-500 outline-none" />
                </Field>
                <Field label="Student avatar URL">
                  <input value={form.studentAvatar || ''} onChange={(e) => set('studentAvatar', e.target.value)}
                    placeholder="https://… or /images/students/…"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm focus:border-teal-500 outline-none" />
                </Field>
              </div>
              <Field label="Short bio (shown on portfolio detail page, max 600 chars)">
                <textarea value={form.studentBio || ''} onChange={(e) => set('studentBio', e.target.value)} rows={3}
                  maxLength={600}
                  placeholder="A sentence or two about the student — where they came from, what they built, where they ended up."
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm focus:border-teal-500 outline-none resize-none" />
              </Field>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Live URL">
              <input value={form.liveUrl || ''} onChange={(e) => set('liveUrl', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm focus:border-teal-500 outline-none" />
            </Field>
            <Field label="GitHub URL">
              <input value={form.githubUrl || ''} onChange={(e) => set('githubUrl', e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm focus:border-teal-500 outline-none" />
            </Field>
          </div>

          {/* Testimonial */}
          <div className="border-t border-gray-100 dark:border-slate-800 pt-5 space-y-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Testimonial (optional)</p>
            <Field label="Quote">
              <textarea value={form.testimonial?.quote || ''}
                onChange={(e) => set('testimonial', { ...(form.testimonial || { quote: '', name: '' }), quote: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm focus:border-teal-500 outline-none resize-none" />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Name">
                <input value={form.testimonial?.name || ''}
                  onChange={(e) => set('testimonial', { ...(form.testimonial || { quote: '', name: '' }), name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm focus:border-teal-500 outline-none" />
              </Field>
              <Field label="Title">
                <input value={form.testimonial?.title || ''}
                  onChange={(e) => set('testimonial', { ...(form.testimonial || { quote: '', name: '' }), title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm focus:border-teal-500 outline-none" />
              </Field>
            </div>
          </div>

          {/* Flags */}
          <div className="flex flex-wrap gap-5 border-t border-gray-100 dark:border-slate-800 pt-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!form.featured} onChange={(e) => set('featured', e.target.checked)} className="w-4 h-4 accent-teal-600" />
              <span className="text-sm text-gray-700 dark:text-slate-300">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.published !== false} onChange={(e) => set('published', e.target.checked)} className="w-4 h-4 accent-teal-600" />
              <span className="text-sm text-gray-700 dark:text-slate-300">Published</span>
            </label>
            <Field label="Sort order">
              <input type="number" value={form.order ?? 0} onChange={(e) => set('order', Number(e.target.value) || 0)}
                className="w-24 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm focus:border-teal-500 outline-none" />
            </Field>
          </div>
        </form>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-800">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-60 transition-colors">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
