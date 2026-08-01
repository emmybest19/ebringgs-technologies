import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Linkedin, Github, Globe, Mail, BookOpen, Star, AlertCircle } from 'lucide-react';
import api from '@ebringgs/api';

interface Teacher {
  _id: string;
  name: string;
  avatar?: string;
  bio?: string;
  title?: string;
  specialties?: string[];
  experience?: string;
  social?: { linkedin?: string; github?: string; website?: string };
  featured?: boolean;
  createdAt?: string;
}

export default function StudentInstructorDetail() {
  const { id } = useParams<{ id: string }>();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api.get(`/users/teachers/${id}`)
      .then(({ data }) => setTeacher(data?.data?.teacher ?? null))
      .catch(() => setError('Could not load this instructor.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-teal-600" />
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div className="max-w-xl">
        <Link to="/dashboard/instructors"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors">
          <ArrowLeft size={15} /> Back to instructors
        </Link>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-10 text-center">
          <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
          <p className="text-gray-700 dark:text-slate-300">{error || 'Instructor not found.'}</p>
        </div>
      </div>
    );
  }

  const memberSince = teacher.createdAt
    ? new Date(teacher.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="max-w-4xl">
      <Link to="/dashboard/instructors"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors">
        <ArrowLeft size={15} /> Back to instructors
      </Link>

      {/* Hero card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden mb-6">
        <div className="h-32 bg-linear-to-br from-teal-600 via-cyan-600 to-emerald-600" />
        <div className="px-8 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5 -mt-12">
            <div className="w-24 h-24 rounded-2xl border-4 border-white dark:border-slate-900 bg-linear-to-br from-teal-100 to-cyan-100 dark:from-teal-950 dark:to-cyan-950 overflow-hidden shrink-0">
              {teacher.avatar ? (
                <img loading="lazy" src={teacher.avatar} alt={teacher.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-teal-600 dark:text-teal-300">
                  {teacher.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{teacher.name}</h1>
                {teacher.featured && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                    <Star size={11} className="fill-amber-500 text-amber-500" /> Featured
                  </span>
                )}
              </div>
              {teacher.title && (
                <p className="text-sm text-teal-600 dark:text-teal-400 mt-1">{teacher.title}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500 dark:text-slate-400">
                {teacher.experience && (
                  <span className="flex items-center gap-1.5">
                    <BookOpen size={12} /> {teacher.experience} experience
                  </span>
                )}
                {memberSince && (
                  <span>Member since {memberSince}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          {teacher.bio ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">About</h2>
              <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                {teacher.bio}
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-slate-950 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 text-center">
              <p className="text-sm text-gray-500 dark:text-slate-400">This instructor hasn't added a bio yet.</p>
            </div>
          )}

          {/* Specialties */}
          {teacher.specialties && teacher.specialties.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">Specialties</h2>
              <div className="flex flex-wrap gap-2">
                {teacher.specialties.map((s) => (
                  <span key={s}
                    className="px-3 py-1.5 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-sm font-medium rounded-lg border border-teal-100 dark:border-teal-900">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar, contact / links */}
        <aside className="space-y-4">
          {teacher.social && (teacher.social.linkedin || teacher.social.github || teacher.social.website) && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">Connect</p>
              <div className="space-y-2">
                {teacher.social.linkedin && (
                  <a href={teacher.social.linkedin} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-100 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 transition-colors text-sm text-gray-700 dark:text-slate-300">
                    <Linkedin size={15} className="text-blue-600" /> LinkedIn
                  </a>
                )}
                {teacher.social.github && (
                  <a href={teacher.social.github} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-100 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 transition-colors text-sm text-gray-700 dark:text-slate-300">
                    <Github size={15} className="text-gray-700 dark:text-slate-300" /> GitHub
                  </a>
                )}
                {teacher.social.website && (
                  <a href={teacher.social.website} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-100 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 transition-colors text-sm text-gray-700 dark:text-slate-300">
                    <Globe size={15} className="text-teal-600" /> Website
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="bg-linear-to-br from-teal-600 to-emerald-700 rounded-2xl shadow-sm p-5 text-white">
            <Mail size={20} className="mb-3" />
            <p className="font-bold mb-1">Have a question?</p>
            <p className="text-teal-100 text-sm mb-4">
              Reach out to the team to be connected with {teacher.name.split(' ')[0]}.
            </p>
            <Link to="/contact"
              className="block w-full text-center px-4 py-2.5 bg-white text-teal-700 font-semibold text-sm rounded-xl hover:bg-teal-50 transition-colors">
              Contact us
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
