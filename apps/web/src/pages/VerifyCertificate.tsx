import { useState } from 'react';
import { Award, Search, CheckCircle2, XCircle, Loader2, Shield } from 'lucide-react';
import api from '@ebringgs/api';

interface CertResult {
  certificateId: string;
  studentName: string;
  program: string;
  instructor: string;
  completedAt: string;
  isValid: boolean;
}

export default function VerifyCertificate() {
  const [certId, setCertId] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'found' | 'not-found'>('idle');
  const [result, setResult] = useState<CertResult | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certId.trim()) return;
    setStatus('loading');
    setResult(null);
    try {
      const { data } = await api.get(`/certificates/verify/${certId.trim()}`);
      setResult(data.data);
      setStatus('found');
    } catch {
      setStatus('not-found');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Hero */}
      <section className="bg-linear-to-br from-slate-900 via-teal-950 to-cyan-950 text-white py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-500/20 rounded-2xl mb-6">
            <Shield size={28} className="text-teal-300" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Verify a Certificate</h1>
          <p className="text-slate-300 text-lg max-w-xl mx-auto">
            Enter a certificate ID to verify its authenticity. All E-Bringgs certificates can be validated here.
          </p>
        </div>
      </section>

      {/* Verification form */}
      <div className="max-w-xl mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-lg p-8">
          <form onSubmit={handleVerify} className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Enter certificate ID (e.g. EB-2026-001)"
                value={certId}
                onChange={e => setCertId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <button type="submit" disabled={status === 'loading' || !certId.trim()}
              className="px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-60 transition-colors flex items-center gap-2 shrink-0">
              {status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Verify
            </button>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-xl mx-auto px-4 py-8">
        {status === 'found' && result && (
          <div className={`rounded-2xl border-2 p-8 ${
            result.isValid
              ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              {result.isValid ? (
                <CheckCircle2 size={32} className="text-green-600 dark:text-green-400 shrink-0" />
              ) : (
                <XCircle size={32} className="text-red-600 dark:text-red-400 shrink-0" />
              )}
              <div>
                <h2 className={`text-xl font-bold ${result.isValid ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                  {result.isValid ? 'Certificate Verified' : 'Certificate Revoked'}
                </h2>
                <p className={`text-sm ${result.isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {result.isValid ? 'This certificate is authentic and valid.' : 'This certificate has been revoked.'}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950 rounded-xl flex items-center justify-center shrink-0">
                  <Award size={24} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Certificate ID</p>
                  <p className="font-mono font-bold text-gray-900 dark:text-white">{result.certificateId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-slate-800 pt-4">
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Student Name</p>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{result.studentName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Program</p>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{result.program}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Instructor</p>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{result.instructor}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Completed</p>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {new Date(result.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {status === 'not-found' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 text-center">
            <XCircle size={40} className="text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Certificate not found</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              No certificate matches this ID. Please double-check the ID and try again. If you believe this is an error, contact us.
            </p>
          </div>
        )}

        {status === 'idle' && (
          <div className="text-center text-gray-400 dark:text-slate-500 text-sm py-8">
            <p>Enter a certificate ID above to verify its authenticity.</p>
            <p className="mt-1">Certificate IDs are printed on the bottom of each certificate.</p>
          </div>
        )}
      </div>
    </div>
  );
}
