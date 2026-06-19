import { CreditCard, TrendingUp, DollarSign, CheckCircle2, XCircle } from 'lucide-react';
import { PageLoader, useSEO } from '@ebringgs/ui';
import { useAllTransactions } from '../services/queries';

const statusConfig = {
  succeeded: { label: 'Succeeded', icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
  failed: { label: 'Failed', icon: XCircle, color: 'text-red-600 bg-red-50' },
  pending: { label: 'Pending', icon: CreditCard, color: 'text-amber-600 bg-amber-50' },
  refunded: { label: 'Refunded', icon: TrendingUp, color: 'text-gray-600 bg-gray-100' },
};

function formatNGN(kobo: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency', currency: 'NGN', maximumFractionDigits: 0,
  }).format(kobo / 100);
}

export default function AdminPayments() {
  useSEO({ title: 'Payments', siteName: 'E-Bringgs Admin' });
  const { data: transactions = [], isLoading: loading } = useAllTransactions();

  const totalRevenueKobo = transactions
    .filter((t) => t.status === 'succeeded')
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payments</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Transaction history</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total revenue', value: formatNGN(totalRevenueKobo), icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Transactions', value: transactions.length, icon: CreditCard, color: 'text-teal-600 bg-teal-50' },
          { label: 'Succeeded', value: transactions.filter(t => t.status === 'succeeded').length, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
            <div className={`inline-flex p-2.5 rounded-xl ${color} mb-3`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {loading ? <PageLoader /> : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-180">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950">
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide px-6 py-3">User</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide px-6 py-3">Description</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide px-6 py-3">Amount</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide px-6 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              {transactions.map(tx => {
                const cfg = statusConfig[tx.status];
                const Icon = cfg.icon;
                return (
                  <tr key={tx._id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{typeof tx.user === 'string' ? tx.user : (tx.user as unknown as { name?: string })?.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">{tx.description}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">${(tx.amount / 100).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
                        <Icon size={11} /> {cfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 dark:text-slate-500">
                      {new Date(tx.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
