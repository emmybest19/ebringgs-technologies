import { useEffect, useState } from 'react';
import { Calendar, Clock, Video } from 'lucide-react';
import api from '../../services/api';
import { formatDate } from './_utils';
import type { UpcomingSession } from './_utils';

export default function StudentSchedule() {
  const [sessions, setSessions] = useState<UpcomingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/live-sessions?upcoming=true')
      .then(({ data }) => setSessions(Array.isArray(data?.data) ? data.data : []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Schedule</h1>

      {loading ? (
        <div className="p-12 text-center text-gray-400 dark:text-slate-500">Loading sessions...</div>
      ) : sessions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-12 text-center">
          <Calendar size={36} className="text-gray-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-slate-400">No upcoming sessions scheduled.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => (
            <div key={s._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center shrink-0">
                <Video size={18} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{s.title}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">{s.courseTitle} · {s.instructor}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 dark:text-slate-500">
                  <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(s.scheduledAt)}</span>
                  <span className="flex items-center gap-1"><Clock size={12} />{s.durationMinutes} min</span>
                </div>
              </div>
              <a href={s.meetingUrl || `/classroom/${s.roomId}`}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors shrink-0">
                Join
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
