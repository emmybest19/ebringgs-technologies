import { useEffect, type RefObject } from 'react';

/**
 * Site-wide scroll-reveal. Watches every `<section>` (plus any `.reveal`
 * opt-in element) inside the given container and toggles the `reveal-in`
 * class as it enters/leaves the viewport, so content fades+slides in on
 * entry and fades back out on exit. The CSS lives in @ebringgs/styles
 * (`.reveal-init` / `.reveal-in` / `.reveal-above`), gated behind
 * prefers-reduced-motion.
 *
 * Smoothness details:
 * - Hysteresis: an element must show a meaningful slice of itself before it
 *   reveals, but only hides once it is FULLY out of view — so nothing
 *   flickers while hovering at the viewport edge.
 * - Direction-aware: elements that exit past the top get `.reveal-above`,
 *   so scrolling back up makes them glide down into place instead of
 *   sliding up from below (which would feel backwards).
 * - The visibility requirement is pixel-capped (120px) so very tall
 *   sections still reveal promptly instead of waiting for a percentage.
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
          const el = entry.target as HTMLElement;
          const visiblePx = entry.intersectionRect.height;
          const neededPx = Math.min(120, entry.boundingClientRect.height * 0.18);

          if (entry.isIntersecting && visiblePx >= neededPx) {
            el.classList.add('reveal-in');
          } else if (!entry.isIntersecting) {
            el.classList.remove('reveal-in');
            // Exited past the top → re-enter by gliding down, not up.
            // Horizontal halves keep their own axis, so skip them.
            const horizontal =
              el.classList.contains('reveal-left') || el.classList.contains('reveal-right');
            if (!horizontal) {
              el.classList.toggle('reveal-above', entry.boundingClientRect.top < 0);
            }
          }
          // Partially visible but below the reveal threshold: keep current
          // state (this gap is what prevents edge flicker).
        }
      },
      { threshold: [0, 0.06, 0.12, 0.18, 0.24, 0.3] },
    );

    const tracked = new Set<Element>();
    const track = () => {
      // `.no-reveal` opts a section out entirely (heroes and other
      // above-the-fold content should render instantly, not fade).
      // `.reveal-left` / `.reveal-right` are the halves of split
      // text|image rows — they slide in from their own side.
      const selector = 'section:not(.no-reveal), .reveal, .reveal-left, .reveal-right';
      container.querySelectorAll(selector).forEach((el) => {
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
      tracked.forEach((el) =>
        el.classList.remove('reveal-init', 'reveal-in', 'reveal-above'),
      );
    };
  }, [containerRef]);
}
