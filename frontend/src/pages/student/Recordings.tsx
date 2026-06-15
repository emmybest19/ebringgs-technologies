import { useState } from 'react';
import { Video, Play, CheckCircle2 } from 'lucide-react';

const sampleRecordings = [
  { id: '1', title: 'Intro to React Hooks', program: 'Web Dev, Starter', instructor: 'Kofi Mensah', date: '2026-03-28', duration: '1h 12m', thumbnail: '/images/learning/video-class.jpg', watched: true },
  { id: '2', title: 'Building REST APIs with Express', program: 'Web Dev, Starter', instructor: 'Kofi Mensah', date: '2026-03-25', duration: '1h 30m', thumbnail: '/images/general/coding-screen.jpg', watched: true },
  { id: '3', title: 'State Management with Zustand', program: 'Web Dev, Cohort', instructor: 'Kofi Mensah', date: '2026-03-21', duration: '58m', thumbnail: '/images/hero/developer-coding.jpg', watched: false },
  { id: '4', title: 'React Native Navigation Deep Dive', program: 'Mobile Dev, Cohort', instructor: 'Adaeze Okafor', date: '2026-03-18', duration: '1h 05m', thumbnail: '/images/general/mobile-app.jpg', watched: false },
  { id: '5', title: 'Figma Auto-Layout Masterclass', program: 'UI/UX, Starter', instructor: 'Yusuf Abdullahi', date: '2026-03-15', duration: '45m', thumbnail: '/images/services/ux-design.jpg', watched: false },
  { id: '6', title: 'TypeScript Generics Explained', program: 'Web Dev, Cohort', instructor: 'Chinonso Eze', date: '2026-03-12', duration: '1h 20m', thumbnail: '/images/learning/students-laptop.jpg', watched: false },
];

export default function StudentRecordings() {
  const [filter, setFilter] = useState('all');
  const programs = ['all', ...new Set(sampleRecordings.map((r) => r.program))];
  const filtered = filter === 'all' ? sampleRecordings : sampleRecordings.filter((r) => r.program === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Class Recordings</h1>
        <div className="flex gap-2 flex-wrap">
          {programs.map((p) => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === p
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {p === 'all' ? 'All' : p}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-12 text-center">
          <Video size={40} className="text-gray-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="font-medium text-gray-500 dark:text-slate-400">No recordings available</p>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Recordings from your live classes will appear here.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((rec) => (
            <div key={rec.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden group">
              <div className="h-36 overflow-hidden relative">
                <img src={rec.thumbnail} alt={rec.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                    <Play size={20} className="text-teal-600 ml-0.5" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white text-xs rounded font-medium">
                  {rec.duration}
                </div>
                {rec.watched && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-green-600 text-white text-xs rounded font-medium flex items-center gap-1">
                    <CheckCircle2 size={10} /> Watched
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">{rec.title}</p>
                <p className="text-xs text-teal-600 dark:text-teal-400 mt-0.5">{rec.program}</p>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-400 dark:text-slate-500">
                  <span>{rec.instructor}</span>
                  <span>{new Date(rec.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
