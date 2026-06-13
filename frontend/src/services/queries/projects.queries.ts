import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';

/* ─── Types ───────────────────────────────────────────────────────────── */

export type ProjectStatus =
  | 'awaiting_brief'
  | 'pending'
  | 'in_progress'
  | 'review'
  | 'completed'
  | 'cancelled';

export interface Deliverable {
  name: string;
  url: string;
  uploadedAt: string;
}

export interface ProjectTimelineItem {
  milestone: string;
  dueDate?: string;
  completed: boolean;
}

/** Client-side view of a project — `client` is just an ObjectId string. */
export interface Project {
  _id: string;
  serviceId: string;
  serviceName: string;
  title: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  githubRepo?: string;
  liveUrl?: string;
  deliverables: Deliverable[];
  timeline?: ProjectTimelineItem[];
  totalCost: number;
  isPaid: boolean;
  paystackReference?: string;
  startDate?: string;
  estimatedEndDate?: string;
  completedAt?: string;
  notes?: string;
  brief?: Record<string, unknown>;
  briefSubmittedAt?: string;
  source?: 'self_serve' | 'inquiry';
  createdAt: string;
  updatedAt: string;
}

/** Admin-side view — `client` is populated with name/email/avatar. */
export interface AdminProject extends Omit<Project, 'client'> {
  client: { _id: string; name: string; email: string; avatar?: string } | string;
}

export type ProjectUpdateType =
  | 'progress' | 'commit' | 'deploy' | 'note' | 'milestone' | 'attachment';

export interface ProjectUpdate {
  _id: string;
  type: ProjectUpdateType;
  title: string;
  message?: string;
  url?: string;
  progressChange?: number;
  createdAt: string;
  author: { name: string; avatar?: string; role?: string };
}

export interface ProjectUpdatesPayload {
  updates: ProjectUpdate[];
  lastUpdatedAt: string | null;
}

export interface CreateProjectInput {
  serviceId: string;
  serviceName: string;
  title: string;
  description: string;
  totalCost: number;
}

export interface UpdateProjectInput {
  status?: ProjectStatus;
  progress?: number;
  githubRepo?: string;
  liveUrl?: string;
  deliverables?: Deliverable[];
  timeline?: ProjectTimelineItem[];
  startDate?: string;
  estimatedEndDate?: string;
  completedAt?: string;
  notes?: string;
  isPaid?: boolean;
  paystackReference?: string;
}

export interface AddProjectUpdateInput {
  type: ProjectUpdateType;
  title: string;
  message?: string;
  url?: string;
  progressChange?: number;
}

/* ─── Query key factory ───────────────────────────────────────────────── */

/**
 * Note: `adminDetail(id)` shares the same query key as `adminList()` — it's
 * implemented as a `select`-derived slice of the list. Backend has no admin
 * single-project endpoint today, so the detail page reuses the list cache
 * rather than triggering a second round trip.
 */
export const projectKeys = {
  all: ['projects'] as const,

  myList: () => [...projectKeys.all, 'my', 'list'] as const,
  my: (id: string) => [...projectKeys.all, 'my', 'detail', id] as const,

  adminList: () => [...projectKeys.all, 'admin', 'list'] as const,

  updates: (projectId: string) => [...projectKeys.all, 'updates', projectId] as const,
};

/* ─── Query functions ─────────────────────────────────────────────────── */

async function fetchMyProjects(): Promise<Project[]> {
  const { data } = await api.get('/projects/my');
  return data?.data?.projects ?? [];
}

async function fetchMyProject(id: string): Promise<Project | null> {
  const { data } = await api.get(`/projects/my/${id}`);
  return data?.data?.project ?? null;
}

async function fetchAdminProjects(): Promise<AdminProject[]> {
  const { data } = await api.get('/projects');
  return Array.isArray(data?.data?.projects) ? data.data.projects : [];
}

async function fetchProjectUpdates(projectId: string): Promise<ProjectUpdatesPayload> {
  const { data } = await api.get(`/projects/${projectId}/updates`);
  return {
    updates: Array.isArray(data?.data?.updates) ? data.data.updates : [],
    lastUpdatedAt: data?.data?.lastUpdatedAt ?? null,
  };
}

/* ─── Client queries ──────────────────────────────────────────────────── */

export function useMyProjects() {
  return useQuery({ queryKey: projectKeys.myList(), queryFn: fetchMyProjects });
}

export function useMyProject(id: string | undefined) {
  return useQuery({
    queryKey: projectKeys.my(id ?? ''),
    queryFn: () => fetchMyProject(id!),
    enabled: !!id,
  });
}

/* ─── Admin queries ───────────────────────────────────────────────────── */

export function useAdminProjects() {
  return useQuery({ queryKey: projectKeys.adminList(), queryFn: fetchAdminProjects });
}

/**
 * Admin single-project view — derived from the cached list. The backend
 * doesn't expose an admin GET-by-id endpoint, so we share the list cache
 * and pick the one we need. Free re-renders when the list updates.
 */
export function useAdminProject(id: string | undefined) {
  return useQuery({
    queryKey: projectKeys.adminList(),
    queryFn: fetchAdminProjects,
    enabled: !!id,
    select: (projects) => projects.find((p) => p._id === id) ?? null,
  });
}

/* ─── Activity timeline ───────────────────────────────────────────────── */

export function useProjectUpdates(projectId: string | undefined) {
  return useQuery({
    queryKey: projectKeys.updates(projectId ?? ''),
    queryFn: () => fetchProjectUpdates(projectId!),
    enabled: !!projectId,
  });
}

/* ─── Mutations ───────────────────────────────────────────────────────── */

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateProjectInput): Promise<Project> => {
      const { data } = await api.post('/projects', payload);
      return data?.data?.project;
    },
    onSuccess: () => {
      // Both lists (client + admin, if they're on the same browser session)
      // and any single-project detail need refreshing.
      qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateProjectInput }): Promise<AdminProject> => {
      const { data } = await api.patch(`/projects/${id}`, payload);
      return data?.data?.project;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(`/projects/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

/**
 * Client submits the post-payment intake brief. Server flips status from
 * `awaiting_brief` → `in_progress` and sets `startDate`, so every project
 * view (list + this detail) needs to refresh.
 */
export function useSubmitBrief() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, brief }: { id: string; brief: Record<string, unknown> }): Promise<Project> => {
      const { data } = await api.post(`/projects/${id}/brief`, { brief });
      return data?.data?.project;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: projectKeys.myList() });
      qc.invalidateQueries({ queryKey: projectKeys.my(variables.id) });
      qc.invalidateQueries({ queryKey: projectKeys.adminList() });
      qc.invalidateQueries({ queryKey: projectKeys.updates(variables.id) });
    },
  });
}

/**
 * Admin posts a new project update. Side-effects on the project doc:
 *   - `updatedAt` always changes (used for "Last updated" stamps)
 *   - `progress` changes if `progressChange` is supplied
 * Both the updates list AND the project lists must refresh.
 */
export function useAddProjectUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, payload }: { projectId: string; payload: AddProjectUpdateInput }) => {
      const { data } = await api.post(`/projects/${projectId}/updates`, payload);
      return data?.data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: projectKeys.updates(variables.projectId) });
      qc.invalidateQueries({ queryKey: projectKeys.adminList() });
      qc.invalidateQueries({ queryKey: projectKeys.myList() });
      qc.invalidateQueries({ queryKey: projectKeys.my(variables.projectId) });
    },
  });
}

export function useDeleteProjectUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, updateId }: { projectId: string; updateId: string }): Promise<void> => {
      await api.delete(`/projects/${projectId}/updates/${updateId}`);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: projectKeys.updates(variables.projectId) });
    },
  });
}
