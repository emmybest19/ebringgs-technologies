import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';

/* ─── Types — mirror backend/src/models/Recording.model.ts ───────────── */

export interface Recording {
  _id: string;
  uploader: { _id: string; name: string; email?: string; role?: string } | string;
  title: string;
  description?: string;
  url: string;            // path under /uploads/recordings/ — must be prefixed with API base for playback
  filename: string;
  mimeType: string;
  sizeBytes: number;
  durationSec?: number;
  roomId?: string;
  planId?: string;
  visibleToStudents: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UploadRecordingInput {
  file: Blob;
  title: string;
  description?: string;
  roomId?: string;
  planId?: string;
  durationSec?: number;
  visibleToStudents?: boolean;
  /** Optional callback fired with a percentage 0-100 during the upload. */
  onProgress?: (pct: number) => void;
}

/* ─── Query key factory ──────────────────────────────────────────────── */

export const recordingKeys = {
  all: ['recordings'] as const,
  list: () => [...recordingKeys.all, 'list'] as const,   // teacher / admin
  mine: () => [...recordingKeys.all, 'my'] as const,    // student-facing
};

/* ─── Fetchers ───────────────────────────────────────────────────────── */

async function fetchRecordings(): Promise<Recording[]> {
  const { data } = await api.get('/recordings');
  return data?.data?.recordings ?? [];
}

async function fetchMyRecordings(): Promise<Recording[]> {
  const { data } = await api.get('/recordings/my');
  return data?.data?.recordings ?? [];
}

/* ─── Hooks ──────────────────────────────────────────────────────────── */

export function useTeacherRecordings(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: recordingKeys.list(),
    queryFn: fetchRecordings,
    enabled: options.enabled ?? true,
    staleTime: 30 * 1000,
  });
}

export function useMyRecordings(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: recordingKeys.mine(),
    queryFn: fetchMyRecordings,
    enabled: options.enabled ?? true,
    staleTime: 30 * 1000,
  });
}

/**
 * Upload a recording blob. Uses FormData + multipart so the file streams
 * to the server rather than getting JSON-stringified into a base64 mess.
 */
export function useUploadRecording() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UploadRecordingInput): Promise<Recording> => {
      const form = new FormData();
      // Filename hint — server picks its own deterministic name; we just need an extension.
      const ext = payload.file.type === 'video/mp4' ? 'mp4' : 'webm';
      form.append('recording', payload.file, `recording.${ext}`);
      form.append('title', payload.title);
      if (payload.description) form.append('description', payload.description);
      if (payload.roomId) form.append('roomId', payload.roomId);
      if (payload.planId) form.append('planId', payload.planId);
      if (payload.durationSec !== undefined) form.append('durationSec', String(payload.durationSec));
      if (payload.visibleToStudents === false) form.append('visibleToStudents', 'false');

      const { data } = await api.post('/recordings', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (!payload.onProgress || !e.total) return;
          payload.onProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      return data?.data?.recording;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recordingKeys.all });
    },
  });
}

export function useDeleteRecording() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/recordings/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recordingKeys.all });
    },
  });
}

/* ─── Helpers ────────────────────────────────────────────────────────── */

/**
 * Build a fully-qualified URL the <video> tag can play from.
 * `recording.url` is the path under the API host (e.g. `/uploads/recordings/x.webm`);
 * we need to point at the API base, not the Vite dev server.
 */
export function recordingPlayUrl(recording: Pick<Recording, 'url'>): string {
  const base = (import.meta.env.VITE_API_URL as string | undefined)
    || `http://localhost:${import.meta.env.VITE_API_PORT || 5000}`;
  // strip trailing /api if VITE_API_URL points at the API root rather than the host.
  const host = base.replace(/\/api\/?$/, '');
  return `${host}${recording.url}`;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatDuration(sec?: number): string {
  if (!sec || sec <= 0) return '—';
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}:${String(r).padStart(2, '0')}`;
}
