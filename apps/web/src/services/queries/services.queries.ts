import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@ebringgs/api';

/* ─── Types ───────────────────────────────────────────────────────────── */

export interface IntakeField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'url' | 'email' | 'select' | 'checkbox-group';
  required?: boolean;
  placeholder?: string;
  options?: string[];
  helpText?: string;
}

/**
 * Unified Service shape, every optional field comes from the in-memory
 * services catalog on the backend. The fields populated depend on whether
 * the service is `productized` (fixed-price) or custom-quote.
 */
export interface Service {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: string;
  img?: string;
  productized: boolean;

  // Productized fields
  price?: number;             // naira (full units)
  timeline?: string;
  deliverables?: string[];
  process?: string[];
  whatsIncluded?: string[];
  whatsNotIncluded?: string[];
  revisionsIncluded?: number;
  refundPolicy?: string;
  faq?: { q: string; a: string }[];
  intakeFields?: IntakeField[];
  /**
   * Server gate for whether the Checkout page should offer 1×/2×/3× installments.
   * Computed server-side via `isServiceInstallmentEligible()`, explicit flag
   * wins; falls back to price ≥ ₦200,000.
   */
  installmentEligible?: boolean;
}

export interface ServiceInquiryInput {
  name?: string;            // server overrides with auth'd user when logged in
  email?: string;           // ditto
  serviceId?: string;
  message: string;
  goals?: string;
  budgetRange?: string;
  timeline?: string;
  referenceLinks?: string[];
}

/* ─── Query key factory ───────────────────────────────────────────────── */

export const serviceKeys = {
  all: ['services'] as const,
  list: () => [...serviceKeys.all, 'list'] as const,
  detail: (id: string) => [...serviceKeys.all, 'detail', id] as const,
};

/* ─── Query functions ─────────────────────────────────────────────────── */

async function fetchServices(): Promise<Service[]> {
  const { data } = await api.get('/services');
  return data?.data?.services ?? [];
}

async function fetchService(id: string): Promise<Service | null> {
  const { data } = await api.get(`/services/${id}`);
  return data?.data?.service ?? null;
}

/* ─── Queries ─────────────────────────────────────────────────────────── */

/**
 * The services catalog is a static in-memory array on the backend, it only
 * changes on deploy. Bump the staleTime way up so we don't re-fetch when
 * navigating between /services and /services/:id.
 */
export function useServices() {
  return useQuery({
    queryKey: serviceKeys.list(),
    queryFn: fetchServices,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useService(id: string | undefined) {
  return useQuery({
    queryKey: serviceKeys.detail(id ?? ''),
    queryFn: () => fetchService(id!),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

/* ─── Mutations ───────────────────────────────────────────────────────── */

/**
 * Submit an inquiry for either a productized service (with serviceId) or a
 * custom engagement (without). Server side-effects: persists a ServiceInquiry,
 * pushes to admins, emails admins.
 */
export function useSubmitInquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ServiceInquiryInput): Promise<void> => {
      await api.post('/services/inquire', payload);
    },
    onSuccess: () => {
      // Invalidate the admin service-requests list when that domain is
      // migrated. Until then this is a no-op against any active query.
      qc.invalidateQueries({ queryKey: ['serviceInquiries'] });
    },
  });
}
