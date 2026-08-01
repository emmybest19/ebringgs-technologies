import { useEffect, type RefObject } from 'react';

/**
 * Site-wide scroll-reveal. Watches every `<section>` (plus any `.reveal`
 * opt-in element) inside the given container and toggles the `reveal-in`
 * class as it enters/leaves the viewport, so content fades+slides in on
 * entry and fades back out on exit. The CSS lives in @ebringgs/styles
 * (`.reveal-init` / `.reveal-in`), gated behind prefers-reduced-motion.
 *
 * A MutationObserver keeps it working for content that mounts after the
 * first paint (route changes through <Outlet/>, react-query data arriving).
 */
export default function useScrollReveal(containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof IntersectionObserver === 'undefined') return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle('reveal-in', entry.isIntersecting);
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -8% 0px' },
    );

    const tracked = new Set<Element>();
    const track = () => {
      container.querySelectorAll('section, .reveal').forEach((el) => {
        if (tracked.has(el)) return;
        tracked.add(el);
        el.classList.add('reveal-init');
        io.observe(el);
      });
    };

    track();
    const mo = new MutationObserver(track);
    mo.observe(container, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
      tracked.forEach((el) => el.classList.remove('reveal-init', 'reveal-in'));
    };
  }, [containerRef]);
}
