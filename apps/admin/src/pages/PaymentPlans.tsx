import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Loader2, CreditCard, Clock, AlertCircle, CheckCircle2, ShieldAlert,
  CalendarPlus, BadgeCheck, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useAdminPaymentPlans, useExtendPaymentPlan, useMarkInstallmentPaid,
  type PaymentPlan, type PaymentPlanAdminFilter, type PaymentPlanStatus,
} from '../services/queries';

/**
 * Admin view of every installment plan in the system. Admins can:
 *
 *   - Filter by status (active / overdue / suspended / completed / cancelled).
 *   - Extend the next-due date on any plan by 1-30 days (e.g. client requested
 *     a deadline grace, was travelling, etc.).
 *   - Manually mark the next installment as paid (e.g. client wired the money
 *     offline). The installment status flips to 'manual'.
 *
 * No "delete plan" action, a cancelled plan should be the terminal state, but
 * we keep the data for audit. To cancel, an admin would use a direct DB op for
 * v1 (intentionally friction).
 */

function formatNGN(kobo: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })
    .format(kobo / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_OPTIONS: { value: PaymentPlanAdminFilter; label: string }[] = [
  { value: '',          label: 'All' },
  { value: 'active',    label: 'Active' },
  { value: 'overdue',   label: 'Overdue' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_STYLES: Record<PaymentPlanStatus, { bg: string; text: string; icon: typeof Clock }> = {
  active:    { bg: 'bg-teal-100 dark:bg-teal-900',       text: 'text-teal-700 dark:text-teal-300',     icon: Clock },
  overdue:   { bg: 'bg-amber-100 dark:bg-amber-900',     text: 'text-amber-700 dark:text-amber-300',   icon: AlertCircle },
  suspended: { bg: 'bg-red-100 dark:bg-red-900',         text: 'text-red-700 dark:text-red-300',       icon: ShieldAlert },
  completed: { bg: 'bg-green-100 dark:bg-green-900',     text: 'text-green-700 dark:text-green-300',   icon: CheckCircle2 },
  cancelled: { bg: 'bg-gray-100 dark:bg-slate-800',      text: 'text-gray-500 dark:text-slate-400',    icon: X },
};

export default function AdminPaymentPlans() {
  const [filter, setFilter] = useState<PaymentPlanAdminFilter>('');
  const { data: plans = [], isLoading } = useAdminPaymentPlans(filter);
  const [actionPlan, setActionPlan] = useState<{ plan: PaymentPlan; mode: 'extend' | 'mark-paid' } | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment plans</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            {plans.length} plan{plans.length === 1 ? '' : 's'}{filter && ` · ${filter}`} ·
            Manual overrides for installments that need admin attention.
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value || 'all'}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filter === opt.value
                  ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 size={28} className="animate-spin text-teal-600" />
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-12 text-center">
          <CreditCard size={36} className="text-gray-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-slate-400">No payment plans{filter && ` in '${filter}' status`}.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-950 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3">Plan / user</th>
                  <th className="px-5 py-3">Progress</th>
                  <th className="px-5 py-3">Next due</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => {
                  const u = typeof plan.user === 'string' ? null : plan.user as unknown as { name?: string; email?: string };
                  const next = plan.nextInstallment;
                  const status = plan.status;
                  const StatusIcon = STATUS_STYLES[status].icon;
                  const pct = plan.totalAmount > 0
                    ? Math.min(100, Math.round((plan.amountPaid / plan.totalAmount) * 100))
                    : 0;

                  return (
                    <tr key={plan._id} className="border-t border-gray-100 dark:border-slate-800">
                      <td className="px-5 py-3 max-w-xs">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{plan.description}</p>
                        {u && (
                          <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                            {u.name} · {u.email}
                          </p>
                        )}
                        <p className="text-[11px] text-gray-400 dark:text-slate-500 font-mono mt-0.5">
                          {plan.installments.length}× · {formatNGN(plan.totalAmount)}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <div className="min-w-[140px]">
                          <p className="text-xs text-gray-700 dark:text-slate-300 mb-1">
                            {plan.paidCount} / {plan.installments.length} paid
                          </p>
                          <div className="h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                status === 'completed' ? 'bg-green-500'
                                : status === 'suspended' ? 'bg-red-500'
                                : status === 'overdue' ? 'bg-amber-500'
                                : 'bg-teal-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700 dark:text-slate-300 whitespace-nowrap">
                        {next ? (
                          <>
                            {formatNGN(next.amount)}
                            <span className="block text-xs text-gray-400 dark:text-slate-500">
                              Due {formatDate(next.dueDate)}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[status].bg} ${STATUS_STYLES[status].text}`}>
                          <StatusIcon size={11} /> {status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          {next && (
                            <>
                              <button
                                onClick={() => setActionPlan({ plan, mode: 'extend' })}
                                className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950 text-gray-500 hover:text-amber-600"
                                title="Extend due date"
                              >
                                <CalendarPlus size={15} />
                              </button>
                              <button
                                onClick={() => setActionPlan({ plan, mode: 'mark-paid' })}
                                className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-950 text-gray-500 hover:text-green-600"
                                title="Mark installment as paid"
                              >
                                <BadgeCheck size={15} />
                              </button>
                            </>
                          )}
                          <Link
                            to={`/payments/plan/${plan._id}`}
                            className="text-xs text-teal-600 hover:text-teal-800 font-medium ml-2"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {actionPlan && (
        <ActionModal
          plan={actionPlan.plan}
          mode={actionPlan.mode}
          onClose={() => setActionPlan(null)}
        />
      )}
    </div>
  );
}

/* ─── Admin action modal (extend OR mark-paid) ───────────────────────── */

function ActionModal({
  plan, mode, onClose,
}: {
  plan: PaymentPlan;
  mode: 'extend' | 'mark-paid';
  onClose: () => void;
}) {
  const extend = useExtendPaymentPlan();
  const markPaid = useMarkInstallmentPaid();
  const [extraDays, setExtraDays] = useState(7);
  const [note, setNote] = useState('');

  const next = plan.nextInstallment!;
  const pending = extend.isPending || markPaid.isPending;

  const handleConfirm = () => {
    if (mode === 'extend') {
      extend.mutate(
        { id: plan._id, extraDays },
        {
          onSuccess: () => { toast.success(`Extended next due date by ${extraDays} day${extraDays === 1 ? '' : 's'}.`); onClose(); },
          onError: () => toast.error('Could not extend due date.'),
        },
      );
    } else {
      markPaid.mutate(
        { id: plan._id, note: note.trim() || undefined },
        {
          onSuccess: () => { toast.success('Installment marked as paid.'); onClose(); },
          onError: () => toast.error('Could not mark installment paid.'),
        },
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
          {mode === 'extend' ? 'Extend due date' : 'Mark installment as paid'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">
          {plan.description}, next installment <strong>{formatNGN(next.amount)}</strong> due{' '}
          {formatDate(next.dueDate)}.
        </p>

        {mode === 'extend' ? (
          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Extra days (1-30)
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={extraDays}
              onChange={(e) => setExtraDays(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-sm"
            />
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
              New due date: {formatDate(new Date(new Date(next.dueDate).getTime() + extraDays * 24 * 60 * 60 * 1000).toISOString())}
            </p>
          </div>
        ) : (
          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 200))}
              rows={3}
              placeholder="e.g. Client paid via bank transfer · ref 12345"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white text-sm resize-none"
            />
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5">
              ⚠️ This bypasses Paystack, only use when you've confirmed payment outside the system.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={pending}
            className={`inline-flex items-center gap-2 px-5 py-2 text-white text-sm font-semibold rounded-lg disabled:opacity-60 transition-colors ${
              mode === 'extend' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {pending && <Loader2 size={14} className="animate-spin" />}
            {mode === 'extend' ? `Extend by ${extraDays} day${extraDays === 1 ? '' : 's'}` : 'Mark paid'}
          </button>
        </div>
      </div>
    </div>
  );
}
