import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@ebringgs/api';
import { ProtectedRoute, useThemeInit } from '@ebringgs/auth';
import { ScrollToTop } from '@ebringgs/ui';
import { Classroom } from '@ebringgs/classroom';

import Layout from './layout/Layout';
import Login from './pages/Login';
import Overview from './pages/Overview';
import Students from './pages/Students';
import Sessions from './pages/Sessions';
import Assignments from './pages/Assignments';
import Recordings from './pages/Recordings';
import Resources from './pages/Resources';
import Profile from './pages/Profile';

/**
 * Teacher portal — mounted at the root of teachers.ebringgs.com.
 * Authentication state is per-origin (localStorage on this subdomain), so a
 * teacher signs in once here and stays signed in until they log out or their
 * refresh token expires. Classroom is mounted here too so teachers join live
 * classes on this same subdomain rather than bouncing to the main site.
 */
function App() {
  useThemeInit();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Standalone login at /login — no layout */}
          <Route path="/login" element={<Login />} />

          {/* Standalone classroom — full-screen, no nav */}
          <Route
            path="/classroom/:roomId"
            element={
              <ProtectedRoute allow="teacher" redirectTo="/login">
                <Classroom />
              </ProtectedRoute>
            }
          />

          {/* Gated dashboard — sidebar layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute allow="teacher" redirectTo="/login">
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="students" element={<Students />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="recordings" element={<Recordings />} />
            <Route path="resources" element={<Resources />} />
            <Route path="profile" element={<Profile />} />
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
