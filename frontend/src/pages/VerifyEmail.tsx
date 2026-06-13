import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/auth.store';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-token'>('loading');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!token) { setStatus('no-token'); return; }
    const verify = async () => {
      try {
        await api.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
      } catch {
        setStatus('error');
      }
    };
    verify();
  }, [token]);

  const resendVerification = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-verification');
      setResent(true);
    } catch {
      // fail silently
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-teal-50 dark:from-slate-950 dark:to-slate-900 px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-10 max-w-md w-full text-center">
        <div className="inline-flex w-12 h-12 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-xl items-center justify-center mb-6">
          <span className="text-white font-bold">EB</span>
        </div>

        {status === 'loading' && (
          <>
            <Loader2 size={40} className="animate-spin text-teal-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Verifying your email…</h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm">Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="inline-flex p-4 bg-green-50 dark:bg-green-950 rounded-full mb-5"><CheckCircle2 size={40} className="text-green-500" /></div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Email verified!</h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">Your email address has been confirmed. You can now access all features.</p>
            <Link to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors">
              Go to dashboard
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="inline-flex p-4 bg-red-50 dark:bg-red-950 rounded-full mb-5"><XCircle size={40} className="text-red-500" /></div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Verification failed</h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">This link is invalid or has expired. Request a new one below.</p>
            {isAuthenticated && !resent && (
              <button onClick={resendVerification} disabled={resending}
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-60 transition-colors">
                {resending ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                Resend verification email
              </button>
            )}
            {resent && <p className="text-green-600 text-sm font-medium">New verification email sent! Check your inbox.</p>}
            {!isAuthenticated && (
              <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors">
                Sign in to resend
              </Link>
            )}
          </>
        )}

        {status === 'no-token' && (
          <>
            <div className="inline-flex p-4 bg-amber-50 dark:bg-amber-950 rounded-full mb-5"><Mail size={40} className="text-amber-500" /></div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Check your inbox</h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">A verification link was sent to your email address when you registered. Click the link in that email to verify.</p>
            {isAuthenticated && (
              <button onClick={resendVerification} disabled={resending || resent}
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-60 transition-colors">
                {resending ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                {resent ? 'Email sent!' : 'Resend verification email'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
