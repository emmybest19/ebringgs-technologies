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
      <main ref={mainRef} className="flex-1 pt-20">
        <Breadcrumbs />
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <Footer />
    </div>
  );
}
