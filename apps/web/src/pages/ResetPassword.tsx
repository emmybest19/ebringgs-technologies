import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@ebringgs/api';
import { Logo, useSEO } from '@ebringgs/ui';

export default function ResetPassword() {
  useSEO({ title: 'Reset password', noIndex: true });
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match.'); return; }
    if (password.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
      toast.success('Password updated! Redirecting...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-teal-50 dark:from-slate-950 dark:to-slate-900 px-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-10 max-w-sm w-full text-center">
          <p className="text-gray-500 dark:text-slate-400">Invalid reset link. Please request a new one.</p>
          <Link to="/forgot-password" className="mt-4 inline-block text-teal-600 font-medium text-sm">Request reset</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-teal-50 dark:from-slate-950 dark:to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-8">
          <div className="text-center mb-8">
            <div className="inline-block mb-4">
              <Logo variant="mark" size={48} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create new password</h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Choose a strong password for your account</p>
          </div>

          {success ? (
            <div className="text-center py-6">
              <div className="inline-flex p-4 bg-green-50 dark:bg-green-950 rounded-2xl mb-4">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Password updated!</h3>
              <p className="text-gray-500 dark:text-slate-400 text-sm">Redirecting you to sign in…</p>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">New password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                      placeholder="Min. 8 characters"
                      className="w-full px-4 py-3 pr-11 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm" />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300">
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Confirm password</label>
                  <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Re-enter password"
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 outline-none text-sm transition-colors dark:bg-slate-800 dark:text-white ${
                      confirm && confirm !== password
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-gray-200 dark:border-slate-700 focus:border-teal-500 focus:ring-teal-500/20'
                    }`} />
                  {confirm && confirm !== password && (
                    <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                  )}
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  Update password
                </button>
              </form>
              <Link to="/login" className="flex items-center justify-center gap-2 mt-5 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300">
                <ArrowLeft size={14} /> Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
