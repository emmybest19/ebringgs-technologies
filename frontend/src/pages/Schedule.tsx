import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Clock, Users, ArrowRight, ChevronLeft, ChevronRight,
  MapPin, Video, Loader2, CalendarPlus, AlertCircle, Sparkles,
  CheckCircle2, GraduationCap,
} from 'lucide-react';
import api from '../services/api';
import { useCohorts, type Cohort } from '../services/queries';
import { useSEO } from '../hooks/useSEO';

/* ─── Types ───────────────────────────────────────────────────────────── */

interface PublicSession {
  _id: string;
  title: string;
  courseTitle?: string;
  instructor: string;
  scheduledAt: string;
  durationMinutes: number;
  status: 'upcoming' | 'live' | 'ended';
  enrolledCount: number;
}

// Cohort + CohortStatus are imported from services/queries — live-session
// fetching still uses the old pattern until that domain is migrated.

/* ─── Formatting helpers ──────────────────────────────────────────────── */

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatNGN(naira: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(naira);
}

/* ─── Countdown ───────────────────────────────────────────────────────── */

interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

/**
 * Live ticker that recomputes the time-to-target every second.
 * Returns zeroes once the target has passed.
 */
function useCountdown(targetIso?: string): CountdownParts {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!targetIso) return;
    // Tick on a 1s interval. We don't try to sync to the wall-clock boundary
    // — the visible jitter is imperceptible on display sizes.
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  if (!targetIso) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
  }

  const totalMs = Math.max(0, new Date(targetIso).getTime() - now);
  const totalSeconds = Math.floor(totalMs / 1000);
  return {
    days:    Math.floor(totalSeconds / 86400),
    hours:   Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalMs,
  };
}

/* ─── ICS calendar export ─────────────────────────────────────────────── */

function escapeIcs(s: string): string {
  // RFC 5545 says we need to escape backslashes, semicolons, commas, and newlines.
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

function formatIcsDate(iso: string): string {
  // YYYYMMDDTHHmmssZ — UTC. Strip non-digits and append the Z.
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function downloadCohortIcs(c: Cohort) {
  const start = formatIcsDate(c.startDate);
  // If no endDate is set, default to a 2-hour slot for the kickoff session.
  const endIso = c.endDate || new Date(new Date(c.startDate).getTime() + 2 * 60 * 60 * 1000).toISOString();
  const end = formatIcsDate(endIso);
  const stamp = formatIcsDate(new Date().toISOString());

  const summary = `${c.title} — kickoff`;
  const description = [
    c.description,
    c.instructor ? `Instructor: ${c.instructor}` : null,
    c.durationLabel ? `Program length: ${c.durationLabel}` : null,
    `Enrol: ${window.location.origin}/checkout?plan=${encodeURIComponent(c.planId)}`,
  ].filter(Boolean).join('\n');

  const url = `${window.location.origin}/schedule`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//E-Bringgs Technologies//Cohort Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:cohort-${c._id}@ebringgs`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcs(summary)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    `URL:${escapeIcs(url)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = `${c.slug || 'cohort'}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after the click so the download is committed.
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

/* ─── Page ────────────────────────────────────────────────────────────── */

export default function Schedule() {
  useSEO({
    title: 'Live Class Schedule & Next Cohort Intake',
    description:
      'Countdown to our next cohort intake, plus the live class schedule. Reserve a seat in the next batch of E-Bringgs students.',
  });

  const [sessions, setSessions] = useState<PublicSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeProgram, setActiveProgram] = useState('All');

  // Fetch live sessions (legacy pattern — live-session domain not yet migrated).
  useEffect(() => {
    api.get('/live-sessions?upcoming=true')
      .then(({ data }) => setSessions(Array.isArray(data.data) ? data.data : []))
      .catch(() => setSessions([]))
      .finally(() => setLoadingSessions(false));
  }, []);

  // Upcoming cohorts via TanStack. Cohorts are non-fatal — if the query fails,
  // the rest of the schedule (live-session calendar) still renders.
  const {
    data: cohorts = [],
    isLoading: loadingCohorts,
    isError: cohortsErrored,
  } = useCohorts({ upcoming: true, limit: 20 });
  const error = cohortsErrored ? 'We could not load upcoming cohorts. Refresh to try again.' : '';

  // The "next intake" is the soonest upcoming cohort — already sorted by API.
  const nextCohort = cohorts[0];
  const countdown = useCountdown(nextCohort?.startDate);

  const programs = useMemo(() => {
    const set = new Set<string>();
    cohorts.forEach((c) => set.add(c.program));
    return ['All', ...Array.from(set)];
  }, [cohorts]);

  const filteredCohorts = useMemo(
    () => (activeProgram === 'All' ? cohorts : cohorts.filter((c) => c.program === activeProgram)),
    [cohorts, activeProgram],
  );

  /* Calendar helpers (live sessions only) */
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const sessionsByDate: Record<string, PublicSession[]> = {};
  sessions.forEach((s) => {
    const key = new Date(s.scheduledAt).toISOString().split('T')[0];
    if (!sessionsByDate[key]) sessionsByDate[key] = [];
    sessionsByDate[key].push(s);
  });
  const selectedSessions = selectedDate ? sessionsByDate[selectedDate] || [] : [];

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      {/* ─── Hero with countdown ───────────────────────────────────── */}
      <CountdownHero
        nextCohort={nextCohort}
        countdown={countdown}
        loading={loadingCohorts}
      />

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-xl px-4 py-3 text-sm inline-flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        </div>
      )}

      {/* ─── Upcoming cohort grid ──────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              All upcoming intakes
            </h2>
            <p className="text-gray-500 dark:text-slate-400">
              Pick the next cohort that fits your schedule. Seats are limited.
            </p>
          </div>
          {programs.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {programs.map((p) => (
                <button
                  key={p}
                  onClick={() => setActiveProgram(p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    activeProgram === p
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700 hover:text-teal-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {loadingCohorts ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-teal-600" />
          </div>
        ) : filteredCohorts.length === 0 ? (
          <EmptyCohortState />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCohorts.map((c) => (
              <CohortCard key={c._id} cohort={c} />
            ))}
          </div>
        )}
      </section>

      {/* ─── Live class calendar ───────────────────────────────────── */}
      <section className="bg-gray-50 dark:bg-slate-950 border-y border-gray-100 dark:border-slate-800 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Live class calendar
            </h2>
            <p className="text-gray-500 dark:text-slate-400">
              Individual live classes scheduled across all active cohorts.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {MONTHS[month]} {year}
                  </h3>
                  <div className="flex gap-1">
                    <button
                      onClick={prevMonth}
                      aria-label="Previous month"
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <ChevronLeft size={18} className="text-gray-600 dark:text-slate-400" />
                    </button>
                    <button
                      onClick={nextMonth}
                      aria-label="Next month"
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <ChevronRight size={18} className="text-gray-600 dark:text-slate-400" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAYS.map((d) => (
                    <div key={d} className="text-center text-xs font-semibold text-gray-400 dark:text-slate-500 py-2">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-12" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const hasSessions = !!sessionsByDate[dateKey];
                    const isSelected = selectedDate === dateKey;
                    const isToday = dateKey === new Date().toISOString().split('T')[0];

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                        aria-label={`${MONTHS[month]} ${day}${hasSessions ? ' (has classes)' : ''}`}
                        className={`h-12 rounded-xl text-sm font-medium relative transition-all ${
                          isSelected
                            ? 'bg-teal-600 text-white'
                            : isToday
                              ? 'bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 ring-1 ring-teal-200 dark:ring-teal-800'
                              : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {day}
                        {hasSessions && (
                          <span
                            className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                              isSelected ? 'bg-white' : 'bg-teal-500'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDate && (
                <div className="mt-6">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                    Classes on {formatDate(selectedDate)}
                  </h3>
                  {selectedSessions.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-8 text-center">
                      <Calendar size={32} className="text-gray-300 dark:text-slate-700 mx-auto mb-2" />
                      <p className="text-gray-400 dark:text-slate-500 text-sm">No classes scheduled for this date.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedSessions.map((s) => (
                        <SessionRow key={s._id} s={s} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar: at-a-glance */}
            <aside className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Next 5 live classes</h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-5">
                  All times shown in your local timezone.
                </p>

                {loadingSessions ? (
                  <div className="py-6 flex items-center justify-center">
                    <Loader2 size={20} className="animate-spin text-teal-600" />
                  </div>
                ) : sessions.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    No live classes scheduled yet. Once an admin schedules them, they will appear here.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {sessions.slice(0, 5).map((s) => (
                      <div
                        key={s._id}
                        className="p-3 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-100 dark:border-slate-800"
                      >
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{s.title}</p>
                        {s.courseTitle && (
                          <p className="text-xs text-teal-600 dark:text-teal-400 truncate">{s.courseTitle}</p>
                        )}
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 dark:text-slate-400 mt-1.5">
                          <span className="flex items-center gap-1"><Calendar size={11} /> {formatDate(s.scheduledAt)}</span>
                          <span className="flex items-center gap-1"><Clock size={11} /> {formatTime(s.scheduledAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Link
                  to="/pricing"
                  className="mt-5 flex items-center justify-center gap-2 py-3 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors"
                >
                  View all programs <ArrowRight size={14} />
                </Link>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-3">Legend</p>
                <div className="space-y-2 text-xs text-gray-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                    Has scheduled classes
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md ring-1 ring-teal-200 dark:ring-teal-800 bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-[10px] text-teal-600">T</span>
                    Today
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-gray-400" /> All classes are online via live video
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─────────────────────────────────────────────── */}
      <section className="bg-linear-to-br from-teal-600 to-emerald-700 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Not sure which cohort to join?</h2>
          <p className="text-teal-100 text-lg mb-8">
            Tell us your goals and we will point you to the right program.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-teal-700 font-bold rounded-xl hover:bg-teal-50 transition-colors"
            >
              Talk to us <ArrowRight size={16} />
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

/* ─── Sub-components ──────────────────────────────────────────────────── */

function CountdownHero({
  nextCohort, countdown, loading,
}: {
  nextCohort?: Cohort;
  countdown: CountdownParts;
  loading: boolean;
}) {
  return (
    <section className="relative overflow-hidden bg-linear-to-br from-slate-900 via-teal-950 to-cyan-950 text-white">
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-sm font-medium mb-6">
          <Calendar size={14} /> Class schedule
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight">
          {loading ? 'Loading next intake…'
            : nextCohort
              ? <>The next cohort starts in <span className="bg-linear-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">{countdown.days} days</span></>
              : 'Live class schedule'}
        </h1>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 size={24} className="animate-spin text-teal-300" />
          </div>
        ) : !nextCohort ? (
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            We are between cohorts right now — fresh intakes drop monthly.
            Subscribe to the newsletter or talk to us to be first in line.
          </p>
        ) : (
          <>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-8">
              <span className="font-semibold text-white">{nextCohort.title}</span>
              {nextCohort.durationLabel && <> · {nextCohort.durationLabel}</>} ·{' '}
              Starts {formatDate(nextCohort.startDate)}
            </p>

            {/* Big animated counter */}
            <div className="flex justify-center gap-3 md:gap-4 mb-8 flex-wrap" role="timer" aria-live="polite">
              <CountdownCell value={countdown.days}    label="Days"    />
              <CountdownCell value={countdown.hours}   label="Hours"   />
              <CountdownCell value={countdown.minutes} label="Minutes" />
              <CountdownCell value={countdown.seconds} label="Seconds" />
            </div>

            {/* Spots remaining */}
            <SpotsRemainingBadge cohort={nextCohort} />

            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <Link
                to={`/checkout?plan=${encodeURIComponent(nextCohort.planId)}`}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-teal-500/30"
              >
                Reserve my seat — {formatNGN(nextCohort.priceNgn)} <ArrowRight size={16} />
              </Link>
              <button
                onClick={() => downloadCohortIcs(nextCohort)}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-colors"
              >
                <CalendarPlus size={16} /> Add to calendar
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function CountdownCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-4 py-3 md:px-6 md:py-4 min-w-[72px] md:min-w-[96px]">
      <span className="text-3xl md:text-5xl font-extrabold text-white tabular-nums">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[10px] md:text-xs font-semibold text-slate-300 uppercase tracking-wider mt-1">
        {label}
      </span>
    </div>
  );
}

function SpotsRemainingBadge({ cohort }: { cohort: Cohort }) {
  if (cohort.spotsRemaining <= 0) {
    return (
      <p className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-400/40 text-red-200 text-sm font-medium">
        <AlertCircle size={14} /> This cohort is full — join the next one below.
      </p>
    );
  }
  if (cohort.spotsRemaining <= 3) {
    return (
      <p className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200 text-sm font-medium">
        <Sparkles size={14} /> Only {cohort.spotsRemaining} {cohort.spotsRemaining === 1 ? 'seat' : 'seats'} left
      </p>
    );
  }
  return (
    <p className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-sm font-medium">
      <CheckCircle2 size={14} /> {cohort.spotsRemaining} of {cohort.capacity} seats available
    </p>
  );
}

function CohortCard({ cohort: c }: { cohort: Cohort }) {
  const isFull = c.spotsRemaining <= 0;
  const isClosed = c.status === 'closed' || isFull;
  const pct = c.capacity > 0 ? Math.min(100, Math.round((c.enrolledCount / c.capacity) * 100)) : 0;
  // Show in_progress cohorts on the public page only if they were already running
  // when the page loaded — they no longer count as "upcoming".
  const startedAlready = new Date(c.startDate) <= new Date();

  return (
    <article className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-teal-200 dark:hover:border-teal-800 transition-all p-6 flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wide mb-1">
            {c.program}
          </p>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{c.title}</h3>
        </div>
        {isClosed ? (
          <span className="shrink-0 text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/50 dark:text-amber-300 px-2 py-1 rounded-full uppercase tracking-wider">
            Full
          </span>
        ) : (
          <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-300 px-2 py-1 rounded-full uppercase tracking-wider">
            Open
          </span>
        )}
      </div>

      {c.description && (
        <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed mb-5 line-clamp-3">{c.description}</p>
      )}

      <dl className="space-y-2 text-sm mb-5">
        <Row icon={Calendar} label="Starts" value={formatDate(c.startDate)} />
        {c.durationLabel && <Row icon={Clock} label="Duration" value={c.durationLabel} />}
        {c.instructor && <Row icon={GraduationCap} label="Instructor" value={c.instructor} />}
        <Row
          icon={Users}
          label="Seats"
          value={`${c.enrolledCount} / ${c.capacity}`}
          accent={c.spotsRemaining <= 3 && c.spotsRemaining > 0}
        />
      </dl>

      {/* Capacity bar */}
      <div className="mb-5">
        <div className="h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isFull ? 'bg-amber-500' : 'bg-teal-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {c.highlights && c.highlights.length > 0 && (
        <ul className="space-y-1.5 mb-5">
          {c.highlights.slice(0, 4).map((h) => (
            <li key={h} className="flex items-start gap-2 text-xs text-gray-600 dark:text-slate-400">
              <CheckCircle2 size={13} className="text-teal-500 mt-0.5 shrink-0" />
              <span>{h}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-3">
        <span className="font-extrabold text-xl text-gray-900 dark:text-white">
          {formatNGN(c.priceNgn)}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadCohortIcs(c)}
            disabled={startedAlready}
            className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-500 hover:text-teal-600 hover:border-teal-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Add to calendar"
            title="Add to calendar"
          >
            <CalendarPlus size={14} />
          </button>
          {isClosed ? (
            <span className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 text-sm font-semibold rounded-lg">
              Sold out
            </span>
          ) : (
            <Link
              to={`/checkout?plan=${encodeURIComponent(c.planId)}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors"
            >
              Enrol now <ArrowRight size={13} />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function Row({
  icon: Icon, label, value, accent,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <dt className="text-gray-500 dark:text-slate-400 inline-flex items-center gap-1.5">
        <Icon size={12} /> {label}
      </dt>
      <dd className={`font-semibold ${accent ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
        {value}
      </dd>
    </div>
  );
}

function SessionRow({ s }: { s: PublicSession }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-5 flex items-center gap-4">
      <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-xl flex items-center justify-center shrink-0">
        <Video size={20} className="text-teal-600 dark:text-teal-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white">{s.title}</p>
        {s.courseTitle && <p className="text-xs text-gray-500 dark:text-slate-400">{s.courseTitle}</p>}
        <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-400 dark:text-slate-500">
          <span className="flex items-center gap-1"><Clock size={12} /> {formatTime(s.scheduledAt)} · {s.durationMinutes} min</span>
          <span className="flex items-center gap-1"><Users size={12} /> {s.instructor}</span>
        </div>
      </div>
      {s.status === 'live' && (
        <span className="px-2.5 py-1 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 text-xs font-bold rounded-full animate-pulse">
          LIVE
        </span>
      )}
    </div>
  );
}

function EmptyCohortState() {
  return (
    <div className="bg-gray-50 dark:bg-slate-950 rounded-2xl border border-gray-100 dark:border-slate-800 p-12 text-center max-w-2xl mx-auto">
      <Calendar size={36} className="mx-auto text-gray-300 dark:text-slate-700 mb-4" />
      <p className="text-gray-800 dark:text-slate-200 font-semibold mb-1">
        No cohorts currently open for enrolment
      </p>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
        We're prepping the next batch. Subscribe to be notified the moment intakes open, or talk to us about your goals.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/pricing"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors"
        >
          Browse programs <ArrowRight size={14} />
        </Link>
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:border-teal-300 hover:text-teal-600 transition-colors"
        >
          Get notified
        </Link>
      </div>
    </div>
  );
}
