import { Link } from 'react-router-dom';
import { Users, ClipboardList, CalendarDays, Video, ArrowRight } from 'lucide-react';

const stats = [
  { label: 'Active Students', value: '0', icon: Users, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950' },
  { label: 'Upcoming Sessions', value: '0', icon: CalendarDays, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950' },
  { label: 'Pending Reviews', value: '0', icon: ClipboardList, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950' },
  { label: 'Recordings', value: '0', icon: Video, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950' },
];

const quickActions = [
  { to: '/teacher/sessions', label: 'Schedule a session', icon: CalendarDays },
  { to: '/teacher/assignments', label: 'Review assignments', icon: ClipboardList },
  { to: '/teacher/students', label: 'View my students', icon: Users },
];

export default function TeacherOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome, Teacher</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          Manage your classes, students, and assignments from one place.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm">
            <div className={`inline-flex p-2.5 rounded-xl ${bg} mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 dark:text-white mb-4">Quick actions</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {quickActions.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-teal-200 dark:hover:border-teal-800 transition-colors group"
            >
              <Icon size={18} className="text-teal-600 dark:text-teal-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300 flex-1">{label}</span>
              <ArrowRight size={14} className="text-gray-400 dark:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
