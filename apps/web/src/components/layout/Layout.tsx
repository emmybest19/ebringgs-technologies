import { useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import Breadcrumbs from '../ui/Breadcrumbs';
import { PageTransition } from '@ebringgs/ui';
import useScrollReveal from '../../hooks/useScrollReveal';

export default function Layout() {
  const mainRef = useRef<HTMLElement>(null);
  useScrollReveal(mainRef);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900">
      <Navbar />
      {/* pt matches the fixed header's h-24 — the full vertical brand lockup
          needs 96px of header, where the old horizontal one needed 80px. */}
      <main ref={mainRef} className="flex-1 pt-24">
        <Breadcrumbs />
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <Footer />
    </div>
  );
}
