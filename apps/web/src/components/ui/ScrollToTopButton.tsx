import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

// Floating "back to top" button. Hidden until the user has scrolled past
// 400px so it doesn't clutter the viewport on landing-fold content. Lives
// on the left side so the WhatsApp + AI Tutor stack on the right is free.
export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <button
      type="button"
      onClick={goTop}
      aria-label="Scroll to top"
      className={`fixed bottom-6 left-6 z-40 w-12 h-12 rounded-full bg-gray-900/85 dark:bg-white/95 text-white dark:text-gray-900 backdrop-blur shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-110 ${
        visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none translate-y-2'
      }`}
    >
      <ArrowUp size={20} strokeWidth={2.4} />
    </button>
  );
}
