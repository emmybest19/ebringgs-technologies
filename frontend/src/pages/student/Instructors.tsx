import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Star, Search, Users, ArrowRight, Sparkles } from 'lucide-react';
import api from '../../services/api';
import EmptyState from '../../components/ui/EmptyState';

interface Teacher {
  _id: string;
  name: string;
  avatar?: string;
  bio?: string;
  title?: string;
  specialties?: string[];
  experience?: string;
  featured?: boolean;
}

export default function StudentInstructors() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.get('/users/teachers')
      .then(({ data }) => setTeachers(data?.data?.teachers ?? []))
      .catch(() => setError('Could not load instructors. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = teachers.filter((t) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.title?.toLowerCase().includes(q) ||
      t.bio?.toLowerCase().includes(q) ||
      t.specialties?.some((s) => s.toLowerCase().includes(q))
    );
  });

  const featured = filtered.filter((t) => t.featured);
  const others = filtered.filter((t) => !t.featured);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Instructors</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            Meet the people who'll be teaching you. Click any instructor to learn more.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or skill…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
          />
        </div>
      </div>

      {error ? (
        <EmptyState
          icon={Users}
          title="Couldn't load instructors"
          description={error}
        />
      ) : teachers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No instructors yet"
          description="Instructors will appear here once added by admin."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No instructors match your search"
          description={`Nothing found for "${query}". Try a different name or skill.`}
        />
      ) : (
        <>
          {featured.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-amber-500" />
                <h2 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                  Featured instructors
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
                {featured.map((t) => <InstructorCard key={t._id} t={t} featured />)}
              </div>
            </>
          )}

          {others.length > 0 && (
            <>
              {featured.length > 0 && (
                <h2 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                  All instructors
                </h2>
              )}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {others.map((t) => <InstructorCard key={t._id} t={t} />)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function InstructorCard({ t, featured }: { t: Teacher; featured?: boolean }) {
  return (
    <Link
      to={`/dashboard/instructors/${t._id}`}
      className="group bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-md transition-all overflow-hidden flex flex-col"
    >
      <div className="h-40 overflow-hidden relative bg-linear-to-br from-teal-100 to-cyan-100 dark:from-teal-950 dark:to-cyan-950">
        {t.avatar ? (
          <img src={t.avatar} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-teal-600 dark:text-teal-300">
            {t.name.charAt(0).toUpperCase()}
          </div>
        )}
        {featured && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-amber-500 px-2 py-1 rounded-full">
              <Star size={11} className="fill-white" /> Featured
            </span>
          </div>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <p className="font-bold text-gray-900 dark:text-white">{t.name}</p>
        {t.title && <p className="text-xs text-teal-600 dark:text-teal-400 mt-0.5">{t.title}</p>}
        {t.bio && <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 mt-3 flex-1">{t.bio}</p>}
        {t.specialties && t.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {t.specialties.slice(0, 3).map((s) => (
              <span key={s} className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 text-xs rounded-md font-medium">
                {s}
              </span>
            ))}
            {t.specialties.length > 3 && (
              <span className="px-2 py-0.5 text-gray-400 text-xs">+{t.specialties.length - 3}</span>
            )}
          </div>
        )}
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal-600 group-hover:text-teal-800">
          View profile <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}
