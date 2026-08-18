import { useState } from 'react';
import { Video, Loader2, Play, X } from 'lucide-react';
import {
  useMyRecordings,
  recordingPlayUrl,
  formatBytes,
  formatDuration,
  type Recording,
} from '../../services/queries';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function StudentRecordings() {
  const { data: recordings = [], isLoading, isError } = useMyRecordings();
  const [playing, setPlaying] = useState<Recording | null>(null);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recordings</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          Re-watch any class you missed or want to revisit.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 size={28} className="animate-spin text-cyan-600" />
        </div>
      ) : isError ? (
        <div className="bg-white dark:bg-[#0e141c] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-12 text-center">
          <p className="text-gray-500 dark:text-slate-400">Couldn't load recordings.</p>
        </div>
      ) : recordings.length === 0 ? (
        <div className="bg-white dark:bg-[#0e141c] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-12 text-center">
          <Video size={36} className="text-gray-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="font-medium text-gray-500 dark:text-slate-400">No recordings available</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
            Your instructor's class recordings will appear here.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recordings.map((rec) => (
            <button
              key={rec._id}
              onClick={() => setPlaying(rec)}
              className="text-left bg-white dark:bg-[#0e141c] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors group"
            >
              <div className="w-11 h-11 bg-cyan-50 dark:bg-cyan-950 rounded-xl flex items-center justify-center mb-3 group-hover:bg-cyan-600 transition-colors">
                <Play size={18} className="text-cyan-600 group-hover:text-white transition-colors fill-current" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 line-clamp-2">{rec.title}</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">
                {typeof rec.uploader === 'object' && rec.uploader?.name ? rec.uploader.name : 'Instructor'} · {formatDate(rec.createdAt)}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-slate-500 tabular-nums">
                {formatDuration(rec.durationSec)} · {formatBytes(rec.sizeBytes)}
              </p>
            </button>
          ))}
        </div>
      )}

      {playing && <PlayerModal recording={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
}

function PlayerModal({ recording, onClose }: { recording: Recording; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{recording.title}</p>
            <p className="text-xs text-slate-400">
              {formatDuration(recording.durationSec)} · {formatBytes(recording.sizeBytes)}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close player"
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>
        <video
          src={recordingPlayUrl(recording)}
          controls
          autoPlay
          className="w-full aspect-video bg-black"
        />
      </div>
    </div>
  );
}
