import { useQuery } from '@tanstack/react-query';
import api from '../api';

/* ─── Types — mirror backend/src/config/tutoring.catalog.ts ───────────── */

export type TutoringTier = 'cohort' | 'mentorship';

export interface TutoringSyllabusModule {
  week: string;
  title: string;
  topics: string[];
}

export interface TutoringFAQ {
  q: string;
  a: string;
}

export interface TutoringTrack {
  id: string;
  category: string;
  subTrack?: 'Frontend' | 'Backend' | 'Full-Stack';
  tier: TutoringTier;
  title: string;
  summary: string;
  icon: string;
  priceNgn: number;
  durationWeeks: number;
  durationLabel: string;
  format: string;
  classSize: string;
  weeklyCommitment: string;
  prerequisites: string[];
  outcomes: string[];
  syllabus: TutoringSyllabusModule[];
  projects: string[];
  whatsIncluded: string[];
  whatsNotIncluded?: string[];
  refundPolicy: string;
  faq?: TutoringFAQ[];
  installmentEligible?: boolean;
}

export interface TutoringGroup {
  category: string;
  tracks: TutoringTrack[];
}

/* ─── Query key factory ──────────────────────────────────────────────── */

export const tutoringKeys = {
  all: ['tutoring'] as const,
  groups: () => [...tutoringKeys.all, 'groups'] as const,
  detail: (id: string) => [...tutoringKeys.all, 'detail', id] as const,
};

/* ─── Query fns ──────────────────────────────────────────────────────── */

async function fetchTutoringGroups(): Promise<TutoringGroup[]> {
  const { data } = await api.get('/tutoring?grouped=true');
  return data?.data?.groups ?? [];
}

async function fetchTutoringTrack(id: string): Promise<TutoringTrack | null> {
  const { data } = await api.get(`/tutoring/${id}`);
  return data?.data?.track ?? null;
}

/* ─── Hooks ──────────────────────────────────────────────────────────── */

/**
 * Catalog only changes on deploy (in-memory on the backend), so cache
 * generously — same pattern as `useServices()`.
 */
export function useTutoringGroups() {
  return useQuery({
    queryKey: tutoringKeys.groups(),
    queryFn: fetchTutoringGroups,
    staleTime: 10 * 60 * 1000,
  });
}

export function useTutoringTrack(id: string | undefined) {
  return useQuery({
    queryKey: tutoringKeys.detail(id ?? ''),
    queryFn: () => fetchTutoringTrack(id!),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}
