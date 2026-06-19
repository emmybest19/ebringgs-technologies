import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@ebringgs/api';

/* ─── Types ───────────────────────────────────────────────────────────── */

export type LinkedKind = 'service' | 'plan' | 'project' | 'cohort';

export type InstallmentStatus = 'pending' | 'paid' | 'failed' | 'manual';

export type PaymentPlanStatus =
  | 'active' | 'completed' | 'overdue' | 'suspended' | 'cancelled';

export interface Installment {
  amount: number;             // kobo
  dueDate: string;
  status: InstallmentStatus;
  transactionId?: string;
  lastChargeMessage?: string;
  attemptCount: number;
  paidAt?: string;
}

export interface PaymentPlan {
  _id: string;
  user: string;
  linkedKind: LinkedKind;
  linkedServiceId?: string;
  linkedPlanId?: string;
  linkedProject?: string;
  linkedCohort?: string;
  description: string;
  totalAmount: number;        // kobo
  installments: Installment[];
  authorizationCode?: string;
  cardLast4?: string;
  cardBrand?: string;
  status: PaymentPlanStatus;
  gracePeriodEndsAt?: string;
  suspendedAt?: string;
  completedAt?: string;
  autoChargeConsent: boolean;
  createdAt: string;
  updatedAt: string;

  // Decorated server-side
  paidCount: number;
  amountPaid: number;
  amountRemaining: number;
  nextInstallment: Installment | null;
}

export type PaymentPlanAdminFilter = '' | PaymentPlanStatus;

/* ─── Query key factory ───────────────────────────────────────────────── */

export const paymentPlanKeys = {
  all: ['paymentPlans'] as const,
  myList: () => [...paymentPlanKeys.all, 'my', 'list'] as const,
  my: (id: string) => [...paymentPlanKeys.all, 'my', 'detail', id] as const,
  adminList: (filter: PaymentPlanAdminFilter) => [...paymentPlanKeys.all, 'admin', 'list', filter] as const,
};

/* ─── Query functions ─────────────────────────────────────────────────── */

async function fetchMyPaymentPlans(): Promise<PaymentPlan[]> {
  const { data } = await api.get('/payment-plans/my');
  return data?.data?.plans ?? [];
}

async function fetchPaymentPlan(id: string): Promise<PaymentPlan | null> {
  const { data } = await api.get(`/payment-plans/${id}`);
  return data?.data?.plan ?? null;
}

async function fetchAdminPaymentPlans(filter: PaymentPlanAdminFilter): Promise<PaymentPlan[]> {
  const params = filter ? `?status=${filter}` : '';
  const { data } = await api.get(`/payment-plans/admin/all${params}`);
  return data?.data?.plans ?? [];
}

/* ─── Queries ─────────────────────────────────────────────────────────── */

export function useMyPaymentPlans() {
  return useQuery({
    queryKey: paymentPlanKeys.myList(),
    queryFn: fetchMyPaymentPlans,
  });
}

export function useMyPaymentPlan(id: string | undefined) {
  return useQuery({
    queryKey: paymentPlanKeys.my(id ?? ''),
    queryFn: () => fetchPaymentPlan(id!),
    enabled: !!id,
  });
}

export function useAdminPaymentPlans(filter: PaymentPlanAdminFilter = '') {
  return useQuery({
    queryKey: paymentPlanKeys.adminList(filter),
    queryFn: () => fetchAdminPaymentPlans(filter),
  });
}

/* ─── Mutations (admin) ───────────────────────────────────────────────── */

export function useExtendPaymentPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, extraDays }: { id: string; extraDays: number }): Promise<PaymentPlan> => {
      const { data } = await api.post(`/payment-plans/${id}/extend`, { extraDays });
      return data?.data?.plan;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentPlanKeys.all });
    },
  });
}

export function useMarkInstallmentPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }): Promise<PaymentPlan> => {
      const { data } = await api.post(`/payment-plans/${id}/mark-paid`, { note });
      return data?.data?.plan;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentPlanKeys.all });
    },
  });
}
