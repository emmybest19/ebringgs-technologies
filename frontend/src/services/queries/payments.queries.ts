import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';

/* ─── Types ───────────────────────────────────────────────────────────── */

export type TransactionStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

/**
 * Transactions are fetched from `/api/paystack/transactions`. The
 * `stripePaymentIntentId` field is a legacy column name that now stores
 * the Paystack transaction reference, rename to `providerReference` in a
 * future migration.
 */
export interface Transaction {
  _id: string;
  user: string | { _id?: string; name?: string; email?: string };
  description: string;
  amount: number;            // kobo
  currency: string;
  status: TransactionStatus;
  type: string;              // 'one_time' | 'subscription' | 'installment'
  stripePaymentIntentId: string;
  createdAt: string;
  paymentPlanId?: string;
  installmentNumber?: number;
}

export interface InitializePaymentInput {
  callbackUrl?: string;
  pointsToRedeem?: number;
  voucherCode?: string;
  // Service purchase path
  serviceId?: string;
  // Plan / project path
  amount?: number;             // kobo
  description?: string;
  projectId?: string;
  // Training plan id (e.g. 'frontend-cohort'), used by server to link the
  // PaymentPlan to the right training program.
  planId?: string;
  // Installment payments: 1 (default) | 2 | 3. When > 1, autoChargeConsent
  // must also be true, server rejects otherwise.
  installments?: 1 | 2 | 3;
  autoChargeConsent?: boolean;
}

export interface InitializePaymentResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
  /** Set when installments > 1 was requested, the new PaymentPlan id. */
  paymentPlanId?: string;
  /** Echoes back what the server interpreted (1/2/3). */
  installmentCount?: number;
}

export interface VerifyPaymentResponse {
  paymentStatus: 'succeeded' | 'failed';
  projectId?: string;
  purchaseType?: 'service' | 'plan' | 'project';
  /** Set when the verified transaction was installment 1 of a plan. */
  paymentPlanId?: string;
}

/* ─── Query key factory ───────────────────────────────────────────────── */

export const paymentKeys = {
  all: ['payments'] as const,
  myTransactions: () => [...paymentKeys.all, 'my', 'transactions'] as const,
  adminTransactions: () => [...paymentKeys.all, 'admin', 'transactions'] as const,
  verify: (reference: string) => [...paymentKeys.all, 'verify', reference] as const,
};

/* ─── Query functions ─────────────────────────────────────────────────── */

async function fetchMyTransactions(): Promise<Transaction[]> {
  const { data } = await api.get('/paystack/transactions');
  return data?.data?.transactions ?? [];
}

async function fetchAllTransactions(): Promise<Transaction[]> {
  const { data } = await api.get('/payments/transactions');
  return data?.data?.transactions ?? [];
}

async function verifyTransaction(reference: string): Promise<VerifyPaymentResponse> {
  const { data } = await api.get(`/paystack/verify/${reference}`);
  return data?.data ?? { paymentStatus: 'failed' };
}

/* ─── Queries ─────────────────────────────────────────────────────────── */

export function useMyTransactions() {
  return useQuery({
    queryKey: paymentKeys.myTransactions(),
    queryFn: fetchMyTransactions,
  });
}

/** Admin, every user's transactions. */
export function useAllTransactions() {
  return useQuery({
    queryKey: paymentKeys.adminTransactions(),
    queryFn: fetchAllTransactions,
  });
}

/**
 * Verify a Paystack transaction by reference. Yes, GET, but the server
 * has side effects (creates Project, claims voucher, awards referral
 * points). `staleTime: Infinity` ensures we only ever verify a given
 * reference once per cache lifetime.
 */
export function useVerifyPayment(reference: string | null | undefined) {
  return useQuery({
    queryKey: paymentKeys.verify(reference ?? ''),
    queryFn: () => verifyTransaction(reference!),
    enabled: !!reference,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    retry: 0, // don't replay a server-side-effects request on transient failure
  });
}

/* ─── Mutations ───────────────────────────────────────────────────────── */

/**
 * Initialize a Paystack checkout. The success handler returns the
 * authorizationUrl, the caller usually redirects the browser to it.
 */
export function useInitializePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: InitializePaymentInput): Promise<InitializePaymentResponse> => {
      const { data } = await api.post('/paystack/initialize', payload);
      return data?.data;
    },
    onSuccess: () => {
      // A pending Transaction row was just created server-side, refresh
      // the transactions list so the user sees it.
      qc.invalidateQueries({ queryKey: paymentKeys.myTransactions() });
    },
  });
}
