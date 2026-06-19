import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, CheckCircle2,
  Code2, Smartphone, BarChart3, Globe, Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth.store';
import { useReviews } from '../services/queries';
import ReviewCard from '../components/reviews/ReviewCard';
import type { ReviewCardData } from '../components/reviews/ReviewCard';
import { Logo } from '@ebringgs/ui';
import SocialAuthButtons from '../components/auth/SocialAuthButtons';

// ─── Floating Icons (same as Register for consistency) ──────────────────────
const floatingIcons = [
  { Icon: Code2, top: '12%', left: '8%', delay: '0s', size: 20 },
  { Icon: Smartphone, top: '25%', right: '12%', delay: '1.5s', size: 18 },
  { Icon: BarChart3, bottom: '30%', left: '10%', delay: '3s', size: 22 },
  { Icon: Globe, bottom: '15%', right: '8%', delay: '0.8s', size: 16 },
  { Icon: Zap, top: '55%', left: '85%', delay: '2.2s', size: 14 },
];

const stats = [
  { value: '500+', label: 'Students enrolled' },
  { value: '50+', label: 'Projects delivered' },
  { value: '15+', label: 'Expert mentors' },
];

// ─── Left Panel ─────────────────────────────────────────────────────────────
function LeftPanel() {
  const { data } = useReviews({ featured: true, limit: 2 });
  const reviews: ReviewCardData[] = (data?.reviews ?? []) as unknown as ReviewCardData[];

  return (
    <div className="hidden lg:flex lg:w-1/2 relative bg-linear-to-br from-slate-900 via-teal-950 to-cyan-950 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%2314b8a6%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />

      {/* Glowing orbs */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-teal-500/15 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Floating icons */}
      {floatingIcons.map(({ Icon, delay, size, ...pos }, i) => (
        <div
          key={i}
          className="absolute text-teal-400/20 animate-[float_6s_ease-in-out_infinite]"
          style={{ ...pos, animationDelay: delay } as React.CSSProperties}
        >
          <Icon size={size} />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 py-16">
        {/* Logo */}
        <div className="mb-12">
          <Link to="/" className="inline-block rounded-2xl bg-white p-3 shadow-lg">
            <Logo variant="full" size={56} />
          </Link>
        </div>

        {/* Main message */}
        <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-4">
          Welcome back to{' '}
          <span className="bg-linear-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
            E-Bringgs
          </span>
        </h2>
        <p className="text-slate-300 text-lg mb-10 leading-relaxed max-w-md">
          Your dashboard, courses, projects, and community are waiting. Pick up right where you left off.
        </p>

        {/* Stats row */}
        <div className="flex gap-8 mb-12">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-extrabold text-white">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="space-y-4 mt-auto">
            {reviews.map((r) => (
              <ReviewCard key={r._id} review={r} dark />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Login Page ────────────────────────────────────────────────────────
export default function Login() {
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
      if (role === 'admin') navigate('/admin');
      else if (role === 'teacher') navigate('/teacher');
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
          <Logo variant="mark" size={32} asLink withWordmark wordmarkClass="text-gray-900 dark:text-white" />

          <Link to="/register" className="text-sm text-teal-600 font-medium">Sign up</Link>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="mb-8">
              <div className="hidden lg:block mb-5">
                <Logo variant="mark" size={48} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sign in to your account</h1>
              <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
                Don't have an account?{' '}
                <Link to="/register" className="text-teal-600 font-semibold hover:text-teal-800 dark:hover:text-teal-400 transition-colors">
                  Sign up free
                </Link>
              </p>
            </div>

            {/* Form */}
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
                    className="w-full pl-11 pr-4 py-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Password</label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-teal-600 font-medium hover:text-teal-800 dark:hover:text-teal-400 transition-colors"
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
                    className="w-full pl-11 pr-12 py-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all text-sm"
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
                    : 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:-translate-y-0.5'
                }`}
              >
                {isLoading ? (
                  <><Loader2 size={18} className="animate-spin" /> Signing in...</>
                ) : (
                  <>Sign in <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
              <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">OR</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
            </div>

            {/* Social sign-in */}
            <div className="mb-8">
              <SocialAuthButtons
                onSuccess={(socialRole) => {
                  if (socialRole === 'admin') navigate('/admin');
                  else if (socialRole === 'teacher') navigate('/teacher');
                  else if (socialRole === 'client') navigate('/client');
                  else navigate('/dashboard');
                }}
              />
            </div>

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
                    <div className="w-5 h-5 rounded-full bg-teal-50 dark:bg-teal-950 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={12} className="text-teal-600 dark:text-teal-400" />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-slate-400">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer links */}
            <p className="text-center text-xs text-gray-400 dark:text-slate-500 mt-8">
              By signing in you agree to our{' '}
              <Link to="/terms" className="text-teal-600 hover:underline">Terms</Link>{' '}and{' '}
              <Link to="/privacy" className="text-teal-600 hover:underline">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>

      {/* ── Global CSS for animations ───────────────────────────────── */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-12px) rotate(3deg); }
          66% { transform: translateY(6px) rotate(-2deg); }
        }
      `}</style>
    </div>
  );
}
