import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Loader2, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMyProject, useSubmitBrief, useService } from '../../services/queries';

type FieldValue = string | string[];

export default function ProjectBrief() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const { data: project, isLoading: projectLoading, isError: projectError } = useMyProject(projectId);
  const submitBrief = useSubmitBrief();
  const {
    data: service,
    isLoading: serviceLoading,
    isError: serviceError,
  } = useService(project?.serviceId);

  const [loadError, setLoadError] = useState('');
  const [values, setValues] = useState<Record<string, FieldValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // If the project has already been briefed, bounce out — same behavior as before.
  useEffect(() => {
    if (project && project.status !== 'awaiting_brief') {
      navigate(`/client/projects/${project._id}`, { replace: true });
    }
  }, [project, navigate]);

  // Surface any fetch failure (legacy behavior collapsed both into one error string).
  useEffect(() => {
    if (projectError || serviceError) setLoadError('Could not load project brief.');
  }, [projectError, serviceError]);

  // Seed empty form values whenever the service's intakeFields shape arrives,
  // so controlled inputs are stable from first render.
  useEffect(() => {
    if (!service?.intakeFields) return;
    const seed: Record<string, FieldValue> = {};
    service.intakeFields.forEach((f) => {
      seed[f.name] = f.type === 'checkbox-group' ? [] : '';
    });
    setValues(seed);
  }, [service]);

  // The service query is "enabled" only when project.serviceId exists, so
  // its isLoading is true even before the project has loaded. Gate on the
  // project being present to avoid a forever-spinner on the brief page.
  const loading = projectLoading || (!!project?.serviceId && serviceLoading);
  const submitting = submitBrief.isPending;

  const fields = useMemo(() => service?.intakeFields ?? [], [service]);

  const setValue = (name: string, value: FieldValue) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const { [name]: _omit, ...rest } = prev;
      return rest;
    });
  };

  const toggleCheckbox = (name: string, option: string) => {
    setValues((prev) => {
      const current = (prev[name] as string[]) || [];
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, [name]: next };
    });
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    for (const f of fields) {
      if (!f.required) continue;
      const v = values[f.name];
      if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) {
        next[f.name] = 'This field is required.';
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    if (!validate()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    submitBrief.mutate(
      { id: project._id, brief: values },
      {
        onSuccess: () => {
          toast.success('Brief submitted! Our team will be in touch shortly.');
          navigate(`/client/projects/${project._id}`);
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            || 'Could not submit brief. Please try again.';
          toast.error(msg);
        },
      },
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-teal-600" />
      </div>
    );
  }

  if (loadError || !project) {
    return (
      <div className="max-w-xl">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-10 text-center">
          <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
          <p className="text-gray-700 dark:text-slate-300 mb-6">{loadError || 'Project not found.'}</p>
          <Link to="/client/projects" className="text-teal-600 font-medium hover:underline">
            Back to projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate('/client/projects')}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors">
        <ArrowLeft size={15} /> Back to projects
      </button>

      <div className="flex items-center gap-3 mb-2">
        <div className="inline-flex p-2.5 bg-teal-50 dark:bg-teal-950 rounded-xl">
          <ClipboardList size={20} className="text-teal-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Project brief</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm">{project.serviceName}</p>
        </div>
      </div>

      <p className="text-gray-500 dark:text-slate-400 text-sm mb-8 max-w-2xl">
        These details help us start your project the right way. The more specific you can be, the faster we can deliver.
      </p>

      {fields.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-8 text-center">
          <CheckCircle2 size={32} className="text-green-500 mx-auto mb-3" />
          <p className="text-gray-700 dark:text-slate-300 mb-6">No additional info needed for this service. Submit to kick off.</p>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-60 transition-colors"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Submit and kick off
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {fields.map((field) => {
            const value = values[field.name];
            const error = errors[field.name];
            const baseInput = `w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500/20 outline-none transition-colors ${
              error
                ? 'border-red-300 dark:border-red-800 focus:border-red-500'
                : 'border-gray-200 dark:border-slate-700 focus:border-teal-500'
            }`;

            return (
              <div key={field.name} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.helpText && (
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">{field.helpText}</p>
                )}

                {field.type === 'textarea' ? (
                  <textarea
                    value={value as string}
                    onChange={(e) => setValue(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    rows={4}
                    className={`${baseInput} resize-none`}
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={value as string}
                    onChange={(e) => setValue(field.name, e.target.value)}
                    className={baseInput}
                  >
                    <option value="">Select an option…</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'checkbox-group' ? (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {field.options?.map((opt) => {
                      const checked = ((value as string[]) || []).includes(opt);
                      return (
                        <label key={opt}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                            checked
                              ? 'bg-teal-50 dark:bg-teal-950 border-teal-300 dark:border-teal-700'
                              : 'border-gray-200 dark:border-slate-700 hover:border-teal-200 dark:hover:border-teal-800'
                          }`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCheckbox(field.name, opt)}
                            className="w-4 h-4 accent-teal-600"
                          />
                          <span className="text-sm text-gray-700 dark:text-slate-300">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <input
                    type={field.type === 'url' ? 'url' : field.type === 'email' ? 'email' : 'text'}
                    value={value as string}
                    onChange={(e) => setValue(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className={baseInput}
                  />
                )}

                {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
              </div>
            );
          })}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-60 transition-colors"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {submitting ? 'Submitting…' : 'Submit brief and kick off'}
            </button>
            <Link to={`/client/projects/${project._id}`} className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200">
              Save for later
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
