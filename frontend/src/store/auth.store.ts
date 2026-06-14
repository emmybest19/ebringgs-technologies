import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/index';
import api from '../services/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string, referralCode?: string) => Promise<void>;
  loginWithGoogle: (idToken: string, opts?: { role?: string; referralCode?: string }) => Promise<void>;
  loginWithApple: (idToken: string, opts?: { name?: string; role?: string; referralCode?: string }) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          const { user, accessToken, refreshToken } = data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          set({ user, accessToken, refreshToken, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (name, email, password, role = 'student', referralCode) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/register', {
            name, email, password, role,
            ...(referralCode ? { referralCode } : {}),
          });
          const { user, accessToken, refreshToken } = data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          set({ user, accessToken, refreshToken, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      loginWithGoogle: async (idToken, opts = {}) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/oauth/google', { idToken, ...opts });
          const { user, accessToken, refreshToken } = data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          set({ user, accessToken, refreshToken, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      loginWithApple: async (idToken, opts = {}) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/oauth/apple', { idToken, ...opts });
          const { user, accessToken, refreshToken } = data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          set({ user, accessToken, refreshToken, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      fetchMe: async () => {
        if (!get().accessToken) return;
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data.data.user, isAuthenticated: true });
        } catch (err) {
          // Only log out on auth errors (401/404). Network/server errors should
          // leave the existing session intact so the user can retry.
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status === 401 || status === 404) {
            get().logout();
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
