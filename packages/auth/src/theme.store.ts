import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'dark',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'theme-storage',
      // Bump on default change so existing users get the new default once
      // (instead of being stuck on their old persisted 'light' value).
      // Anyone who has *explicitly* toggled since seeing dark will set their
      // preference again, which re-persists at this version.
      version: 2,
    }
  )
);
