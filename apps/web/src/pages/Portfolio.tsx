import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ExternalLink, Github, Filter, Loader2, GraduationCap,
  Briefcase, Sparkles, Users, Code2,
} from 'lucide-react';
import { useCaseStudies, type CaseStudy } from '../services/queries';
import { useSEO } from '@ebringgs/ui';

// `Portfolio` only shows student projects, we alias the shared CaseStudy
// type to keep the page-local variable names ergonomic.
type StudentProject = CaseStudy;

export default function Portfolio() {
  useSEO({
    title: 'Student Portfolio, E-Bringgs Technologies',
    description:
      'Real apps, real outcomes. Browse projects built by E-Bringgs students, and see where they are working today.',
  });

  const { data: projects = [], isLoading: loading } = useCaseStudies({ type: 'student_project' });
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeCohort, setActiveCohort] = useState('All');

  const categories = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => p.category && set.add(p.category));
    return ['All', ...Array.from(set)];
  }, [projects]);

  const cohorts = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => p.cohortBatch && set.add(p.cohortBatch));
    return ['All', ...Array.from(set)];
  }, [projects]);

  const filtered = projects.filter((p) => {
    if (activeCategory !== 'All' && p.category !== activeCategory) return false;
    if (activeCohort !== 'All' && p.cohortBatch !== activeCohort) return false;
    return true;
  });

  const featured = filtered.filter((p) => p.featured);
  const others = filtered.filter((p) => !p.featured);

  // Compose a short list of company names from student "current role" strings
  // (we don't store companies separately, we extract from the free-text role).
  const employerStrip = useMemo(() => {
    const employers = projects
      .map((p) => p.studentRole || '')
      .map((role) => {
        // best-effort: pull the bit after "at " or fall back to the whole string
        const idx = role.toLowerCase().indexOf(' at ');
        return idx >= 0 ? role.slice(idx + 4).trim() : role.trim();
      })
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .slice(0, 10);
    return employers;
  }, [projects]);

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br from-slate-900 via-teal-950 to-cyan-950 text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-sm font-medium mb-6">
            <GraduationCap size={14} /> Student portfolio
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
            Apps our students shipped.{' '}
            <span className="bg-linear-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Careers they launched.
            </span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-8">
            Every project below was built by a student during or after a cohort.
            They are the proof that our programs work, and that you can build the next one.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-teal-500/30"
            >
              Join the next cohort <ArrowRight size={16} />
            </Link>
            <Link
              to="/success-stories"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-colors"
            >
              See all success stories
            </Link>
          </div>
        </div>
      </section>

      {/* Outcomes stats strip */}
      <section className="bg-gray-50 dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <Stat
            icon={Code2}
            value={projects.length || 0}
            suffix={projects.length === 1 ? ' project' : ' projects'}
            label="Built by students"
          />
          <Stat
            icon={Users}
            value={cohorts.length - 1}  // minus 'All'
            label={cohorts.length === 2 ? 'Cohort represented' : 'Cohorts represented'}
            fallback={cohorts.length <= 1}
          />
          <Stat
            icon={Briefcase}
            value={employerStrip.length}
            label="Companies hiring our grads"
            fallback={employerStrip.length === 0}
          />
          <Stat
            icon={Sparkles}
            value={featured.length}
            label="Featured this month"
            fallback={featured.length === 0}
          />
        </div>
      </section>

      {/* Filters + grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-teal-600" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-24 max-w-md mx-auto">
            <GraduationCap size={36} className="mx-auto text-gray-300 dark:text-slate-700 mb-4" />
            <p className="text-gray-700 dark:text-slate-300 font-semibold mb-1">No portfolio pieces yet</p>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
              We are publishing the first batch of student work soon. Check back, or join the next cohort and be the first.
            </p>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors"
            >
              View programs <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <>
            {(categories.length > 1 || cohorts.length > 1) && (
              <div className="space-y-3 mb-10">
                {categories.length > 1 && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mr-1 inline-flex items-center gap-1">
                      <Filter size={12} /> Category
                    </span>
                    {categories.map((cat) => (
                      <Chip
                        key={cat}
                        label={cat}
                        active={activeCategory === cat}
                        onClick={() => setActiveCategory(cat)}
                      />
                    ))}
                  </div>
                )}
                {cohorts.length > 1 && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mr-1 inline-flex items-center gap-1">
                      <GraduationCap size={12} /> Cohort
                    </span>
                    {cohorts.map((c) => (
                      <Chip
                        key={c}
                        label={c}
                        active={activeCohort === c}
                        onClick={() => setActiveCohort(c)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-500 dark:text-slate-400">
                Nothing matches that filter yet.
              </div>
            ) : (
              <>
                {featured.length > 0 && (
                  <div className="grid md:grid-cols-2 gap-6 mb-10">
                    {featured.map((p) => (
                      <FeaturedProjectCard key={p._id} p={p} />
                    ))}
                  </div>
                )}
                {others.length > 0 && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {others.map((p) => (
                      <ProjectCard key={p._id} p={p} />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </section>

      {/* Where they work now */}
      {employerStrip.length > 0 && (
        <section className="bg-gray-50 dark:bg-slate-950 border-y border-gray-100 dark:border-slate-800 py-14">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-4">
              Where they are now
            </p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Our graduates ship at
            </p>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
              {employerStrip.map((employer) => (
                <span
                  key={employer}
                  className="text-base md:text-lg font-semibold text-gray-700 dark:text-slate-300 px-4 py-2 bg-white dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-800"
                >
                  {employer}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-linear-to-br from-teal-600 to-emerald-700 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Your project could be here next</h2>
          <p className="text-teal-100 text-lg mb-8">
            Pick a track, ship a real app, get featured. That is the loop.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-teal-700 font-bold rounded-xl hover:bg-teal-50 transition-colors"
            >
              View training pricing <ArrowRight size={16} />
            </Link>
            <Link
              to="/how-it-works"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-700 text-white font-bold rounded-xl hover:bg-teal-800 transition-colors border border-teal-400"
            >
              How it works
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── Small bits ──────────────────────────────────────────────────────── */

function Chip({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
        active
          ? 'bg-teal-600 text-white border-teal-600'
          : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700 hover:text-teal-600'
      }`}
    >
      {label}
    </button>
  );
}

function Stat({
  icon: Icon, value, suffix = '', label, fallback,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  value: number;
  suffix?: string;
  label: string;
  fallback?: boolean;
}) {
  return (
    <div>
      <Icon size={22} className="mx-auto text-teal-600 dark:text-teal-400 mb-2" />
      <p className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">
        {fallback ? '-' : (
          <>
            {value.toLocaleString()}
            {suffix}
          </>
        )}
      </p>
      <p className="text-xs md:text-sm text-gray-500 dark:text-slate-400 mt-1">{label}</p>
    </div>
  );
}

/* ─── Cards ───────────────────────────────────────────────────────────── */

function FeaturedProjectCard({ p }: { p: StudentProject }) {
  return (
    <Link
      to={`/success-stories/${p.slug}`}
      className="group block bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all overflow-hidden"
    >
      {p.coverImage && (
        <div className="h-56 overflow-hidden relative">
          <img
            src={p.coverImage}
            alt={p.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3">
            <span className="text-xs font-semibold text-white bg-amber-500 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
              <Sparkles size={11} /> Featured
            </span>
          </div>
        </div>
      )}
      <div className="p-6">
        {p.category && (
          <p className="text-xs font-medium text-teal-600 dark:text-teal-400 mb-2">{p.category}</p>
        )}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{p.title}</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 leading-relaxed line-clamp-3">
          {p.summary}
        </p>

        <StudentBlock p={p} />

        <div className="flex items-center justify-between mt-5 pt-5 border-t border-gray-100 dark:border-slate-800">
          <div className="flex gap-3 text-xs text-gray-400 dark:text-slate-500">
            {p.liveUrl && (
              <span className="inline-flex items-center gap-1"><ExternalLink size={11} /> Live</span>
            )}
            {p.githubUrl && (
              <span className="inline-flex items-center gap-1"><Github size={11} /> Repo</span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-teal-600">
            View project <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function ProjectCard({ p }: { p: StudentProject }) {
  return (
    <Link
      to={`/success-stories/${p.slug}`}
      className="group block bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-teal-200 dark:hover:border-teal-800 transition-all overflow-hidden"
    >
      {p.coverImage && (
        <div className="h-40 overflow-hidden">
          <img
            src={p.coverImage}
            alt={p.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      <div className="p-5">
        {p.category && (
          <p className="text-xs font-medium text-teal-600 dark:text-teal-400 mb-1">{p.category}</p>
        )}
        <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">{p.title}</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 mb-4">{p.summary}</p>

        <StudentBlock p={p} compact />

        {(p.liveUrl || p.githubUrl || (p.techStack && p.techStack.length > 0)) && (
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 text-xs text-gray-400 dark:text-slate-500">
            {p.liveUrl && (
              <span className="inline-flex items-center gap-1"><ExternalLink size={11} /> Live</span>
            )}
            {p.githubUrl && (
              <span className="inline-flex items-center gap-1"><Github size={11} /> Repo</span>
            )}
            {p.techStack && p.techStack[0] && (
              <span className="truncate">· {p.techStack.slice(0, 3).join(' · ')}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

function StudentBlock({ p, compact }: { p: StudentProject; compact?: boolean }) {
  if (!p.studentName) return null;
  return (
    <div className={`flex items-center gap-3 ${compact ? '' : 'p-3 bg-gray-50 dark:bg-slate-950 rounded-xl'}`}>
      <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-teal-700 dark:text-teal-300 font-semibold text-sm shrink-0 overflow-hidden">
        {p.studentAvatar ? (
          <img src={p.studentAvatar} alt={p.studentName} className="w-full h-full object-cover" />
        ) : (
          p.studentName.charAt(0).toUpperCase()
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.studentName}</p>
        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
          {p.studentRole || p.cohortBatch || 'Student project'}
        </p>
      </div>
    </div>
  );
}
