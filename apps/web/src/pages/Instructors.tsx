import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Users, Linkedin, Github, Globe, X } from 'lucide-react';
import { useSEO } from '@ebringgs/ui';

/**
 * Meet the Team, served at /about/team.
 *
 * DARK ONLY, deliberately — colours are unconditional rather than `dark:`
 * variants, matching the rest of the redesigned public pages.
 *
 * Two tiers: `featured` people render as wide leadership rows, everyone else
 * flows into the mentors grid. Adding a person is a matter of appending to the
 * array below; the split is derived, not hand-maintained.
 */

interface Instructor {
  id: string;
  name: string;
  avatar: string;
  title: string;
  bio: string;
  specialties: string[];
  experience: string;
  students: number;
  rating: number;
  image: string;
  social?: { linkedin?: string; github?: string; website?: string };
  featured?: boolean;
}

const instructors: Instructor[] = [
  {
    id: '1',
    name: 'Kofi Mensah',
    avatar: 'KM',
    title: 'Lead Instructor, Web Development',
    bio: 'Full-stack engineer with 10+ years building scalable web applications. Previously at Andela and Paystack. Passionate about mentoring the next generation of African developers.',
    specialties: ['React', 'Node.js', 'TypeScript', 'System Design'],
    experience: '10+ years',
    students: 200,
    rating: 4.9,
    image: '/images/team/ceo.jpg',
    social: { linkedin: '#', github: '#' },
    featured: true,
  },
  {
    id: '2',
    name: 'Adaeze Okafor',
    avatar: 'AO',
    title: 'Senior Instructor, Mobile Development',
    bio: 'Mobile engineer specialising in React Native and Flutter. Has shipped apps with 1M+ downloads. Believes in learning by building real products.',
    specialties: ['React Native', 'Flutter', 'Firebase', 'App Architecture'],
    experience: '8 years',
    students: 150,
    rating: 4.8,
    image: '/images/team/design-lead.jpg',
    social: { linkedin: '#', github: '#' },
    featured: true,
  },
  {
    id: '3',
    name: 'Yusuf Abdullahi',
    avatar: 'YA',
    title: 'Senior Instructor, UI/UX Design',
    bio: 'Product designer who has led design at two YC-backed startups. Specialises in user research, design systems, and making complex products simple.',
    specialties: ['Figma', 'Design Systems', 'User Research', 'Prototyping'],
    experience: '7 years',
    students: 120,
    rating: 4.9,
    image: '/images/team/data-lead.jpg',
    social: { linkedin: '#' },
  },
  {
    id: '4',
    name: 'Chinonso Eze',
    avatar: 'CE',
    title: 'Instructor, Backend Engineering',
    bio: 'Backend specialist focused on APIs, databases, and cloud infrastructure. Teaches the patterns that keep production systems standing.',
    specialties: ['Node.js', 'PostgreSQL', 'Docker', 'AWS'],
    experience: '9 years',
    students: 110,
    rating: 4.7,
    image: '/images/team/backend-lead.jpg',
    social: { linkedin: '#', github: '#' },
  },
  {
    id: '5',
    name: 'Ngozi Ibe',
    avatar: 'NI',
    title: 'Instructor, Data & Analytics',
    bio: 'Data analyst turned educator. Works with messy real-world datasets and teaches students to turn them into decisions stakeholders act on.',
    specialties: ['Python', 'SQL', 'Power BI', 'Pandas'],
    experience: '6 years',
    students: 95,
    rating: 4.8,
    image: '/images/about/team-meeting.jpg',
    social: { linkedin: '#' },
  },
  {
    id: '6',
    name: 'Emeka Nwankwo',
    avatar: 'EN',
    title: 'Mentor, Career Development',
    bio: 'Connects graduates with hiring partners across the continent. Runs portfolio reviews, mock interviews, and salary negotiation clinics.',
    specialties: ['Career Coaching', 'Portfolio Review', 'Interview Prep'],
    experience: '5 years',
    students: 180,
    rating: 4.9,
    image: '/images/about/mission.jpg',
    social: { linkedin: '#' },
  },
];

export default function Instructors() {
  useSEO({
    title: 'Meet the Team',
    description: 'The instructors, mentors and specialists behind E-Bringgs cohorts and client projects.',
    url: 'https://ebringgs.com/about/team',
    image: 'https://ebringgs.com/logo-full.jpg',
  });

  const [selected, setSelected] = useState<Instructor | null>(null);
  const leadership = instructors.filter((i) => i.featured);
  const mentors = instructors.filter((i) => !i.featured);

  return (
    <div className="bg-[#080c11]">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="no-reveal relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(65%_55%_at_50%_5%,rgba(34,211,238,0.09),transparent_65%)]" />
        <div className="relative mx-auto max-w-3xl px-4 pb-20 pt-16 text-center sm:px-6">
          <span className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
            The architects of talent
          </span>
          <h1 className="mt-7 text-4xl font-extrabold leading-[1.1] tracking-tight text-white md:text-5xl">
            Meet the team building Africa&rsquo;s elite tech pipeline
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400">
            We are builders, educators, and architects of scale. Our leadership team has worked at
            global tech giants and regional market leaders, coming together to empower the next
            generation.
          </p>
        </div>
      </section>

      {/* ── Founding leadership ───────────────────────────────────────── */}
      {leadership.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <h2 className="mb-8 text-2xl font-extrabold tracking-tight text-white">
            Founding Leadership
          </h2>
          <div className="space-y-5">
            {leadership.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p)}
                className="flex w-full items-center gap-8 rounded-2xl border border-slate-800 bg-[#0e141c] p-6 text-left transition-colors hover:border-slate-700 sm:p-8"
              >
                <img
                  loading="lazy"
                  src={p.image}
                  alt=""
                  aria-hidden="true"
                  className="hidden h-32 w-32 shrink-0 rounded-full object-cover sm:block"
                />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-3">
                    <span className="text-xl font-bold text-white">{p.name}</span>
                    <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-cyan-300">
                      Leadership
                    </span>
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-amber-400">{p.title}</span>
                  <span className="mt-3 block text-sm leading-relaxed text-slate-400">{p.bio}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Mentors ───────────────────────────────────────────────────── */}
      {mentors.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <h2 className="mb-8 text-2xl font-extrabold tracking-tight text-white">
            Mentors &amp; Support Specialists
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {mentors.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p)}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#0e141c] p-2 text-left transition-colors hover:border-slate-700"
              >
                <div className="overflow-hidden rounded-xl">
                  <img
                    loading="lazy"
                    src={p.image}
                    alt=""
                    aria-hidden="true"
                    className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <p className="text-sm font-bold text-white">{p.name}</p>
                  <p className="mt-0.5 text-xs font-semibold text-cyan-400">{p.title}</p>
                  <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-slate-400">{p.bio}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="px-4 pb-28 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-2xl border border-cyan-400/40 bg-[#0b1119] px-6 py-16 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Ready to learn from the best?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-slate-400">
            Apply to join our upcoming cohort and work directly under veteran software engineers and
            product managers.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3.5 text-sm font-bold text-slate-950 transition-colors hover:bg-cyan-300"
            >
              Apply for Cohort
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-[#0e141c] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:border-slate-600 hover:bg-[#141b26]"
            >
              Speak to an Advisor
            </Link>
          </div>
        </div>
      </section>

      {/* ── Detail modal ──────────────────────────────────────────────── */}
      {/* Not in the design, but it's the only place specialties, experience
          and social links surface — dropping it would lose real content. */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
          role="presentation"
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-800 bg-[#0e141c]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-52">
              <img loading="lazy" src={selected.image} alt="" aria-hidden="true" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-linear-to-t from-[#0e141c] via-transparent to-transparent" />
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6">
              <h2 className="text-xl font-bold text-white">{selected.name}</h2>
              <p className="mt-0.5 text-sm text-cyan-400">{selected.title}</p>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Star size={13} className="fill-gold-400 text-gold-400" /> {selected.rating} rating
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={13} /> {selected.students} students
                </span>
                <span>{selected.experience} experience</span>
              </div>

              <p className="mt-5 text-sm leading-relaxed text-slate-300">{selected.bio}</p>

              <div className="mt-6 flex flex-wrap gap-2">
                {selected.specialties.map((s) => (
                  <span
                    key={s}
                    className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-300"
                  >
                    {s}
                  </span>
                ))}
              </div>

              {selected.social && (
                <div className="mt-6 flex gap-2 border-t border-slate-800 pt-5">
                  {selected.social.linkedin && (
                    <a href={selected.social.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="rounded-lg bg-white/5 p-2 text-slate-400 transition-colors hover:bg-cyan-400/10 hover:text-cyan-400">
                      <Linkedin size={16} />
                    </a>
                  )}
                  {selected.social.github && (
                    <a href={selected.social.github} target="_blank" rel="noreferrer" aria-label="GitHub" className="rounded-lg bg-white/5 p-2 text-slate-400 transition-colors hover:bg-cyan-400/10 hover:text-cyan-400">
                      <Github size={16} />
                    </a>
                  )}
                  {selected.social.website && (
                    <a href={selected.social.website} target="_blank" rel="noreferrer" aria-label="Website" className="rounded-lg bg-white/5 p-2 text-slate-400 transition-colors hover:bg-cyan-400/10 hover:text-cyan-400">
                      <Globe size={16} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
