import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// React Router doesn't reset scroll position when you navigate between routes,
// it just swaps the component. Mount this once inside the router so every
// route change scrolls to the top. Hash links (#section anchors) are
// preserved so jump-to-section still works.
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return null;
}
