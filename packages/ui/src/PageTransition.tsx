import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

/**
 * Wraps page content with a smooth fade-up transition keyed to the current
 * route. Drop this around <Outlet /> in any layout.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
