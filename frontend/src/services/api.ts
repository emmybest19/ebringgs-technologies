import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401, or surface PAYMENT_REQUIRED on 403
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const body = error.response?.data as { error?: string; paymentPlanId?: string; message?: string } | undefined;

    // 403 PAYMENT_REQUIRED — user has a suspended installment plan blocking
    // the resource they tried to access. The backend's feature-access
    // middleware sends `{ error: 'PAYMENT_REQUIRED', paymentPlanId, ... }`.
    // We redirect the user to the plan page so they can settle and continue.
    if (status === 403 && body?.error === 'PAYMENT_REQUIRED' && body.paymentPlanId) {
      // Avoid an infinite loop if the redirect target itself 403s for some reason.
      if (!window.location.pathname.startsWith('/payments/plan/')) {
        window.location.href = `/payments/plan/${body.paymentPlanId}`;
      }
      return Promise.reject(error);
    }

    if (status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
            { refreshToken }
          );
          localStorage.setItem('accessToken', data.data.accessToken);
          original.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(original);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
