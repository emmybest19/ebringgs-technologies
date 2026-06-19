import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@ebringgs/api';

/**
 * Self-contained upload-recording hook for the classroom. Mirrors the shape
 * of the app-level `useUploadRecording` in apps/web/src/services/queries/
 * so the Classroom UI doesn't have to be refactored when moved into a shared
 * package. Cache invalidation uses the same `['recordings']` root key, so an
 * upload from inside the classroom still refreshes recording lists in the
 * student / teacher / admin dashboards.
 */
export interface UploadRecordingInput {
  file: Blob;
  title: string;
  description?: string;
  roomId?: string;
  planId?: string;
  durationSec?: number;
  visibleToStudents?: boolean;
  onProgress?: (pct: number) => void;
}

export function useUploadRecording() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UploadRecordingInput) => {
      const form = new FormData();
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
      qc.invalidateQueries({ queryKey: ['recordings'] });
    },
  });
}
