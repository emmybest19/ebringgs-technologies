import { useEffect, useState } from 'react';

const SCRIPT_SRC = 'https://assets.calendly.com/assets/external/widget.js';
const STYLE_HREF = 'https://assets.calendly.com/assets/external/widget.css';

/**
 * Lazy-loads the Calendly widget script (and its stylesheet) once for the
 * whole app, on demand. Returns `ready === true` after the global
 * `window.Calendly` is attached, so callers can mount inline embeds or fire
 * the popup without racing the script.
 */
export function useCalendlyScript(): { ready: boolean } {
  const [ready, setReady] = useState<boolean>(
    typeof window !== 'undefined' && Boolean((window as unknown as { Calendly?: unknown }).Calendly),
  );

  useEffect(() => {
    if (ready) return;

    if (!document.querySelector(`link[href="${STYLE_HREF}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = STYLE_HREF;
      document.head.appendChild(link);
    }

    let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      document.body.appendChild(script);
    }

    const handleLoad = () => setReady(true);
    if ((window as unknown as { Calendly?: unknown }).Calendly) {
      setReady(true);
    } else {
      script.addEventListener('load', handleLoad);
    }
    return () => script?.removeEventListener('load', handleLoad);
  }, [ready]);

  return { ready };
}
