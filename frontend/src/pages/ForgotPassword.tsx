import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import Logo from '../components/Logo';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Reset link sent! Check your inbox.');
    } catch {
      toast.error('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-teal-50 dark:from-slate-950 dark:to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-8">
          <div className="text-center mb-8">
            <div className="inline-block mb-4">
              <Logo variant="mark" size={48} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reset your password</h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">We'll send a reset link to your email</p>
          </div>

          {sent ? (
            <div className="text-center py-6">
              <div className="inline-flex p-4 bg-green-50 dark:bg-green-950 rounded-2xl mb-4">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Check your inbox</h3>
              <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
                If an account exists for <span className="font-medium text-gray-700 dark:text-slate-300">{email}</span>, a reset link has been sent.
              </p>
              <Link to="/login" className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-800 font-medium">
                <ArrowLeft size={14} /> Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                    <Mail size={14} /> Email address
                  </label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  Send reset link
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
