import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';

/* ─── Types ───────────────────────────────────────────────────────────── */

export type CohortStatus = 'open' | 'closed' | 'in_progress' | 'ended';

export interface Cohort {
  _id: string;
  slug: string;
  program: string;
  title: string;
  planId: string;
  startDate: string;
  endDate?: string;
  durationLabel?: string;
  priceNgn: number;
  capacity: number;
  enrolledCount: number;
  spotsRemaining: number;
  isEnrollmentOpen: boolean;
  status: CohortStatus;
  description?: string;
  instructor?: string;
  highlights?: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CohortListFilters {
  upcoming?: boolean;
  program?: string;
  limit?: number;
}

export type CohortInput = Omit<
  Cohort,
  '_id' | 'slug' | 'spotsRemaining' | 'createdAt' | 'updatedAt' | 'status'
> & {
  status?: CohortStatus;
};

/* ─── Query key factory ───────────────────────────────────────────────── */

/**
 * Hierarchical key factory. Invalidate the whole subtree with `cohortKeys.all`,
 * or a narrower slice with `cohortKeys.lists()`, `cohortKeys.adminAll()`, etc.
 *
 * Follow this pattern for every other domain (`blogKeys`, `userKeys`, …) — it's
 * the single best lever TanStack gives us over the old manual-refetch pattern.
 */
export const cohortKeys = {
  all: ['cohorts'] as const,
  lists: () => [...cohortKeys.all, 'list'] as const,
  list: (filters: CohortListFilters) => [...cohortKeys.lists(), filters] as const,
  next: () => [...cohortKeys.all, 'next'] as const,
  adminAll: () => [...cohortKeys.all, 'admin', 'all'] as const,
  detail: (slug: string) => [...cohortKeys.all, 'detail', slug] as const,
};

/* ─── Query functions (unwrap the {status,data:{...}} envelope here) ──── */

async function fetchCohorts(filters: CohortListFilters): Promise<Cohort[]> {
  const params: Record<string, string> = {};
  if (filters.upcoming) params.upcoming = 'true';
  if (filters.program) params.program = filters.program;
  if (filters.limit) params.limit = String(filters.limit);
  const { data } = await api.get('/cohorts', { params });
  return data?.data?.cohorts ?? [];
}

async function fetchNextCohort(): Promise<Cohort | null> {
  const { data } = await api.get('/cohorts/next');
  return data?.data?.cohort ?? null;
}

async function fetchCohort(slug: string): Promise<Cohort | null> {
  const { data } = await api.get(`/cohorts/${slug}`);
  return data?.data?.cohort ?? null;
}

async function fetchAdminCohorts(): Promise<Cohort[]> {
  const { data } = await api.get('/cohorts/admin/all');
  return data?.data?.cohorts ?? [];
}

/* ─── Public queries ──────────────────────────────────────────────────── */

/**
 * Public cohort list. Filters object becomes part of the query key — pass
 * the same filters object identity-wise to share a cache entry.
 */
export function useCohorts(filters: CohortListFilters = {}) {
  return useQuery({
    queryKey: cohortKeys.list(filters),
    queryFn: () => fetchCohorts(filters),
  });
}

/**
 * The single soonest upcoming cohort — drives the /schedule countdown.
 * Shorter staleTime because the countdown wants reasonably fresh data.
 */
export function useNextCohort() {
  return useQuery({
    queryKey: cohortKeys.next(),
    queryFn: fetchNextCohort,
    staleTime: 10 * 1000, // 10s — overrides the default 30s
  });
}

export function useCohort(slug: string | undefined) {
  return useQuery({
    queryKey: cohortKeys.detail(slug ?? ''),
    queryFn: () => fetchCohort(slug!),
    enabled: !!slug, // skip when the param hasn't arrived yet
  });
}

/* ─── Admin query ─────────────────────────────────────────────────────── */

export function useAdminCohorts() {
  return useQuery({
    queryKey: cohortKeys.adminAll(),
    queryFn: fetchAdminCohorts,
  });
}

/* ─── Mutations ───────────────────────────────────────────────────────── */

/**
 * Each mutation invalidates `cohortKeys.all` on success — a single broad
 * stroke that refreshes every cohort-related view. Cheap: a couple of GET
 * requests against an indexed Mongo query.
 */

export function useCreateCohort() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<CohortInput>): Promise<Cohort> => {
      const { data } = await api.post('/cohorts', payload);
      return data?.data?.cohort;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cohortKeys.all });
    },
  });
}

export function useUpdateCohort() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<CohortInput> }): Promise<Cohort> => {
      const { data } = await api.patch(`/cohorts/${id}`, payload);
      return data?.data?.cohort;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cohortKeys.all });
    },
  });
}

export function useDeleteCohort() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/cohorts/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cohortKeys.all });
    },
  });
}
