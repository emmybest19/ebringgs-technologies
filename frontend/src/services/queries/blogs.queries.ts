import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';

/* ─── Types ───────────────────────────────────────────────────────────── */

/**
 * The list endpoint excludes `content` (server does `.select('-content')`),
 * so list rows are intentionally lighter than full posts.
 */
export interface BlogListItem {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  publishedAt: string;
  views: number;
  isPublished: boolean;
  author: { name: string; avatar?: string };
}

export interface BlogPost extends BlogListItem {
  content: string;
  author: { name: string; avatar?: string; bio?: string };
  seoTitle?: string;
  seoDescription?: string;
}

export interface BlogListFilters {
  search?: string;
  category?: string;
  tag?: string;
  page?: number;
  limit?: number;
}

export interface BlogListResponse {
  posts: BlogListItem[];
  total: number;
  page: number;
  pages: number;
}

export interface BlogInput {
  title: string;
  slug?: string;
  category: string;
  excerpt: string;
  content: string;
  tags?: string[];
  isPublished?: boolean;
  publishedAt?: string | Date;
  seoTitle?: string;
  seoDescription?: string;
}

/* ─── Query key factory ───────────────────────────────────────────────── */

export const blogKeys = {
  all: ['blogs'] as const,
  lists: () => [...blogKeys.all, 'list'] as const,
  list: (filters: BlogListFilters) => [...blogKeys.lists(), filters] as const,
  detail: (slug: string) => [...blogKeys.all, 'detail', slug] as const,
};

/* ─── Query functions ─────────────────────────────────────────────────── */

async function fetchBlogs(filters: BlogListFilters): Promise<BlogListResponse> {
  const params: Record<string, string> = {};
  if (filters.search) params.search = filters.search;
  if (filters.category) params.category = filters.category;
  if (filters.tag) params.tag = filters.tag;
  if (filters.page) params.page = String(filters.page);
  if (filters.limit) params.limit = String(filters.limit);
  const { data } = await api.get('/blogs', { params });
  return {
    posts: data?.data?.posts ?? [],
    total: data?.data?.total ?? 0,
    page: data?.data?.page ?? 1,
    pages: data?.data?.pages ?? 1,
  };
}

async function fetchBlogPost(slug: string): Promise<BlogPost | null> {
  const { data } = await api.get(`/blogs/${slug}`);
  return data?.data?.post ?? null;
}

/* ─── Queries ─────────────────────────────────────────────────────────── */

export function useBlogs(filters: BlogListFilters = {}) {
  return useQuery({
    queryKey: blogKeys.list(filters),
    queryFn: () => fetchBlogs(filters),
  });
}

/**
 * NOTE on caching + view counts: the GET endpoint atomically increments
 * `views` on each request. With a 30s staleTime, repeated mounts inside that
 * window won't trigger a network call — meaning two views from the same
 * browser within 30s count as one. That's almost always what you want
 * (refreshes, back-button, etc. shouldn't inflate the counter), but worth
 * knowing if you ever need raw refetch behavior.
 */
export function useBlogPost(slug: string | undefined) {
  return useQuery({
    queryKey: blogKeys.detail(slug ?? ''),
    queryFn: () => fetchBlogPost(slug!),
    enabled: !!slug,
  });
}

/* ─── Mutations ───────────────────────────────────────────────────────── */

export function useCreateBlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BlogInput): Promise<BlogPost> => {
      const { data } = await api.post('/blogs', payload);
      return data?.data?.post;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: blogKeys.all });
    },
  });
}

export function useUpdateBlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<BlogInput> }): Promise<BlogPost> => {
      const { data } = await api.patch(`/blogs/${id}`, payload);
      return data?.data?.post;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: blogKeys.all });
    },
  });
}

export function useDeleteBlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/blogs/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: blogKeys.all });
    },
  });
}
