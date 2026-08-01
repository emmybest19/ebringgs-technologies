import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, CreditCard, Clock, CheckCircle2, Loader2, Calendar, ArrowRight, Gift, Copy, Check, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@ebringgs/auth';
import { useMyProjects, useMyTransactions, useMyPaymentPlans } from '../../services/queries';
import NextPaymentBanner, { pickMostUrgentPlan } from '../../components/payments/NextPaymentBanner';

const calendlyConfigured = Boolean(import.meta.env.VITE_CALENDLY_URL);

export default function ClientOverview() {
  const { user } = useAuthStore();
  const { data: projects = [], isLoading: projectsLoading } = useMyProjects();
  const { data: transactions = [], isLoading: transactionsLoading } = useMyTransactions();
  const loading = projectsLoading || transactionsLoading;

  const activeProjects = projects.filter(p => !['completed', 'cancelled'].includes(p.status));
  const completedProjects = projects.filter(p => p.status === 'completed');

  const statusColor = (s: string) => {
    switch (s) {
      case 'completed': return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400';
      case 'in_progress': return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-400';
      case 'review': return 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-400';
      case 'cancelled': return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-400';
      default: return 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Surface the most-urgent installment plan (if any). Auto-hides for
          paid-in-full / future-due plans, see pickMostUrgentPlan rules. */}
      <UrgentPlanBanner />

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        Welcome back, {user?.name?.split(' ')[0]}
      </h1>
      <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
        Here's an overview of your projects and payments.
      </p>

      <ReferralCard />

      {calendlyConfigured && (
        <Link
          to="/client/schedule-call"
          className="group relative block overflow-hidden rounded-2xl bg-linear-to-br from-slate-900 via-teal-950 to-cyan-950 text-white p-6 mb-6 shadow-lg hover:shadow-2xl hover:shadow-teal-500/20 transition-all"
        >
          <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl group-hover:bg-teal-400/30 transition-colors" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl" />
          <div className="relative flex items-center gap-5">
            <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm items-center justify-center shrink-0">
              <Calendar size={24} className="text-teal-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-teal-300 font-bold mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Book a Call
              </div>
              <p className="font-bold text-base sm:text-lg leading-tight">
                Talk to us — pick a time that works for you
              </p>
              <p className="text-slate-300 text-xs sm:text-sm mt-1">
                20-minute call · video or audio · zero commitment
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white text-teal-700 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform">
              <ArrowRight size={18} />
            </div>
          </div>
        </Link>
      )}

      {/* Stats */}
      <div className="reveal grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-teal-50 dark:bg-teal-950 rounded-xl flex items-center justify-center">
            <FolderKanban size={20} className="text-teal-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeProjects.length}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">Active projects</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-green-50 dark:bg-green-950 rounded-xl flex items-center justify-center">
            <CheckCircle2 size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedProjects.length}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">Completed</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-purple-50 dark:bg-purple-950 rounded-xl flex items-center justify-center">
            <CreditCard size={20} className="text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{transactions.length}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">Transactions</p>
          </div>
        </div>
      </div>

      {/* Recent projects */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Active Projects</h2>
          <Link to="/client/projects" className="text-sm text-teal-600 hover:text-teal-800 font-medium">
            View all
          </Link>
        </div>
        {activeProjects.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-10 text-center">
            <FolderKanban size={36} className="text-gray-200 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-slate-400 text-sm">No active projects yet.</p>
            <Link to="/client/services" className="inline-block mt-3 text-sm text-teal-600 hover:underline font-medium">
              Browse our services
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeProjects.slice(0, 5).map(p => (
              <Link key={p._id} to={`/client/projects/${p._id}`}
                className="block bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-4 hover:border-teal-300 dark:hover:border-teal-700 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{p.title}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${statusColor(p.status)}`}>
                    {p.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-2">{p.serviceName}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                  </div>
                  <span className="text-xs font-medium text-gray-500 dark:text-slate-400">{p.progress}%</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Payments</h2>
          <Link to="/client/payments" className="text-sm text-teal-600 hover:text-teal-800 font-medium">
            View all
          </Link>
        </div>
        {transactions.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-10 text-center">
            <CreditCard size={36} className="text-gray-200 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-slate-400 text-sm">No payments yet.</p>
          </div>
        ) : (
          <div className="reveal bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-950 text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left">Description</th>
                  <th className="px-5 py-3 text-left">Amount</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {transactions.slice(0, 5).map(tx => (
                  <tr key={tx._id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                    <td className="px-5 py-3 text-gray-900 dark:text-white">{tx.description}</td>
                    <td className="px-5 py-3 text-gray-700 dark:text-slate-300 font-medium">
                      {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(tx.amount / 100)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold capitalize">
                        {tx.status === 'succeeded' ? (
                          <><CheckCircle2 size={12} className="text-green-500" /> <span className="text-green-700 dark:text-green-400">Paid</span></>
                        ) : tx.status === 'pending' ? (
                          <><Clock size={12} className="text-amber-500" /> <span className="text-amber-700 dark:text-amber-400">Pending</span></>
                        ) : (
                          <span className="text-red-600 dark:text-red-400">{tx.status}</span>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 dark:text-slate-500 hidden sm:table-cell">
                      {new Date(tx.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Lazily loads the user's payment plans and renders the most-urgent one as
 * a banner. Lives in its own component so the main Overview render isn't
 * blocked by a separate query; the banner appears once the plans load.
 */
function UrgentPlanBanner() {
  const { data: plans } = useMyPaymentPlans();
  const urgent = pickMostUrgentPlan(plans);
  if (!urgent) return null;
  return <NextPaymentBanner plan={urgent} />;
}

/**
 * Referral card — shows the client their shareable code, available naira
 * credit, and a one-click copy of the signup link with their code prefilled.
 * Renders nothing if the user hasn't loaded yet or has no referral code.
 */
function ReferralCard() {
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);

  if (!user?.referralCode) return null;

  const credit = user.referralCreditNaira ?? 0;
  const shareUrl = `${window.location.origin}/register?ref=${user.referralCode}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Referral link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy. Long-press the code to copy manually.');
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-linear-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/40 p-5 mb-6">
      <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 bg-emerald-400/10 rounded-full blur-3xl" />
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
          <Gift size={22} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-2 mb-1">
            <p className="text-sm font-bold text-gray-900 dark:text-white">Refer a client, earn ₦20,000 credit</p>
            {credit > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                <Wallet size={12} /> ₦{credit.toLocaleString()} available
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Share your code. When their first project payment clears, your credit applies automatically at your next checkout.
          </p>
        </div>

        <div className="flex items-stretch gap-2 shrink-0">
          <div className="px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-700 font-mono text-sm font-bold text-gray-900 dark:text-white tracking-wider flex items-center">
            {user.referralCode}
          </div>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
          >
            {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Share link</>}
          </button>
        </div>
      </div>
    </div>
  );
}
