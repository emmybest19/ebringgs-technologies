import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, Github, Star, Filter, Loader2 } from 'lucide-react';
import { useCaseStudies, type CaseStudy } from '../services/queries';

function formatNGN(kobo: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(kobo / 100);
}

export default function SuccessStories() {
  const { data: studies = [], isLoading: loading } = useCaseStudies();
  const [activeType, setActiveType] = useState<'all' | 'client_work' | 'student_project'>('all');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = useMemo(() => {
    const set = new Set<string>();
    studies.forEach((s) => s.category && set.add(s.category));
    return ['All', ...Array.from(set)];
  }, [studies]);

  const filtered = studies.filter((s) => {
    if (activeType !== 'all' && s.type !== activeType) return false;
    if (activeCategory !== 'All' && s.category !== activeCategory) return false;
    return true;
  });

  const featured = filtered.filter((s) => s.featured);
  const others = filtered.filter((s) => !s.featured);

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      <section className="bg-linear-to-br from-slate-900 via-teal-950 to-cyan-950 text-white py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/20 text-teal-300 text-sm font-medium mb-6">
            <Star size={14} className="fill-teal-300" /> Real work, real outcomes
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Success stories</h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Apps we've shipped, students we've launched, businesses we've supported. The proof, not the pitch.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-teal-600" />
          </div>
        ) : studies.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-500 dark:text-slate-400">More stories coming soon. Check back shortly.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              {([
                { key: 'all', label: 'All' },
                { key: 'client_work', label: 'Client work' },
                { key: 'student_project', label: 'Student projects' },
              ] as const).map((t) => (
                <button key={t.key} onClick={() => setActiveType(t.key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                    activeType === t.key
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700 hover:text-teal-600'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            {categories.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-10 items-center">
                <Filter size={14} className="text-gray-400" />
                {categories.map((cat) => (
                  <button key={cat} onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                      activeCategory === cat
                        ? 'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                        : 'bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-teal-200'
                    }`}>
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-500 dark:text-slate-400">
                Nothing in this filter yet.
              </div>
            ) : (
              <>
                {featured.length > 0 && (
                  <div className="grid md:grid-cols-2 gap-6 mb-10">
                    {featured.map((s) => <FeaturedCard key={s._id} s={s} />)}
                  </div>
                )}
                {others.length > 0 && (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {others.map((s) => <Card key={s._id} s={s} />)}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </section>

      <section className="bg-linear-to-br from-teal-600 to-emerald-700 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-extrabold mb-4">Ready to build yours?</h2>
          <p className="text-teal-200 text-lg mb-8">Whether you want to learn or to ship a product, we've got you.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/services" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-teal-700 font-bold rounded-xl hover:bg-teal-50 transition-colors">
              Buy a service <ArrowRight size={16} />
            </Link>
            <Link to="/pricing" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-700 text-white font-bold rounded-xl hover:bg-teal-800 transition-colors border border-teal-400">
              Browse training <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeaturedCard({ s }: { s: CaseStudy }) {
  return (
    <Link to={`/success-stories/${s.slug}`} className="group block bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {s.coverImage && (
        <div className="h-56 overflow-hidden relative">
          <img src={s.coverImage} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute top-3 left-3">
            <span className="text-xs font-semibold text-white bg-amber-500 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
              <Star size={11} className="fill-white" /> Featured
            </span>
          </div>
        </div>
      )}
      <div className="p-6">
        {s.category && <p className="text-xs font-medium text-teal-600 dark:text-teal-400 mb-2">{s.category}</p>}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{s.title}</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 leading-relaxed">{s.summary}</p>
        <ResultsRow s={s} />
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-teal-600 mt-4">
          Read the story <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}

function Card({ s }: { s: CaseStudy }) {
  return (
    <Link to={`/success-stories/${s.slug}`} className="group block bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-teal-200 dark:hover:border-teal-800 transition-all overflow-hidden">
      {s.coverImage && (
        <div className="h-40 overflow-hidden">
          <img src={s.coverImage} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}
      <div className="p-5">
        {s.category && <p className="text-xs font-medium text-teal-600 dark:text-teal-400 mb-1">{s.category}</p>}
        <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">{s.title}</h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 mb-3">{s.summary}</p>
        <ResultsRow s={s} compact />
      </div>
    </Link>
  );
}

function ResultsRow({ s, compact }: { s: CaseStudy; compact?: boolean }) {
  return (
    <div className={`flex flex-wrap gap-3 text-xs ${compact ? 'text-gray-400 dark:text-slate-500' : 'text-gray-500 dark:text-slate-400'}`}>
      {s.deliveryDays && (
        <span><span className="font-semibold text-gray-700 dark:text-slate-300">Delivered in:</span> {s.deliveryDays} days</span>
      )}
      {s.priceKobo && (
        <span><span className="font-semibold text-gray-700 dark:text-slate-300">Investment:</span> {formatNGN(s.priceKobo)}</span>
      )}
      {s.studentName && (
        <span><span className="font-semibold text-gray-700 dark:text-slate-300">Student:</span> {s.studentName}{s.cohortBatch ? ` · ${s.cohortBatch}` : ''}</span>
      )}
      {s.liveUrl && (
        <span className="flex items-center gap-1"><ExternalLink size={11} /> Live</span>
      )}
      {s.githubUrl && (
        <span className="flex items-center gap-1"><Github size={11} /> Repo</span>
      )}
    </div>
  );
}
