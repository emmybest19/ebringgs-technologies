import { QueryClient } from '@tanstack/react-query';

/**
 * Shared TanStack Query client for the entire app.
 *
 * Defaults chosen for an EdTech / services product where:
 *   - data freshness matters (cohort capacity, payment status) but not on every keystroke
 *   - background refetch-on-focus is jarring inside a learning UI (interrupts video, scrolls forms)
 *   - one transient network blip shouldn't show an error state
 *
 * Override per-query when you need different behavior (e.g. payment polling).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 30s, navigation within that window
      // serves from cache without a refetch. Tune up for read-heavy public
      // pages (blog list), tune down for fast-changing data (live counts).
      staleTime: 30 * 1000,

      // Keep unused query data in cache for 5 minutes after the last
      // subscriber unmounts. Default, explicit for clarity.
      gcTime: 5 * 60 * 1000,

      // One retry on failure. Network-flake friendly without masking real bugs.
      retry: 1,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),

      // Off, refetching mid-lesson when the user tabs back to the classroom
      // restarts video players and resets forms. The 30s staleTime is enough.
      refetchOnWindowFocus: false,

      // On, coming back online should pull fresh data.
      refetchOnReconnect: true,
    },
    mutations: {
      // Mutations never auto-retry. The user pressed the button on purpose;
      // a silent retry on a "create cohort" call could double-create.
      retry: 0,
    },
  },
});
