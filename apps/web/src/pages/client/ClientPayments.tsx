import { CreditCard, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { useMyTransactions, useMyPaymentPlans } from '../../services/queries';
import NextPaymentBanner, { pickMostUrgentPlan } from '../../components/payments/NextPaymentBanner';
import PaymentScheduleCard from '../../components/payments/PaymentScheduleCard';

export default function ClientPayments() {
  const { data: transactions = [], isLoading: loading } = useMyTransactions();
  const { data: plans = [] } = useMyPaymentPlans();

  // Most-urgent plan goes at the top as a banner. Below that we list the
  // schedules for every currently-active plan so the user can see what's
  // coming up at a glance.
  const urgent = pickMostUrgentPlan(plans);
  const activePlans = plans.filter((p) => p.status === 'active' || p.status === 'overdue' || p.status === 'suspended');

  const statusIcon = (s: string) => {
    if (s === 'succeeded') return <CheckCircle2 size={16} className="text-green-500" />;
    if (s === 'pending') return <Clock size={16} className="text-amber-500" />;
    return <XCircle size={16} className="text-red-500" />;
  };

  const statusLabel = (s: string) => {
    if (s === 'succeeded') return 'Paid';
    if (s === 'pending') return 'Pending';
    return 'Failed';
  };

  const statusClass = (s: string) => {
    if (s === 'succeeded') return 'text-green-700 dark:text-green-400';
    if (s === 'pending') return 'text-amber-700 dark:text-amber-400';
    return 'text-red-700 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <div>
      {urgent && <NextPaymentBanner plan={urgent} />}

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Payment History</h1>
      <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
        {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        {activePlans.length > 0 && ` · ${activePlans.length} active installment plan${activePlans.length === 1 ? '' : 's'}`}
      </p>

      {/* Active installment plans, each as its own schedule card so the user
          can see exactly what's coming up + when. Skips paid-in-full plans. */}
      {activePlans.length > 0 && (
        <div className="space-y-4 mb-8">
          {activePlans.map((p) => (
            <PaymentScheduleCard key={p._id} plan={p} />
          ))}
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="bg-white dark:bg-[#0e141c] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-12 text-center">
          <CreditCard size={40} className="text-gray-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-slate-400">No payments yet.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0e141c] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-[#080c11] text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">Description</th>
                <th className="px-5 py-3 text-left">Reference</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-left hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              {transactions.map(tx => (
                <tr key={tx._id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-5 py-4 text-gray-900 dark:text-white font-medium">{tx.description}</td>
                  <td className="px-5 py-4 text-gray-400 dark:text-slate-500 text-xs font-mono">
                    {tx.stripePaymentIntentId?.slice(0, 16)}…
                  </td>
                  <td className="px-5 py-4 text-right text-gray-900 dark:text-white font-semibold">
                    {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(tx.amount / 100)}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${statusClass(tx.status)}`}>
                      {statusIcon(tx.status)} {statusLabel(tx.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-400 dark:text-slate-500 hidden sm:table-cell">
                    {new Date(tx.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
