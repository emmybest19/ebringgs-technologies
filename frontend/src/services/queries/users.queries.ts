import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import type { User, UserRole } from '../../types';

/* ─── Types ───────────────────────────────────────────────────────────── */

export interface AdminStats {
  totalUsers: number;
  newUsersThisMonth: number;
  totalBlogs: number;
  publishedBlogs: number;
  revenue: number;
  pendingAssignments: number;
}

export interface UnreadCounts {
  serviceRequests: number;
  assignments: number;
  reviews: number;
}

export interface UpdateProfileInput {
  name?: string;
  bio?: string;
  avatar?: string;
  phone?: string;
  whatsappOptIn?: boolean;
  // Teacher-only, server silently ignores these for non-teacher roles.
  title?: string;
  specialties?: string[];
  experience?: string;
  social?: { linkedin?: string; github?: string; website?: string };
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface CreateTeacherInput {
  name: string;
  email: string;
  password: string;
  title?: string;
  bio?: string;
}

/* ─── Query key factory ───────────────────────────────────────────────── */

export const userKeys = {
  all: ['users'] as const,
  adminList: () => [...userKeys.all, 'admin', 'list'] as const,
  adminStats: () => [...userKeys.all, 'admin', 'stats'] as const,
  adminUnread: () => [...userKeys.all, 'admin', 'unread'] as const,
};

/* ─── Query functions ─────────────────────────────────────────────────── */

async function fetchAdminUsers(): Promise<User[]> {
  const { data } = await api.get('/users');
  return data?.data?.users ?? [];
}

async function fetchAdminStats(): Promise<AdminStats> {
  const { data } = await api.get('/admin/stats');
  return data?.data ?? {
    totalUsers: 0, newUsersThisMonth: 0,
    totalBlogs: 0, publishedBlogs: 0,
    revenue: 0, pendingAssignments: 0,
  };
}

async function fetchUnreadCounts(): Promise<UnreadCounts> {
  const { data } = await api.get('/admin/unread');
  return data?.data ?? { serviceRequests: 0, assignments: 0, reviews: 0 };
}

/* ─── Queries ─────────────────────────────────────────────────────────── */

export function useAdminUsers() {
  return useQuery({ queryKey: userKeys.adminList(), queryFn: fetchAdminUsers });
}

export function useAdminStats() {
  return useQuery({ queryKey: userKeys.adminStats(), queryFn: fetchAdminStats });
}

/**
 * Polls every 30 s so the sidebar red badges stay roughly live. Returns
 * cached zeros while the first request is in flight to avoid badge flicker
 * when navigating between admin pages.
 */
export function useUnreadCounts(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: userKeys.adminUnread(),
    queryFn: fetchUnreadCounts,
    enabled: options.enabled ?? true,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
    staleTime: 25 * 1000, // a hair under the refetch interval, no over-eager refetch on mount
    placeholderData: { serviceRequests: 0, assignments: 0, reviews: 0 },
  });
}

/* ─── Mutations ───────────────────────────────────────────────────────── */

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }): Promise<User> => {
      const { data } = await api.patch(`/users/${userId}/role`, { role });
      return data?.data?.user;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.adminList() });
    },
  });
}

/**
 * Admin-only: create a teacher account directly. Skips the public
 * registration + email-verification path so the admin can hand the
 * credentials over and the teacher signs in immediately at /teacher/login.
 */
export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTeacherInput): Promise<User> => {
      const { data } = await api.post('/users/teacher', payload);
      return data?.data?.user;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.adminList() });
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateProfileInput): Promise<User> => {
      const { data } = await api.patch('/users/profile', payload);
      return data?.data?.user;
    },
    onSuccess: () => {
      // The admin user list shows profile info, invalidate it too.
      qc.invalidateQueries({ queryKey: userKeys.adminList() });
      // Auth store has a copy of `user`; consumers should call fetchMe() if they need it refreshed.
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (payload: ChangePasswordInput): Promise<void> => {
      await api.patch('/users/change-password', payload);
    },
  });
}
