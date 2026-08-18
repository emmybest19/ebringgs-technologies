import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@ebringgs/auth';
import { useReviews } from '../services/queries';
import ReviewCard from '../components/reviews/ReviewCard';
import type { ReviewCardData } from '../components/reviews/ReviewCard';
import { useSEO } from '@ebringgs/ui';
import SocialAuthButtons, { SOCIAL_AUTH_ENABLED } from '../components/auth/SocialAuthButtons';

const stats = [
  { value: '20+', label: 'Students Enrolled' },
  { value: '4', label: 'Projects Delivered' },
  { value: '6', label: 'Projects in Flight' },
];

// ─── Brand art (new identity) ───────────────────────────────────────────────
// Wired directly here rather than through <Logo>, because that shared
// component still serves the old gold/teal art to the navbar, footer and the
// admin + teacher apps — repointing it would roll the rebrand out everywhere
// at once, which is outside this page's scope.
//
// Both source files carry transparent padding around the artwork, so each is
// rendered oversized inside a clipped box to bring the brand flush to its
// container's edges. The multipliers below are the measured ratio of artwork
// to canvas in each file.
const BRAND_LOCKUP = '/ebrings/main.png'; // 1:1  — mark stacked over the wordmark
const BRAND_MARK = '/ebrings/short.png';  // 3:2  — mark alone

function BrandLockup({ height }: { height: number }) {
  return (
    <span
      className="inline-flex items-center justify-center overflow-hidden shrink-0"
      style={{ height, width: height * 1.1 }}
    >
      <img
        src={BRAND_LOCKUP}
        alt="E-Bringgs Technologies"
        draggable={false}
        style={{ height: height * 1.25, width: 'auto', maxWidth: 'none' }}
      />
    </span>
  );
}

function BrandMark({ height }: { height: number }) {
  return (
    <span
      className="inline-flex items-center justify-center overflow-hidden shrink-0"
      style={{ height, width: height }}
    >
      <img
        src={BRAND_MARK}
        alt="E-Bringgs"
        draggable={false}
        style={{ height: height * 1.14, width: 'auto', maxWidth: 'none' }}
      />
    </span>
  );
}

// ─── Left Panel ─────────────────────────────────────────────────────────────
function LeftPanel() {
  const { data } = useReviews({ featured: true, limit: 2 });
  const reviews: ReviewCardData[] = (data?.reviews ?? []) as unknown as ReviewCardData[];

  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0a1210]">
      {/* The panel is deliberately flat — no pattern, no orbs, no floating
          icons. Two very low-opacity brand glows are the only ornament, just
          enough to keep a full-height near-black field from reading as dead. */}
      <div className="absolute inset-0 bg-[radial-gradient(110%_75%_at_18%_30%,rgba(34,211,238,0.10),transparent_62%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(85%_55%_at_85%_92%,rgba(13,148,136,0.08),transparent_60%)]" />

      {/* Content. Logo pins to the top and the copyright to the bottom, with
          the message block centred in whatever height is left over. */}
      <div className="relative z-10 flex flex-col w-full px-12 xl:px-16 py-14">
        <Link to="/" className="inline-flex shrink-0 self-start">
          {/* The lockup stacks vertically, so it needs real height for the
              wordmark and tagline to stay legible — a 50px logo slot would
              render this one unreadable. */}
          <BrandLockup height={128} />
        </Link>

        <div className="flex-1 flex flex-col justify-center max-w-lg py-12">
          <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-[1.12] tracking-tight mb-6">
            Welcome back to E-Bringgs
          </h2>
          <p className="text-slate-400 text-base xl:text-lg leading-relaxed mb-14">
            Your personalized learning dashboard, live courses, collaborative cohort
            projects, and structured mentor guidelines are waiting. Pick up right
            where you left off.
          </p>

          {/* Stats. Fixed three-column grid so the labels line up on a common
              baseline regardless of how wide each number renders. */}
          <div className="grid grid-cols-3 gap-6">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-extrabold text-cyan-400">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1.5">{s.label}</p>
              </div>
            ))}
          </div>

          {reviews.length > 0 && (
            <div className="space-y-4 mt-14">
              {reviews.map((r) => (
                <ReviewCard key={r._id} review={r} dark />
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-slate-600 shrink-0">
          © {new Date().getFullYear()} ebringgs inc. All rights reserved.
        </p>
      </div>
    </div>
  );
}

// ─── Main Login Page ────────────────────────────────────────────────────────
export default function Login() {
  useSEO({ title: 'Sign in', description: 'Sign in to your E-Bringgs account.', noIndex: true });
  const location = useLocation();
  const prefilledEmail = (location.state as { email?: string } | null)?.email ?? '';
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Welcome back!');
      const role = useAuthStore.getState().user?.role;
      // Admins and teachers need to land on their own subdomain — they
      // authenticate per-origin, so a navigate() here would just dump them
      // on /admin or /teacher on this app, which no longer exists.
      const adminUrl = (import.meta.env.VITE_ADMIN_URL as string | undefined) || 'https://admin.ebringgs.com';
      const teacherUrl = (import.meta.env.VITE_TEACHER_URL as string | undefined) || 'https://teachers.ebringgs.com';
      if (role === 'admin') window.location.href = adminUrl;
      else if (role === 'teacher') window.location.href = teacherUrl;
      else if (role === 'client') navigate('/client');
      else navigate('/dashboard');
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { message?: string; errors?: { field: string; message: string }[] } } })?.response?.data;
      const msg = res?.errors?.map(e => e.message).join('. ') || res?.message || 'Invalid email or password.';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-slate-950">
      {/* ── Left Panel ──────────────────────────────────────────────── */}
      <LeftPanel />

      {/* ── Right Panel (Form) ──────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Link to="/" className="flex items-center gap-2.5">
            {/* Half the mark is white/silver, so on a light surface it needs a
                dark plate under it or it simply disappears. In dark mode the
                plate is dropped and the art sits on the panel directly. */}
            <span className="inline-flex rounded-lg bg-slate-900 p-1.5 dark:bg-transparent dark:p-0">
              <BrandMark height={26} />
            </span>
            <span className="font-extrabold text-xl tracking-tight text-gray-900 dark:text-white">
              e-bringgs
            </span>
          </Link>

          <Link to="/register" className="text-sm text-cyan-600 font-medium">Sign up</Link>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="mb-8">
              <div className="hidden lg:block mb-5">
                <span className="inline-flex rounded-xl bg-slate-900 p-2.5 dark:bg-transparent dark:p-0">
                  <BrandMark height={40} />
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sign in to your account</h1>
              <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
                Don't have an account?{' '}
                <Link to="/register" className="text-cyan-600 font-semibold hover:text-cyan-800 dark:hover:text-cyan-400 transition-colors">
                  Sign up free
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Email address</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Password</label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-cyan-600 font-medium hover:text-cyan-800 dark:hover:text-cyan-400 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-11 pr-12 py-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  isLoading
                    ? 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-not-allowed'
                    : 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-0.5'
                }`}
              >
                {isLoading ? (
                  <><Loader2 size={18} className="animate-spin" /> Signing in...</>
                ) : (
                  <>Sign in <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            {/* Social sign-in (with its divider) — hidden while
                SOCIAL_AUTH_ENABLED is off so no orphan "OR" is left. */}
            {SOCIAL_AUTH_ENABLED && (
              <>
                <div className="flex items-center gap-4 my-8">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
                  <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">OR</span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
                </div>

                <div className="mb-8">
                  <SocialAuthButtons
                    onSuccess={(socialRole) => {
                      const adminUrl = (import.meta.env.VITE_ADMIN_URL as string | undefined) || 'https://admin.ebringgs.com';
                      const teacherUrl = (import.meta.env.VITE_TEACHER_URL as string | undefined) || 'https://teachers.ebringgs.com';
                      if (socialRole === 'admin') window.location.href = adminUrl;
                      else if (socialRole === 'teacher') window.location.href = teacherUrl;
                      else if (socialRole === 'client') navigate('/client');
                      else navigate('/dashboard');
                    }}
                  />
                </div>
              </>
            )}

            {/* Quick info */}
            <div className="bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-5">
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">Why E-Bringgs?</p>
              <ul className="space-y-2.5">
                {[
                  'Structured learning with real projects',
                  'Professional software & design services',
                  'Expert mentorship from industry leaders',
                  'Pan-African tech community',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-cyan-50 dark:bg-cyan-950 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={12} className="text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-slate-400">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer links */}
            <p className="text-center text-xs text-gray-400 dark:text-slate-500 mt-8">
              By signing in you agree to our{' '}
              <Link to="/terms" className="text-cyan-600 hover:underline">Terms</Link>{' '}and{' '}
              <Link to="/privacy" className="text-cyan-600 hover:underline">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
