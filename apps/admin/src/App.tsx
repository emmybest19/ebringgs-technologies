import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@ebringgs/api';
import { ProtectedRoute, useThemeInit } from '@ebringgs/auth';
import { ScrollToTop } from '@ebringgs/ui';

import Layout from './layout/Layout';
import Login from './pages/Login';
import Overview from './pages/Overview';
import Users from './pages/Users';
import { AdminProjectsList, AdminProjectDetail } from './pages/Projects';
import Assignments from './pages/Assignments';
import Cohorts from './pages/Cohorts';
import LiveSessions from './pages/LiveSessions';
import Blogs from './pages/Blogs';
import Payments from './pages/Payments';
import PaymentPlans from './pages/PaymentPlans';
import ServiceRequests from './pages/ServiceRequests';
import Reviews from './pages/Reviews';
import CaseStudies from './pages/CaseStudies';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

/**
 * Admin console — mounted at the root of admin.ebringgs.com. Pure gated
 * surface: login form at /login, dashboard everywhere else. No public marketing,
 * no classroom — admins who need to test those flows use the main site.
 */
function App() {
  useThemeInit();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute allow="admin" redirectTo="/login">
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="users" element={<Users />} />
            <Route path="projects" element={<AdminProjectsList />} />
            <Route path="projects/:id" element={<AdminProjectDetail />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="cohorts" element={<Cohorts />} />
            <Route path="live-sessions" element={<LiveSessions />} />
            <Route path="blogs" element={<Blogs />} />
            <Route path="payments" element={<Payments />} />
            <Route path="payment-plans" element={<PaymentPlans />} />
            <Route path="service-requests" element={<ServiceRequests />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="case-studies" element={<CaseStudies />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              padding: '14px 18px',
              fontSize: '14px',
              fontWeight: 500,
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            },
            success: {
              iconTheme: { primary: '#0d9488', secondary: '#fff' },
              style: { border: '1px solid #ccfbf1', background: '#f0fdfa', color: '#134e4a' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
              style: { border: '1px solid #fee2e2', background: '#fef2f2', color: '#991b1b' },
            },
          }}
        />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}

export default App;
