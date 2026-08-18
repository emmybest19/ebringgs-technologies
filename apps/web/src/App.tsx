import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@ebringgs/api";
import Layout from "./components/layout/Layout";
import WhatsAppButton from "./components/ui/WhatsAppButton";
import ScrollToTopButton from "./components/ui/ScrollToTopButton";
import SiteAssistantWidget from "./components/ui/SiteAssistantWidget";
import ClientLayout from "./components/layout/ClientLayout";
import StudentLayout from "./components/layout/StudentLayout";
import { ProtectedRoute, useThemeInit } from "@ebringgs/auth";
import { ScrollToTop } from "@ebringgs/ui";

// Public pages
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import Services from "./pages/Services";
import CapabilityDetail from "./pages/CapabilityDetail";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import About from "./pages/About";
import HowItWorks from "./pages/HowItWorks";
import SuccessStories from "./pages/SuccessStories";
import Portfolio from "./pages/Portfolio";
import Schedule from "./pages/Schedule";
import Instructors from "./pages/Instructors";
import Values from "./pages/Values";
import VerifyCertificate from "./pages/VerifyCertificate";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import CaseStudyDetail from "./pages/CaseStudyDetail";

// Auth pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";

// Payment pages
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import PaymentPlanDetail from "./pages/PaymentPlanDetail";

// User pages
import Profile from "./pages/Profile";
import Certificate from "./pages/Certificate";

// Student dashboard pages
import StudentOverview from "./pages/student/Overview";
import StudentSchedule from "./pages/student/Schedule";
import StudentAssignments from "./pages/student/Assignments";
import StudentRecordings from "./pages/student/Recordings";
import StudentLeaderboard from "./pages/student/Leaderboard";
import StudentReviews from "./pages/student/Reviews";
import StudentInstructors from "./pages/student/Instructors";
import StudentInstructorDetail from "./pages/student/InstructorDetail";
import StudentServices from "./pages/student/Services";
import StudentServiceDetail from "./pages/student/ServiceDetail";

// Client dashboard pages
import ClientOverview from "./pages/client/ClientOverview";
import { ProjectList, ProjectDetail } from "./pages/client/ClientProjects";
import ClientPayments from "./pages/client/ClientPayments";
import ClientReviews from "./pages/client/ClientReviews";
import ClientServices from "./pages/client/ClientServices";
import ClientServiceDetail from "./pages/client/ClientServiceDetail";
import ClientScheduleCall from "./pages/client/ClientScheduleCall";
import ProjectBrief from "./pages/client/ProjectBrief";

// Classroom — shared package, mounted here for students
import { Classroom } from "@ebringgs/classroom";

/**
 * Floating widgets (SiteAssistantWidget chat bubble + WhatsAppButton) appear
 * on the landing page only.
 *
 * They exist to catch a first-time visitor who has a question before they
 * commit to anything. Once someone has navigated deeper — pricing, services,
 * a blog post — they're already engaged and reading, and two floating bubbles
 * over the content are a distraction rather than a help.
 *
 * An allowlist of one route rather than a blocklist of private prefixes: new
 * pages then default to *not* carrying the widgets, which is the safer
 * direction to be wrong in.
 */
const WIDGET_ROUTES = ['/'];

function LandingOnlyWidgets() {
  const { pathname } = useLocation();
  if (!WIDGET_ROUTES.includes(pathname)) return null;
  return (
    <>
      <SiteAssistantWidget />
      <WhatsAppButton />
    </>
  );
}

function App() {
  useThemeInit();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
        {/* Auth, standalone (no nav) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Payment, standalone */}
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/failed" element={<PaymentFailed />} />
        <Route path="/payments/plan/:id" element={<PaymentPlanDetail />} />

        {/* Classroom, full-screen, no nav. Students join here; teachers join
            on teachers.ebringgs.com/classroom/:roomId (same code, different
            origin, separate auth — see @ebringgs/classroom). */}
        <Route path="/classroom/:roomId" element={<Classroom />} />

        {/* Client, sidebar layout (gated to client role) */}
        <Route
          path="/client"
          element={
            <ProtectedRoute allow="client">
              <ClientLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ClientOverview />} />
          <Route path="projects" element={<ProjectList />} />
          <Route path="projects/:projectId" element={<ProjectDetail />} />
          <Route path="projects/:projectId/brief" element={<ProjectBrief />} />
          <Route path="payments" element={<ClientPayments />} />
          <Route path="services" element={<ClientServices />} />
          <Route path="services/:id" element={<ClientServiceDetail />} />
          <Route path="schedule-call" element={<ClientScheduleCall />} />
          <Route path="reviews" element={<ClientReviews />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Main public layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:slug" element={<CapabilityDetail />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/about" element={<About />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/success-stories" element={<SuccessStories />} />
          <Route path="/success-stories/:slug" element={<CaseStudyDetail />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/portfolio/:slug" element={<CaseStudyDetail />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/about/team" element={<Instructors />} />
          <Route path="/about/values" element={<Values />} />
          {/* Old public URL for the team page; kept so existing links resolve. */}
          <Route path="/instructors" element={<Navigate to="/about/team" replace />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/verify-certificate" element={<VerifyCertificate />} />
          <Route path="/certificate/:courseId" element={<Certificate />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Student, sidebar layout (gated to student role) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allow="student">
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentOverview />} />
          <Route path="schedule" element={<StudentSchedule />} />
          <Route path="assignments" element={<StudentAssignments />} />
          <Route path="recordings" element={<StudentRecordings />} />
          <Route path="instructors" element={<StudentInstructors />} />
          <Route path="instructors/:id" element={<StudentInstructorDetail />} />
          <Route path="services" element={<StudentServices />} />
          <Route path="services/:id" element={<StudentServiceDetail />} />
          <Route path="leaderboard" element={<StudentLeaderboard />} />
          <Route path="reviews" element={<StudentReviews />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
      <LandingOnlyWidgets />
      <ScrollToTopButton />
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

function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <p className="text-7xl font-extrabold text-teal-600 mb-4">404</p>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Page not found
      </h1>
      <p className="text-gray-500 dark:text-slate-400 mb-6">
        The page you're looking for doesn't exist.
      </p>
      <a
        href="/"
        className="px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors"
      >
        Go home
      </a>
    </div>
  );
}

export default App;
