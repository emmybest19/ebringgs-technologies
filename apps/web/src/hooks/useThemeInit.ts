import { useEffect } from 'react';
import { useThemeStore } from '../store/theme.store';

export function useThemeInit() {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [mode]);
}
