import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';

/* ─── Types ───────────────────────────────────────────────────────────── */

export type ReviewTargetType = 'program' | 'service' | 'platform';

export interface Review {
  _id: string;
  rating: number;             // 1–5
  title?: string;
  content: string;
  targetType: ReviewTargetType;
  targetId?: string;
  targetName?: string;
  isApproved: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export interface AdminReview extends Review {
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
}

export interface PublicReview extends Review {
  user: { _id: string; name: string; avatar?: string; role?: string };
}

export interface PublicReviewsResponse {
  reviews: PublicReview[];
  stats: {
    average: number;
    count: number;
    breakdown: { 1: number; 2: number; 3: number; 4: number; 5: number };
  };
}

export interface ReviewListFilters {
  targetType?: ReviewTargetType;
  targetId?: string;
  featured?: boolean;
  limit?: number;
}

export interface SubmitReviewInput {
  rating: number;
  title?: string;
  content: string;
  targetType: ReviewTargetType;
  targetId?: string;
  targetName?: string;
}

export interface UpdateMyReviewInput {
  rating?: number;
  title?: string;
  content?: string;
}

export type AdminReviewFilter = 'pending' | 'approved' | 'all';

/* ─── Query key factory ───────────────────────────────────────────────── */

export const reviewKeys = {
  all: ['reviews'] as const,
  publicLists: () => [...reviewKeys.all, 'public', 'list'] as const,
  publicList: (filters: ReviewListFilters) => [...reviewKeys.publicLists(), filters] as const,
  myList: () => [...reviewKeys.all, 'mine'] as const,
  adminLists: () => [...reviewKeys.all, 'admin', 'list'] as const,
  adminList: (filter: AdminReviewFilter) => [...reviewKeys.adminLists(), filter] as const,
};

/* ─── Query functions ─────────────────────────────────────────────────── */

async function fetchReviews(filters: ReviewListFilters): Promise<PublicReviewsResponse> {
  const params: Record<string, string> = {};
  if (filters.targetType) params.targetType = filters.targetType;
  if (filters.targetId) params.targetId = filters.targetId;
  if (filters.featured) params.featured = 'true';
  if (filters.limit) params.limit = String(filters.limit);
  const { data } = await api.get('/reviews', { params });
  return data?.data ?? {
    reviews: [],
    stats: { average: 0, count: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
  };
}

async function fetchMyReviews(): Promise<Review[]> {
  const { data } = await api.get('/reviews/me');
  return data?.data?.reviews ?? [];
}

async function fetchAdminReviews(filter: AdminReviewFilter): Promise<AdminReview[]> {
  const params = filter === 'all' ? '' : `?status=${filter}`;
  const { data } = await api.get(`/reviews/admin/all${params}`);
  return Array.isArray(data?.data?.reviews) ? data.data.reviews : [];
}

/* ─── Queries ─────────────────────────────────────────────────────────── */

export function useReviews(filters: ReviewListFilters = {}) {
  return useQuery({
    queryKey: reviewKeys.publicList(filters),
    queryFn: () => fetchReviews(filters),
  });
}

export function useMyReviews() {
  return useQuery({
    queryKey: reviewKeys.myList(),
    queryFn: fetchMyReviews,
  });
}

export function useAdminReviews(filter: AdminReviewFilter) {
  return useQuery({
    queryKey: reviewKeys.adminList(filter),
    queryFn: () => fetchAdminReviews(filter),
  });
}

/* ─── Mutations ───────────────────────────────────────────────────────── */

/**
 * User submits a new review. The created review starts as `isApproved: false`
 * so admin moderation is required before it shows on public lists.
 */
export function useSubmitReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SubmitReviewInput): Promise<Review> => {
      const { data } = await api.post('/reviews', payload);
      return data?.data?.review;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reviewKeys.myList() });
      qc.invalidateQueries({ queryKey: reviewKeys.adminLists() });
    },
  });
}

/** Edit own review. Server re-sets `isApproved: false` so re-moderation kicks in. */
export function useUpdateMyReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateMyReviewInput }): Promise<Review> => {
      const { data } = await api.patch(`/reviews/${id}`, payload);
      return data?.data?.review;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
}

export function useDeleteMyReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/reviews/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
}

/* ─── Admin mutations ─────────────────────────────────────────────────── */

export function useSetReviewApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isApproved }: { id: string; isApproved: boolean }): Promise<AdminReview> => {
      const { data } = await api.patch(`/reviews/${id}/approve`, { isApproved });
      return data?.data?.review;
    },
    onSuccess: () => {
      // Affects admin lists (status filters change) + public lists (newly approved review appears).
      qc.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
}

export function useSetReviewFeatured() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isFeatured }: { id: string; isFeatured: boolean }): Promise<AdminReview> => {
      const { data } = await api.patch(`/reviews/${id}/feature`, { isFeatured });
      return data?.data?.review;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
}

export function useAdminDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/reviews/admin/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
}
