import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import Breadcrumbs from '../ui/Breadcrumbs';
import PageTransition from '../ui/PageTransition';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900">
      <Navbar />
      <main className="flex-1 pt-20">
        <Breadcrumbs />
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <Footer />
    </div>
  );
}
