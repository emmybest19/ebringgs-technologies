import { useState } from 'react';
import { Video, Loader2, Play, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useTeacherRecordings,
  useDeleteRecording,
  recordingPlayUrl,
  formatBytes,
  formatDuration,
  type Recording,
} from '../services/queries';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function TeacherRecordings() {
  const { data: recordings = [], isLoading, isError } = useTeacherRecordings();
  const deleteRec = useDeleteRecording();
  const [playing, setPlaying] = useState<Recording | null>(null);

  const handleDelete = (rec: Recording) => {
    if (!confirm(`Delete "${rec.title}"? This cannot be undone.`)) return;
    deleteRec.mutate(rec._id, {
      onSuccess: () => toast.success('Recording deleted.'),
      onError: () => toast.error('Could not delete recording.'),
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Recordings</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
          Class recordings you've captured. Start a recording from the classroom controls during a live session.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 size={28} className="animate-spin text-teal-600" />
        </div>
      ) : isError ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-12 text-center">
          <p className="text-gray-500 dark:text-slate-400">Couldn't load your recordings.</p>
        </div>
      ) : recordings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-12 text-center">
          <Video size={36} className="text-gray-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="font-medium text-gray-500 dark:text-slate-400">No recordings yet</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
            Start a class from /classroom/&lt;roomId&gt; and press the red Record button.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-950 text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">Title</th>
                <th className="px-5 py-3 text-left hidden md:table-cell">Recorded</th>
                <th className="px-5 py-3 text-left">Duration</th>
                <th className="px-5 py-3 text-left hidden sm:table-cell">Size</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              {recordings.map((rec) => (
                <tr key={rec._id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-5 py-3 text-gray-900 dark:text-white font-medium">{rec.title}</td>
                  <td className="px-5 py-3 text-gray-500 dark:text-slate-400 hidden md:table-cell">{formatDate(rec.createdAt)}</td>
                  <td className="px-5 py-3 text-gray-700 dark:text-slate-300 tabular-nums">{formatDuration(rec.durationSec)}</td>
                  <td className="px-5 py-3 text-gray-500 dark:text-slate-400 hidden sm:table-cell tabular-nums">{formatBytes(rec.sizeBytes)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => setPlaying(rec)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950 transition-colors"
                      >
                        <Play size={12} /> Play
                      </button>
                      <button
                        onClick={() => handleDelete(rec)}
                        disabled={deleteRec.isPending}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
