import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, Lock, Mail, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@ebringgs/auth';
import { useSEO } from '@ebringgs/ui';

export default function AdminLogin() {
  useSEO({ title: 'Admin Sign in', siteName: 'E-Bringgs Admin', noIndex: true });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, logout } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      const role = useAuthStore.getState().user?.role;
      if (role !== 'admin') {
        // Wrong role, sign back out and tell the user
        logout();
        toast.error('This login is for administrators only.');
        return;
      }
      toast.success('Welcome back, admin.');
      navigate(next);
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { message?: string } } })?.response?.data;
      toast.error(res?.message || 'Invalid email or password.');
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-teal-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-linear-to-br from-teal-500 to-cyan-500 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-teal-500/30">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Admin Portal</h1>
          <p className="text-slate-400 text-sm">Sign in to manage E-Bringgs</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="ebringgstechnologies@gmail.com"
                  autoComplete="username"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all ${
                isLoading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40'
              }`}
            >
              {isLoading ? (
                <><Loader2 size={18} className="animate-spin" /> Signing in...</>
              ) : (
                <>Sign in to admin <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500">
              Restricted access. Unauthorized attempts are logged.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Not an admin?{' '}
          <a href="https://ebringgs.com/login" className="text-teal-400 hover:text-teal-300">Sign in here</a>
        </p>
      </div>
    </div>
  );
}
