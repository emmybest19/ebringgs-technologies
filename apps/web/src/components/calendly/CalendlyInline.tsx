import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useCalendlyScript } from '../../hooks/useCalendlyScript';
import { useThemeStore } from '@ebringgs/auth';

interface CalendlyInlineProps {
  url: string;
  /** Prefill data (Calendly's data-prefill). */
  prefill?: { name?: string; email?: string; customAnswers?: Record<string, string> };
  /** UTM tracking parameters. */
  utm?: Record<string, string>;
  /** Container height — Calendly's iframe is fixed-height inside this. */
  height?: number | string;
  className?: string;
}

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (opts: {
        url: string;
        parentElement: HTMLElement;
        prefill?: CalendlyInlineProps['prefill'];
        utm?: Record<string, string>;
      }) => void;
      initPopupWidget: (opts: { url: string; prefill?: CalendlyInlineProps['prefill']; utm?: Record<string, string> }) => void;
    };
  }
}

/**
 * Themes the Calendly URL based on app theme (light/dark) by appending
 * Calendly's color query params. Calendly itself reads these inside the iframe.
 */
function themedUrl(url: string, isDark: boolean): string {
  const u = new URL(url);
  if (isDark) {
    u.searchParams.set('background_color', '0f172a');     // slate-950
    u.searchParams.set('text_color', 'f1f5f9');           // slate-100
    u.searchParams.set('primary_color', '14b8a6');        // teal-500
    u.searchParams.set('hide_landing_page_details', '1');
    u.searchParams.set('hide_event_type_details', '1');
  } else {
    u.searchParams.set('background_color', 'ffffff');
    u.searchParams.set('text_color', '0f172a');
    u.searchParams.set('primary_color', '0d9488');        // teal-600
  }
  return u.toString();
}

export default function CalendlyInline({
  url,
  prefill,
  utm,
  height = 720,
  className = '',
}: CalendlyInlineProps) {
  const { ready } = useCalendlyScript();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';

  useEffect(() => {
    if (!ready || !containerRef.current || !window.Calendly) return;
    containerRef.current.innerHTML = ''; // re-init on theme change
    window.Calendly.initInlineWidget({
      url: themedUrl(url, isDark),
      parentElement: containerRef.current,
      prefill,
      utm,
    });
  }, [ready, url, isDark, prefill, utm]);

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm ${className}`}
      style={{ minHeight: height }}
    >
      {!ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-slate-500">
          <Loader2 size={24} className="animate-spin mb-2 text-teal-600" />
          <p className="text-xs">Loading scheduler…</p>
        </div>
      )}
      <div ref={containerRef} style={{ minWidth: 320, height }} />
    </div>
  );
}
