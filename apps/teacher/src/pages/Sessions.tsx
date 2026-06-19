import { CalendarDays } from 'lucide-react';
import { useSEO } from '@ebringgs/ui';

export default function TeacherSessions() {
  useSEO({ title: 'Sessions', siteName: 'E-Bringgs Teacher Portal' });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Sessions</h1>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-12 text-center">
        <CalendarDays size={40} className="text-gray-200 dark:text-slate-700 mx-auto mb-3" />
        <p className="font-medium text-gray-500 dark:text-slate-400">No sessions scheduled</p>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
          Your scheduled live classes will appear here.
        </p>
      </div>
    </div>
  );
}
