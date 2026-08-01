import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Users, BookOpen, Linkedin, Github, Globe, X } from 'lucide-react';
import { useSEO } from '@ebringgs/ui';

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
    specialties: ['Figma', 'User Research', 'Design Systems', 'Prototyping'],
    experience: '7 years',
    students: 120,
    rating: 4.9,
    image: '/images/team/data-lead.jpg',
    social: { linkedin: '#', website: '#' },
    featured: true,
  },
  {
    id: '4',
    name: 'Chinonso Eze',
    avatar: 'CE',
    title: 'Instructor, Backend Engineering',
    bio: 'Backend specialist focused on distributed systems and API design. Contributor to open-source projects. Loves breaking down complex architecture into digestible lessons.',
    specialties: ['Python', 'Go', 'PostgreSQL', 'Microservices'],
    experience: '6 years',
    students: 90,
    rating: 4.7,
    image: '/images/team/backend-lead.jpg',
    social: { github: '#' },
  },
  {
    id: '5',
    name: 'Ngozi Ibe',
    avatar: 'NI',
    title: 'Instructor, Data & Analytics',
    bio: 'Data scientist with experience at consulting firms and NGOs. Teaches data analysis, visualisation, and machine learning fundamentals with practical, real-world datasets.',
    specialties: ['Python', 'SQL', 'Tableau', 'Machine Learning'],
    experience: '5 years',
    students: 80,
    rating: 4.8,
    image: '/images/about/team-meeting.jpg',
    social: { linkedin: '#' },
  },
  {
    id: '6',
    name: 'Emeka Nwankwo',
    avatar: 'EN',
    title: 'Mentor, Career Development',
    bio: 'Engineering manager who has hired 50+ developers across Africa. Runs our career coaching sessions, covering CVs, portfolios, interview prep, and salary negotiation.',
    specialties: ['Career Coaching', 'Interview Prep', 'Portfolio Review', 'Salary Negotiation'],
    experience: '12 years',
    students: 300,
    rating: 5.0,
    image: '/images/about/mission.jpg',
    social: { linkedin: '#' },
  },
];

export default function Instructors() {
  useSEO({
    title: 'Instructors',
    description: 'Meet the engineers and designers who teach cohorts and ship client projects at E-Bringgs Technologies.',
    url: 'https://ebringgs.com/instructors',
    image: 'https://ebringgs.com/logo-full.jpg',
  });
  const [selected, setSelected] = useState<Instructor | null>(null);

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      {/* Hero */}
      <section className="bg-linear-to-br from-slate-900 via-teal-950 to-cyan-950 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/20 text-teal-300 text-sm font-medium mb-6">
            <Users size={14} /> Our Team
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Meet Our Instructors</h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Industry professionals who don't just teach, they've built, shipped, and scaled real products. Learn from people who've been where you want to go.
          </p>
        </div>
      </section>

      {/* Featured instructors */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Featured instructors</h2>
        <p className="text-gray-500 dark:text-slate-400 mb-8">Leading our core training tracks</p>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {instructors.filter(i => i.featured).map(inst => (
            <button key={inst.id} onClick={() => setSelected(inst)} className="text-left group">
              <div className="card-hover-border bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-52 overflow-hidden relative">
                  <img loading="lazy" src={inst.image} alt={inst.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="font-bold text-white text-lg">{inst.name}</p>
                    <p className="text-sm text-gray-200">{inst.title}</p>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-slate-400 mb-3">
                    <span className="flex items-center gap-1"><Star size={13} className="fill-gold-500 text-gold-500" /> {inst.rating}</span>
                    <span className="flex items-center gap-1"><Users size={13} /> {inst.students} students</span>
                    <span className="flex items-center gap-1"><BookOpen size={13} /> {inst.experience}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-slate-400 line-clamp-2">{inst.bio}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">All instructors</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instructors.map(inst => (
            <button key={inst.id} onClick={() => setSelected(inst)} className="text-left">
              <div className="card-hover-border bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5 hover:shadow-lg transition-shadow h-full flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-teal-600 dark:text-teal-300 font-bold shrink-0 overflow-hidden">
                    <img loading="lazy" src={inst.image} alt={inst.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{inst.name}</p>
                    <p className="text-xs text-teal-600 dark:text-teal-400">{inst.title}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1">{inst.bio}</p>
                <div className="flex flex-wrap gap-1.5">
                  {inst.specialties.slice(0, 3).map(s => (
                    <span key={s} className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-xs rounded-md font-medium">{s}</span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-linear-to-br from-teal-600 to-emerald-700 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-extrabold mb-4">Learn from the best</h2>
          <p className="text-teal-200 text-lg mb-8">Join our next cohort and get direct access to our expert instructors.</p>
          <Link to="/pricing" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-teal-700 font-bold rounded-xl hover:bg-teal-50 transition-colors">
            View programs <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Instructor detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="h-48 overflow-hidden rounded-t-2xl relative">
              <img loading="lazy" src={selected.image} alt={selected.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
              <button onClick={() => setSelected(null)} className="absolute top-4 right-4 p-2 bg-black/30 text-white rounded-full hover:bg-black/50">
                <X size={16} />
              </button>
            </div>
            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selected.name}</h2>
              <p className="text-sm text-teal-600 dark:text-teal-400 mb-4">{selected.title}</p>

              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-slate-400 mb-4">
                <span className="flex items-center gap-1"><Star size={13} className="fill-gold-500 text-gold-500" /> {selected.rating} rating</span>
                <span className="flex items-center gap-1"><Users size={13} /> {selected.students} students</span>
                <span>{selected.experience} experience</span>
              </div>

              <p className="text-gray-600 dark:text-slate-400 leading-relaxed mb-6">{selected.bio}</p>

              <div className="mb-6">
                <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider font-semibold mb-2">Specialties</p>
                <div className="flex flex-wrap gap-2">
                  {selected.specialties.map(s => (
                    <span key={s} className="px-3 py-1 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-sm rounded-lg font-medium">{s}</span>
                  ))}
                </div>
              </div>

              {selected.social && (
                <div className="flex gap-3 border-t border-gray-100 dark:border-slate-800 pt-4">
                  {selected.social.linkedin && (
                    <a href={selected.social.linkedin} target="_blank" rel="noreferrer" className="p-2 bg-gray-100 dark:bg-slate-800 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                      <Linkedin size={16} className="text-gray-600 dark:text-slate-400" />
                    </a>
                  )}
                  {selected.social.github && (
                    <a href={selected.social.github} target="_blank" rel="noreferrer" className="p-2 bg-gray-100 dark:bg-slate-800 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                      <Github size={16} className="text-gray-600 dark:text-slate-400" />
                    </a>
                  )}
                  {selected.social.website && (
                    <a href={selected.social.website} target="_blank" rel="noreferrer" className="p-2 bg-gray-100 dark:bg-slate-800 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                      <Globe size={16} className="text-gray-600 dark:text-slate-400" />
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
