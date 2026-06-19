import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@ebringgs/api';

/* ─── Types ───────────────────────────────────────────────────────────── */

export type CaseStudyType = 'client_work' | 'student_project';

export interface CaseStudy {
  _id: string;
  type: CaseStudyType;
  title: string;
  slug: string;
  summary: string;
  description?: string;
  coverImage?: string;
  gallery?: string[];
  category?: string;
  tags?: string[];
  techStack?: string[];

  // Client work
  serviceId?: string;
  clientName?: string;
  clientLogo?: string;
  results?: string[];
  deliveryDays?: number;
  priceKobo?: number;

  // Student project
  studentName?: string;
  studentAvatar?: string;
  studentRole?: string;
  studentBio?: string;
  cohortBatch?: string;

  liveUrl?: string;
  githubUrl?: string;
  testimonial?: { quote: string; name: string; title?: string; avatar?: string };

  featured: boolean;
  published: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CaseStudyListFilters {
  type?: CaseStudyType;
  category?: string;
  serviceId?: string;
  featured?: boolean;
  cohort?: string;
  limit?: number;
}

/** Editable subset for the admin editor (admin can set most fields). */
export type CaseStudyInput = Partial<Omit<CaseStudy, '_id' | 'createdAt' | 'updatedAt'>>;

/* ─── Query key factory ───────────────────────────────────────────────── */

export const caseStudyKeys = {
  all: ['caseStudies'] as const,
  lists: () => [...caseStudyKeys.all, 'list'] as const,
  list: (filters: CaseStudyListFilters) => [...caseStudyKeys.lists(), filters] as const,
  detail: (slug: string) => [...caseStudyKeys.all, 'detail', slug] as const,
  adminAll: () => [...caseStudyKeys.all, 'admin', 'all'] as const,
};

/* ─── Query functions ─────────────────────────────────────────────────── */

async function fetchCaseStudies(filters: CaseStudyListFilters): Promise<CaseStudy[]> {
  const params: Record<string, string> = {};
  if (filters.type) params.type = filters.type;
  if (filters.category && filters.category !== 'All') params.category = filters.category;
  if (filters.serviceId) params.serviceId = filters.serviceId;
  if (filters.cohort && filters.cohort !== 'All') params.cohort = filters.cohort;
  if (filters.featured) params.featured = 'true';
  if (filters.limit) params.limit = String(filters.limit);
  const { data } = await api.get('/case-studies', { params });
  return data?.data?.studies ?? [];
}

async function fetchCaseStudy(slug: string): Promise<CaseStudy | null> {
  const { data } = await api.get(`/case-studies/${slug}`);
  return data?.data?.study ?? null;
}

async function fetchAdminCaseStudies(): Promise<CaseStudy[]> {
  const { data } = await api.get('/case-studies/admin/all');
  return data?.data?.studies ?? [];
}

/* ─── Queries ─────────────────────────────────────────────────────────── */

export function useCaseStudies(filters: CaseStudyListFilters = {}) {
  return useQuery({
    queryKey: caseStudyKeys.list(filters),
    queryFn: () => fetchCaseStudies(filters),
  });
}

export function useCaseStudy(slug: string | undefined) {
  return useQuery({
    queryKey: caseStudyKeys.detail(slug ?? ''),
    queryFn: () => fetchCaseStudy(slug!),
    enabled: !!slug,
  });
}

export function useAdminCaseStudies() {
  return useQuery({
    queryKey: caseStudyKeys.adminAll(),
    queryFn: fetchAdminCaseStudies,
  });
}

/* ─── Mutations ───────────────────────────────────────────────────────── */

export function useCreateCaseStudy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CaseStudyInput): Promise<CaseStudy> => {
      const { data } = await api.post('/case-studies', payload);
      return data?.data?.study;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: caseStudyKeys.all });
    },
  });
}

export function useUpdateCaseStudy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: CaseStudyInput }): Promise<CaseStudy> => {
      const { data } = await api.patch(`/case-studies/${id}`, payload);
      return data?.data?.study;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: caseStudyKeys.all });
    },
  });
}

export function useDeleteCaseStudy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/case-studies/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: caseStudyKeys.all });
    },
  });
}
