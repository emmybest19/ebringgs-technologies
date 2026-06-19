import { useEffect, useState } from 'react';
import { ClipboardList, CheckCircle2 } from 'lucide-react';
import api from '@ebringgs/api';
import { useSEO } from '@ebringgs/ui';

interface Assignment {
  _id: string;
  title: string;
  description: string;
  program: string;
  status: 'submitted' | 'reviewed';
  student: { name: string; email: string };
  submittedAt: string;
  fileUrl?: string;
  fileName?: string;
}

export default function TeacherAssignments() {
  useSEO({ title: 'Assignments', siteName: 'E-Bringgs Teacher Portal' });
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/assignments')
      .then(({ data }) => setAssignments(data?.data?.assignments ?? []))
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Review Student Work</h1>

      {loading ? (
        <div className="p-12 text-center text-gray-400">Loading...</div>
      ) : assignments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-12 text-center">
          <ClipboardList size={40} className="text-gray-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="font-medium text-gray-500 dark:text-slate-400">No assignments to review</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div key={a._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  a.status === 'reviewed' ? 'bg-green-50 dark:bg-green-950' : 'bg-amber-50 dark:bg-amber-950'
                }`}>
                  {a.status === 'reviewed'
                    ? <CheckCircle2 size={18} className="text-green-600" />
                    : <ClipboardList size={18} className="text-amber-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{a.title}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                    {a.student?.name} · {a.program}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mt-2 leading-relaxed">{a.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
