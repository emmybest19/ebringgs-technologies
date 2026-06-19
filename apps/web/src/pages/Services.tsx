import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, GraduationCap, Briefcase } from 'lucide-react';
import { capabilities } from '../data/capabilities';

// One canonical surface for what E-Bringgs does. Each capability serves a
// dual audience: students who want to LEARN the skill and clients who want
// us to DELIVER it. Cards click through to `/services/:slug` where the
// dual-track detail page expands on both.

export default function Services() {
  return (
    <div className="bg-white dark:bg-slate-900">
      {/* Hero header */}
      <section className="relative text-white py-24 px-4 overflow-hidden">
        <img src="/images/general/tech-team.jpg" alt="Tech team" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-br from-slate-900/90 to-teal-950/85" />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur text-xs font-medium mb-5">
            <Sparkles size={14} /> Learn it. Or hire us to build it.
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Services built around your goals</h1>
          <p className="text-slate-200 text-lg">
            Every skill we teach is a skill we ship. Students enroll to learn it, clients hire us to build it, and graduates often work alongside our team on real projects.
          </p>

          {/* Dual-audience chips */}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-white text-xs font-medium">
              <GraduationCap size={13} /> Students enroll
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-white text-xs font-medium">
              <Briefcase size={13} /> Clients book projects
            </span>
          </div>
        </div>
      </section>

      {/* Capability grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {capabilities.map(({ slug, icon: Icon, title, tagline, color, bg, img }) => (
            <Link
              key={slug}
              to={`/services/${slug}`}
              className="card-hover-border group flex flex-col rounded-2xl border border-gray-100 dark:border-slate-800 hover:border-teal-200 hover:shadow-xl transition-all duration-300 dark:bg-slate-800 overflow-hidden"
            >
              <div className="h-40 overflow-hidden">
                <img src={img} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className={`inline-flex p-3 rounded-xl ${bg} mb-4 self-start`}>
                  <Icon size={24} className={color} />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">{title}</h3>
                <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed">{tagline}</p>

                <span className={`inline-flex items-center gap-1 mt-auto pt-6 text-sm font-medium ${color}`}>
                  Learn more <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-14 flex flex-wrap justify-center gap-3">
          <Link to="/courses" className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:-translate-y-0.5 transition-all">
            <GraduationCap size={16} /> Browse cohorts to enroll in
          </Link>
          <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-slate-300 hover:border-teal-300 hover:text-teal-600 transition-colors">
            <Briefcase size={16} /> Book us for a project
          </Link>
          <Link to="/pricing" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-teal-600 transition-colors">
            See pricing <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gray-50 dark:bg-slate-950 py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Not seeing what you need?</h2>
          <p className="text-gray-500 dark:text-slate-400 mb-8">
            Let's talk. We'll help you figure out the right approach for your goals.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors"
          >
            Talk to us <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
