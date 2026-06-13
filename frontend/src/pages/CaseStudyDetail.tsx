import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Github, Loader2, Quote, ShoppingCart, Star, AlertCircle, GraduationCap, Briefcase } from 'lucide-react';
import { useCaseStudy } from '../services/queries';

function formatNGN(kobo: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(kobo / 100);
}

export default function CaseStudyDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { pathname } = useLocation();
  const { data: study, isLoading: loading, isError } = useCaseStudy(slug);
  const error = isError ? 'Could not load this case study.' : '';

  // Honour the back-link to whichever index the visitor came from.
  const cameFromPortfolio = pathname.startsWith('/portfolio');
  const backTo = cameFromPortfolio ? '/portfolio' : '/success-stories';
  const backLabel = cameFromPortfolio ? 'All portfolio projects' : 'All success stories';

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-teal-600" />
      </div>
    );
  }

  if (error || !study) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <AlertCircle size={32} className="text-red-500 mb-3" />
        <p className="text-gray-700 dark:text-slate-300 mb-4">{error || 'Case study not found.'}</p>
        <Link to={backTo} className="text-teal-600 font-medium hover:underline">Back to {backLabel.toLowerCase()}</Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-teal-950 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={backTo} className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft size={14} /> {backLabel}
          </Link>
          <div className="flex items-center gap-2 mb-4">
            {study.category && (
              <span className="text-xs font-semibold text-teal-300 bg-teal-500/20 px-3 py-1 rounded-full">{study.category}</span>
            )}
            {study.featured && (
              <span className="text-xs font-semibold text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full inline-flex items-center gap-1">
                <Star size={11} className="fill-amber-300" /> Featured
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4">{study.title}</h1>
          <p className="text-slate-300 text-lg leading-relaxed max-w-3xl">{study.summary}</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Cover image */}
          {study.coverImage && (
            <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800">
              <img src={study.coverImage} alt={study.title} className="w-full h-auto object-cover" />
            </div>
          )}

          {/* Student profile (only on student projects) */}
          {study.type === 'student_project' && study.studentName && (
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/60 dark:to-cyan-950/60 rounded-2xl border border-teal-100 dark:border-teal-900 p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-teal-100 dark:bg-teal-900 overflow-hidden flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-xl shrink-0">
                  {study.studentAvatar ? (
                    <img src={study.studentAvatar} alt={study.studentName} className="w-full h-full object-cover" />
                  ) : (
                    study.studentName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1 inline-flex items-center gap-1">
                    <GraduationCap size={11} /> Built by a student
                  </p>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">{study.studentName}</h3>
                  {study.studentRole && (
                    <p className="text-sm text-gray-600 dark:text-slate-400 inline-flex items-center gap-1.5 mt-0.5">
                      <Briefcase size={12} /> {study.studentRole}
                    </p>
                  )}
                  {study.cohortBatch && (
                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">Cohort: {study.cohortBatch}</p>
                  )}
                </div>
              </div>
              {study.studentBio && (
                <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed mt-4 pt-4 border-t border-teal-100 dark:border-teal-900">
                  {study.studentBio}
                </p>
              )}
            </div>
          )}

          {/* Description */}
          {study.description && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">The story</h2>
              <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
                {study.description}
              </div>
            </div>
          )}

          {/* Results */}
          {study.results && study.results.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Results</h2>
              <ul className="space-y-2">
                {study.results.map((r) => (
                  <li key={r} className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-950 rounded-xl border border-emerald-100 dark:border-emerald-900">
                    <span className="text-emerald-600 mt-0.5">→</span>
                    <span className="text-sm text-gray-700 dark:text-slate-300">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Gallery */}
          {study.gallery && study.gallery.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Gallery</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {study.gallery.map((img, i) => (
                  <img key={i} src={img} alt={`${study.title} ${i + 1}`}
                    className="rounded-xl border border-gray-100 dark:border-slate-800 w-full h-auto object-cover" />
                ))}
              </div>
            </div>
          )}

          {/* Testimonial */}
          {study.testimonial?.quote && (
            <div className="bg-teal-50 dark:bg-teal-950 rounded-2xl border border-teal-100 dark:border-teal-900 p-6">
              <Quote size={28} className="text-teal-500 mb-3" />
              <p className="text-gray-800 dark:text-slate-200 italic leading-relaxed mb-4">"{study.testimonial.quote}"</p>
              <div className="flex items-center gap-3">
                {study.testimonial.avatar && (
                  <img src={study.testimonial.avatar} alt={study.testimonial.name} className="w-10 h-10 rounded-full object-cover" />
                )}
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{study.testimonial.name}</p>
                  {study.testimonial.title && (
                    <p className="text-xs text-gray-500 dark:text-slate-400">{study.testimonial.title}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tech stack */}
          {study.techStack && study.techStack.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">Built with</h2>
              <div className="flex flex-wrap gap-2">
                {study.techStack.map((t) => (
                  <span key={t} className="px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-sm rounded-lg font-medium">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 sticky top-24">
            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">At a glance</p>
            <dl className="space-y-3 text-sm">
              {study.deliveryDays && (
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500 dark:text-slate-400">Delivered in</dt>
                  <dd className="font-semibold text-gray-900 dark:text-white text-right">{study.deliveryDays} days</dd>
                </div>
              )}
              {study.priceKobo && (
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500 dark:text-slate-400">Investment</dt>
                  <dd className="font-semibold text-gray-900 dark:text-white text-right">{formatNGN(study.priceKobo)}</dd>
                </div>
              )}
              {study.clientName && (
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500 dark:text-slate-400">Client</dt>
                  <dd className="font-semibold text-gray-900 dark:text-white text-right">{study.clientName}</dd>
                </div>
              )}
              {study.studentName && (
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500 dark:text-slate-400">Student</dt>
                  <dd className="font-semibold text-gray-900 dark:text-white text-right">{study.studentName}</dd>
                </div>
              )}
              {study.studentRole && (
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500 dark:text-slate-400">Now</dt>
                  <dd className="font-semibold text-gray-900 dark:text-white text-right">{study.studentRole}</dd>
                </div>
              )}
              {study.cohortBatch && (
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500 dark:text-slate-400">Cohort</dt>
                  <dd className="font-semibold text-gray-900 dark:text-white text-right">{study.cohortBatch}</dd>
                </div>
              )}
            </dl>

            {(study.liveUrl || study.githubUrl) && (
              <div className="mt-5 pt-5 border-t border-gray-100 dark:border-slate-800 space-y-2">
                {study.liveUrl && (
                  <a href={study.liveUrl} target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-900 dark:bg-slate-700 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-slate-600 transition-colors">
                    <ExternalLink size={14} /> View live
                  </a>
                )}
                {study.githubUrl && (
                  <a href={study.githubUrl} target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:border-teal-300 hover:text-teal-600 transition-colors">
                    <Github size={14} /> View code
                  </a>
                )}
              </div>
            )}

            {study.serviceId && (
              <Link to={`/services/${study.serviceId}`}
                className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors">
                <ShoppingCart size={14} /> Buy this service
              </Link>
            )}

            {study.type === 'student_project' && (
              <Link to="/pricing"
                className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors">
                <GraduationCap size={14} /> Join the next cohort
              </Link>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
