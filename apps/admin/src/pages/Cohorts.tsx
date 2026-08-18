import { useEffect, useMemo, useState } from 'react';
import {
  Plus, Pencil, Trash2, Loader2, X, Save, Calendar,
  AlertTriangle, EyeOff, Eye, BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useAdminCohorts, useCreateCohort, useUpdateCohort, useDeleteCohort,
  type Cohort, type CohortStatus,
} from '../services/queries';
import { useSEO } from '@ebringgs/ui';

/**
 * The plan IDs available in [frontend/src/pages/Checkout.tsx](Checkout.tsx)'s
 * planDetails. Keep this in sync, if you add a new plan there, add it here
 * too so admins get a dropdown rather than free-text input.
 */
const PLAN_OPTIONS: { id: string; label: string }[] = [
  { id: 'frontend-starter',            label: 'Frontend, Starter' },
  { id: 'frontend-cohort',             label: 'Frontend, Live Cohort' },
  { id: 'frontend-mentor',             label: 'Frontend, Mentorship' },
  { id: 'backend-starter',             label: 'Backend, Starter' },
  { id: 'backend-cohort',              label: 'Backend, Live Cohort' },
  { id: 'backend-mentor',              label: 'Backend, Mentorship' },
  { id: 'fullstack-starter',           label: 'Full-Stack, Starter' },
  { id: 'fullstack-cohort',            label: 'Full-Stack, Live Cohort' },
  { id: 'fullstack-mentor',            label: 'Full-Stack, Mentorship' },
  { id: 'mobile-dev-starter',          label: 'Mobile, Starter' },
  { id: 'mobile-dev-cohort',           label: 'Mobile, Live Cohort' },
  { id: 'mobile-dev-mentor',           label: 'Mobile, Mentorship' },
  { id: 'research-writing-starter',    label: 'Research Writing, Starter' },
  { id: 'research-writing-cohort',     label: 'Research Writing, Live Cohort' },
  { id: 'research-writing-mentor',     label: 'Research Writing, Mentorship' },
];

const PROGRAM_OPTIONS = [
  'Frontend Development',
  'Backend Development',
  'Full-Stack Development',
  'Mobile App Development',
  'Research Writing',
  'Other',
];

interface FormState {
  _id?: string;
  program: string;
  title: string;
  planId: string;
  startDate: string;           // datetime-local string
  endDate: string;
  durationLabel: string;
  priceNgn: string;            // string while editing
  capacity: string;
  enrolledCount: string;
  isEnrollmentOpen: boolean;
  description: string;
  instructor: string;
  highlightsText: string;      // newline-separated
  order: string;
  status: '' | CohortStatus;   // empty = auto-derive
}

const BLANK: FormState = {
  program: 'Full-Stack Development',
  title: '',
  planId: 'fullstack-cohort',
  startDate: '',
  endDate: '',
  durationLabel: '12 weeks',
  priceNgn: '250000',
  capacity: '15',
  enrolledCount: '0',
  isEnrollmentOpen: true,
  description: '',
  instructor: '',
  highlightsText: '',
  order: '0',
  status: '',
};

function toDateTimeLocal(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  // datetime-local wants "YYYY-MM-DDTHH:mm" in *local* time
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatNGN(naira: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(naira);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusStyle(status: CohortStatus) {
  switch (status) {
    case 'open':        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
    case 'closed':      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
    case 'in_progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
    case 'ended':       return 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400';
  }
}

export default function AdminCohorts() {
  useSEO({ title: 'Cohorts', siteName: 'E-Bringgs Admin' });
  const { data: cohorts = [], isLoading, isError } = useAdminCohorts();
  const deleteCohort = useDeleteCohort();
  const [editing, setEditing] = useState<FormState | null>(null);

  // Surface fetch failures the same way the old manual fetch did, but only
  // once per error transition, not every render.
  useEffect(() => {
    if (isError) toast.error('Failed to load cohorts.');
  }, [isError]);

  const openCreate = () => setEditing({ ...BLANK });

  const openEdit = (c: Cohort) => setEditing({
    _id: c._id,
    program: c.program,
    title: c.title,
    planId: c.planId,
    startDate: toDateTimeLocal(c.startDate),
    endDate: toDateTimeLocal(c.endDate),
    durationLabel: c.durationLabel || '',
    priceNgn: String(c.priceNgn),
    capacity: String(c.capacity),
    enrolledCount: String(c.enrolledCount),
    isEnrollmentOpen: c.isEnrollmentOpen,
    description: c.description || '',
    instructor: c.instructor || '',
    highlightsText: (c.highlights || []).join('\n'),
    order: String(c.order ?? 0),
    status: c.status ?? '',
  });

  const handleDelete = (c: Cohort) => {
    if (!confirm(`Delete the cohort "${c.title}"? This cannot be undone.`)) return;
    deleteCohort.mutate(c._id, {
      onSuccess: () => toast.success('Cohort deleted.'),
      onError: () => toast.error('Failed to delete cohort.'),
    });
  };

  const upcoming = useMemo(
    () => cohorts.filter((c) => new Date(c.startDate) >= new Date()),
    [cohorts],
  );
  const past = useMemo(
    () => cohorts.filter((c) => new Date(c.startDate) < new Date()),
    [cohorts],
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cohort intakes</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            {upcoming.length} upcoming · {past.length} past · Powers the countdown on /schedule.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-600 text-white text-sm font-semibold rounded-xl hover:bg-cyan-700 transition-colors"
        >
          <Plus size={16} /> New cohort intake
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 size={28} className="animate-spin text-cyan-600" />
        </div>
      ) : cohorts.length === 0 ? (
        <div className="bg-white dark:bg-[#0e141c] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-12 text-center">
          <Calendar size={36} className="mx-auto text-gray-300 dark:text-slate-700 mb-3" />
          <p className="text-gray-700 dark:text-slate-300 font-semibold mb-1">No cohorts scheduled yet</p>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">
            Add your first cohort intake. It will appear on the public /schedule page with a live countdown.
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white text-sm font-semibold rounded-lg hover:bg-cyan-700 transition-colors"
          >
            <Plus size={14} /> Create your first cohort
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <CohortTable
              title="Upcoming & live"
              cohorts={upcoming}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          )}
          {past.length > 0 && (
            <CohortTable
              title="Past intakes"
              cohorts={past}
              onEdit={openEdit}
              onDelete={handleDelete}
              dim
            />
          )}
        </div>
      )}

      {editing && (
        <CohortEditor
          form={editing}
          onClose={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
      )}
    </div>
  );
}

/* ─── Table ───────────────────────────────────────────────────────────── */

function CohortTable({
  title, cohorts, onEdit, onDelete, dim,
}: {
  title: string;
  cohorts: Cohort[];
  onEdit: (c: Cohort) => void;
  onDelete: (c: Cohort) => void;
  dim?: boolean;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">
        {title}
      </h2>
      <div className={`bg-white dark:bg-[#0e141c] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden ${dim ? 'opacity-80' : ''}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#080c11] text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-3">Intake</th>
                <th className="px-5 py-3">Starts</th>
                <th className="px-5 py-3">Enrolled</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map((c) => {
                const pct = c.capacity > 0 ? Math.min(100, Math.round((c.enrolledCount / c.capacity) * 100)) : 0;
                const isAlmostFull = pct >= 80;
                const status = c.status || 'open';
                return (
                  <tr key={c._id} className="border-t border-gray-100 dark:border-slate-800">
                    <td className="px-5 py-3 max-w-xs">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{c.title}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{c.program}</p>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 font-mono">/{c.slug}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700 dark:text-slate-300 whitespace-nowrap">
                      {formatDate(c.startDate)}
                      {c.durationLabel && (
                        <span className="block text-xs text-gray-400 dark:text-slate-500">{c.durationLabel}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <div className="flex-1">
                          <div className="flex items-baseline justify-between text-xs mb-1">
                            <span className="font-medium text-gray-700 dark:text-slate-300">
                              {c.enrolledCount} / {c.capacity}
                            </span>
                            {isAlmostFull && (
                              <span className="text-amber-600 dark:text-amber-400 inline-flex items-center gap-0.5">
                                <AlertTriangle size={10} />
                              </span>
                            )}
                          </div>
                          <div className="h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-amber-500' : 'bg-cyan-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                      {formatNGN(c.priceNgn)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex w-fit text-xs font-semibold px-2 py-0.5 rounded-full ${statusStyle(status)}`}>
                          {status === 'in_progress' ? 'In progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                        {!c.isEnrollmentOpen && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 dark:text-slate-500">
                            <EyeOff size={10} /> Hidden
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => onEdit(c)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 hover:text-cyan-600"
                          aria-label="Edit cohort"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => onDelete(c)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-gray-500 hover:text-red-600"
                          aria-label="Delete cohort"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ─── Editor modal ────────────────────────────────────────────────────── */

function CohortEditor({
  form, onClose, onSaved,
}: {
  form: FormState;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [state, setState] = useState<FormState>(form);
  const createCohort = useCreateCohort();
  const updateCohort = useUpdateCohort();
  const saving = createCohort.isPending || updateCohort.isPending;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.title.trim() || !state.program.trim() || !state.planId || !state.startDate) {
      toast.error('Title, program, plan and start date are all required.');
      return;
    }
    const priceNgn = Number(state.priceNgn);
    const capacity = Number(state.capacity);
    const enrolledCount = Number(state.enrolledCount || 0);

    if (!Number.isFinite(priceNgn) || priceNgn < 0) {
      toast.error('Price must be 0 or greater.');
      return;
    }
    if (!Number.isFinite(capacity) || capacity < 1) {
      toast.error('Capacity must be at least 1.');
      return;
    }
    if (enrolledCount > capacity) {
      toast.error('Enrolled count cannot exceed capacity.');
      return;
    }

    const payload = {
      program: state.program.trim(),
      title: state.title.trim(),
      planId: state.planId,
      startDate: new Date(state.startDate).toISOString(),
      endDate: state.endDate ? new Date(state.endDate).toISOString() : undefined,
      durationLabel: state.durationLabel.trim() || undefined,
      priceNgn,
      capacity,
      enrolledCount,
      isEnrollmentOpen: state.isEnrollmentOpen,
      description: state.description.trim() || undefined,
      instructor: state.instructor.trim() || undefined,
      highlights: state.highlightsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 8),
      order: Number(state.order || 0),
      status: state.status || undefined,
    };

    const onSuccess = (successMsg: string) => () => {
      toast.success(successMsg);
      onSaved();
    };
    const onError = (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Save failed.');
    };

    if (state._id) {
      updateCohort.mutate({ id: state._id, payload }, { onSuccess: onSuccess('Cohort updated.'), onError });
    } else {
      createCohort.mutate(payload, { onSuccess: onSuccess('Cohort created.'), onError });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-[#0e141c] rounded-2xl shadow-2xl w-full max-w-3xl my-8 max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {state._id ? 'Edit cohort intake' : 'New cohort intake'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          <Field label="Title *" hint="Shown on cards, e.g. &quot;Web Dev, Live Cohort · May 2026&quot;">
            <input
              value={state.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Web Dev, Live Cohort · May 2026"
              className="input"
              required
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Program track *">
              <select value={state.program} onChange={(e) => set('program', e.target.value)} className="input" required>
                {PROGRAM_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Linked Checkout plan *" hint="The plan a user is redirected to when they click Enrol.">
              <select value={state.planId} onChange={(e) => set('planId', e.target.value)} className="input" required>
                {PLAN_OPTIONS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Start date & time *">
              <input
                type="datetime-local"
                value={state.startDate}
                onChange={(e) => set('startDate', e.target.value)}
                className="input"
                required
              />
            </Field>
            <Field label="End date (optional)">
              <input
                type="datetime-local"
                value={state.endDate}
                onChange={(e) => set('endDate', e.target.value)}
                className="input"
              />
            </Field>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Duration label">
              <input
                value={state.durationLabel}
                onChange={(e) => set('durationLabel', e.target.value)}
                placeholder="12 weeks"
                className="input"
              />
            </Field>
            <Field label="Price (NGN, full naira)">
              <input
                type="number"
                min="0"
                value={state.priceNgn}
                onChange={(e) => set('priceNgn', e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Sort order">
              <input
                type="number"
                value={state.order}
                onChange={(e) => set('order', e.target.value)}
                className="input"
              />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Capacity *">
              <input
                type="number"
                min="1"
                value={state.capacity}
                onChange={(e) => set('capacity', e.target.value)}
                className="input"
                required
              />
            </Field>
            <Field label="Enrolled count" hint="How many seats are taken (drives spots remaining).">
              <input
                type="number"
                min="0"
                value={state.enrolledCount}
                onChange={(e) => set('enrolledCount', e.target.value)}
                className="input"
              />
            </Field>
          </div>

          <Field label="Instructor">
            <input
              value={state.instructor}
              onChange={(e) => set('instructor', e.target.value)}
              placeholder="Jane Doe"
              className="input"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={state.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              maxLength={1000}
              className="input resize-none"
              placeholder="A short paragraph shown on the cohort card."
            />
          </Field>

          <Field label="Highlights (one per line, max 8)">
            <textarea
              value={state.highlightsText}
              onChange={(e) => set('highlightsText', e.target.value)}
              rows={4}
              className="input resize-none"
              placeholder={`Live instructor-led classes\nWeekly 1-on-1 mentor session\nReal capstone project\nCertificate on completion`}
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Status override" hint="Leave blank to auto-derive from the dates and capacity.">
              <select
                value={state.status}
                onChange={(e) => set('status', e.target.value as FormState['status'])}
                className="input"
              >
                <option value="">Auto (recommended)</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="in_progress">In progress</option>
                <option value="ended">Ended</option>
              </select>
            </Field>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.isEnrollmentOpen}
                  onChange={(e) => set('isEnrollmentOpen', e.target.checked)}
                  className="w-4 h-4 accent-cyan-600"
                />
                <span className="text-sm text-gray-700 dark:text-slate-300 inline-flex items-center gap-1.5">
                  {state.isEnrollmentOpen ? <Eye size={14} /> : <EyeOff size={14} />}
                  Visible on public schedule
                </span>
              </label>
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 bg-cyan-600 text-white text-sm font-semibold rounded-lg hover:bg-cyan-700 disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving…' : 'Save cohort'}
          </button>
        </div>
      </div>

      {/* Inline style for the shared `.input` class, avoids 30+ repeats above */}
      <style>{`
        .input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 0.5rem;
          border: 1px solid rgb(229 231 235);
          background-color: white;
          color: rgb(17 24 39);
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s;
        }
        .input:focus { border-color: rgb(20 184 166); }
        :is(.dark .input) {
          background-color: rgb(15 23 42);
          border-color: rgb(51 65 85);
          color: white;
        }
      `}</style>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{label}</label>
      {children}
      {hint && (
        <p className="mt-1 text-[11px] text-gray-400 dark:text-slate-500 inline-flex items-start gap-1">
          <BookOpen size={10} className="mt-0.5 shrink-0" /> {hint}
        </p>
      )}
    </div>
  );
}

