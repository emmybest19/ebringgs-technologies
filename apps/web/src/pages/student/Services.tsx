import { Link, useNavigate } from 'react-router-dom';
import {
  Code2, BarChart3, BookOpen, Layers, Smartphone, Palette, Server, Briefcase,
  Loader2, ShoppingCart, GraduationCap, UserCheck, AlertCircle, RefreshCw,
} from 'lucide-react';
import { useTutoringGroups, type TutoringTrack } from '../../services/queries';

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  code: Code2,
  server: Server,
  layers: Layers,
  smartphone: Smartphone,
  'bar-chart': BarChart3,
  'book-open': BookOpen,
  palette: Palette,
  briefcase: Briefcase,
};

function formatNGN(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency', currency: 'NGN', maximumFractionDigits: 0,
  }).format(amount);
}

export default function StudentServices() {
  const { data: groups = [], isLoading, isError, refetch, isFetching } = useTutoringGroups();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tutoring & Mentorship</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          Hands-on programs that take you from zero to shippable. Join a small live cohort, or get a private 1-on-1 mentor — your goals, your pace.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 size={28} className="animate-spin text-cyan-600" />
        </div>
      ) : isError ? (
        // Distinct from "no data" — fetch actually failed (usually the
        // backend is down or unreachable). Give the user a retry instead
        // of a misleading "no programs" message.
        <div className="bg-white dark:bg-[#0e141c] rounded-2xl border border-red-200 dark:border-red-900 shadow-sm p-10 text-center">
          <AlertCircle size={36} className="text-red-500 mx-auto mb-3" />
          <p className="text-gray-700 dark:text-slate-200 font-semibold mb-1">Couldn't load tutoring programs</p>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">
            The catalog server didn't respond. This usually clears in a moment.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            {isFetching ? 'Retrying…' : 'Try again'}
          </button>
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white dark:bg-[#0e141c] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-12 text-center">
          <GraduationCap size={36} className="text-gray-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-slate-400">No tutoring programs available right now.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map((g) => (
            <CategorySection key={g.category} category={g.category} tracks={g.tracks} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Category section ─────────────────────────────────────────────── */

function CategorySection({ category, tracks }: { category: string; tracks: TutoringTrack[] }) {
  // Software Development has sub-tracks (Frontend / Backend / Full-Stack);
  // every other category is flat.
  const hasSubTracks = tracks.some((t) => t.subTrack);

  if (!hasSubTracks) {
    return (
      <section>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{category}</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {tracks.map((t) => <TrackCard key={t.id} track={t} />)}
        </div>
      </section>
    );
  }

  // Group by subTrack for Software Development.
  const order: TutoringTrack['subTrack'][] = ['Frontend', 'Backend', 'Full-Stack'];
  const bySubTrack = order
    .map((sub) => ({ sub, items: tracks.filter((t) => t.subTrack === sub) }))
    .filter((g) => g.items.length > 0);

  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{category}</h2>
      <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">Pick a track that fits where you are now.</p>
      <div className="space-y-6">
        {bySubTrack.map(({ sub, items }) => (
          <div key={sub}>
            <h3 className="text-sm font-semibold text-cyan-700 dark:text-cyan-400 uppercase tracking-wide mb-3">
              {sub}
            </h3>
            <div className="grid sm:grid-cols-2 gap-5">
              {items.map((t) => <TrackCard key={t.id} track={t} />)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Single track card ────────────────────────────────────────────── */

function TrackCard({ track }: { track: TutoringTrack }) {
  const navigate = useNavigate();
  const Icon = iconMap[track.icon] || Code2;
  const TierIcon = track.tier === 'cohort' ? GraduationCap : UserCheck;
  const tierLabel = track.tier === 'cohort' ? 'Cohort' : '1-on-1 Mentorship';
  const tierClass =
    track.tier === 'cohort'
      ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400'
      : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400';

  return (
    <div className="reveal bg-white dark:bg-[#0e141c] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 bg-cyan-50 dark:bg-cyan-950 rounded-xl flex items-center justify-center shrink-0">
          <Icon size={20} className="text-cyan-600" />
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold ${tierClass}`}>
          <TierIcon size={11} />
          {tierLabel}
        </span>
      </div>

      <h3 className="font-bold text-gray-900 dark:text-white text-base mb-2">{track.title}</h3>
      <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-3 flex-1">
        {track.summary}
      </p>

      <div className="grid grid-cols-2 gap-2 text-xs mb-4">
        <div className="px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-[#080c11] border border-gray-100 dark:border-slate-800">
          <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wide">Duration</p>
          <p className="font-semibold text-gray-700 dark:text-slate-300">{track.durationLabel}</p>
        </div>
        <div className="px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-[#080c11] border border-gray-100 dark:border-slate-800">
          <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wide">Per week</p>
          <p className="font-semibold text-gray-700 dark:text-slate-300 line-clamp-1">{track.weeklyCommitment}</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xl font-extrabold text-gray-900 dark:text-white">
          {formatNGN(track.priceNgn)}
          {track.installmentEligible && (
            <span className="ml-2 text-[10px] font-semibold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">
              Installments OK
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Link
          to={`/dashboard/services/${track.id}`}
          className="text-center w-full py-2 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors"
        >
          View details
        </Link>
        <button
          onClick={() => navigate(`/checkout?type=plan&id=${track.id}`)}
          className="w-full py-2 bg-cyan-600 text-white text-sm font-semibold rounded-lg hover:bg-cyan-700 transition-colors flex items-center justify-center gap-2"
        >
          <ShoppingCart size={14} /> Enrol now
        </button>
      </div>
    </div>
  );
}
