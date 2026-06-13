import { CheckCircle2, Clock, AlertCircle, CreditCard } from 'lucide-react';
import type { Installment, PaymentPlan } from '../../services/queries';

/**
 * Vertical timeline of the installments on a PaymentPlan. Shows status badges
 * (Paid · Due in X days · Failed), amounts, and dates. Used on:
 *   - PaymentSuccess (after a successful first payment)
 *   - ClientPayments (upcoming installments preview)
 *   - ClientProjects → ProjectDetail (when the project has a payment plan)
 *   - student/Overview (training plan in progress)
 *
 * Self-contained — fetch the plan upstream, pass it in.
 */

interface Props {
  plan: PaymentPlan;
  /** Compact mode strips date subtitles + reduces vertical padding. */
  compact?: boolean;
}

function formatNGN(kobo: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })
    .format(kobo / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

function statusMeta(install: Installment): { label: string; tone: 'paid' | 'due' | 'overdue' | 'manual'; icon: typeof CheckCircle2 } {
  if (install.status === 'paid') return { label: 'Paid', tone: 'paid', icon: CheckCircle2 };
  if (install.status === 'manual') return { label: 'Marked paid', tone: 'manual', icon: CheckCircle2 };
  if (install.status === 'failed') return { label: 'Failed', tone: 'overdue', icon: AlertCircle };

  // Pending — colour by how urgent
  const days = daysUntil(install.dueDate);
  if (days < 0) return { label: `Overdue ${Math.abs(days)}d`, tone: 'overdue', icon: AlertCircle };
  if (days === 0) return { label: 'Due today', tone: 'due', icon: Clock };
  if (days <= 7) return { label: `Due in ${days}d`, tone: 'due', icon: Clock };
  return { label: formatDate(install.dueDate), tone: 'due', icon: Clock };
}

const toneStyles: Record<'paid' | 'due' | 'overdue' | 'manual', { bg: string; text: string; iconBg: string }> = {
  paid:    { bg: 'bg-green-100 dark:bg-green-950',     text: 'text-green-700 dark:text-green-400',   iconBg: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300' },
  manual:  { bg: 'bg-purple-100 dark:bg-purple-950',   text: 'text-purple-700 dark:text-purple-400', iconBg: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300' },
  due:     { bg: 'bg-amber-100 dark:bg-amber-950',     text: 'text-amber-700 dark:text-amber-400',   iconBg: 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300' },
  overdue: { bg: 'bg-red-100 dark:bg-red-950',         text: 'text-red-700 dark:text-red-400',       iconBg: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300' },
};

export default function PaymentScheduleCard({ plan, compact = false }: Props) {
  const pct = plan.totalAmount > 0
    ? Math.min(100, Math.round((plan.amountPaid / plan.totalAmount) * 100))
    : 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
            Payment schedule
          </p>
          <p className="text-sm text-gray-700 dark:text-slate-300 mt-0.5">
            {plan.paidCount} of {plan.installments.length} paid · {formatNGN(plan.amountPaid)} of {formatNGN(plan.totalAmount)}
          </p>
        </div>
        {plan.cardBrand && plan.cardLast4 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
            <CreditCard size={13} />
            {plan.cardBrand} ···· {plan.cardLast4}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden mb-5">
        <div
          className={`h-full rounded-full transition-all ${
            plan.status === 'completed' ? 'bg-green-500'
            : plan.status === 'suspended' ? 'bg-red-500'
            : plan.status === 'overdue' ? 'bg-amber-500'
            : 'bg-teal-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Vertical timeline of installments */}
      <ol className="relative border-l-2 border-gray-100 dark:border-slate-800 ml-2 space-y-4">
        {plan.installments.map((install, idx) => {
          const meta = statusMeta(install);
          const Icon = meta.icon;
          const styles = toneStyles[meta.tone];

          return (
            <li key={idx} className={`ml-5 ${compact ? '' : 'pb-1'}`}>
              <span className={`absolute -left-[10px] flex items-center justify-center w-5 h-5 rounded-full ring-4 ring-white dark:ring-slate-900 ${styles.iconBg}`}>
                <Icon size={11} />
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Installment {idx + 1}
                </span>
                <span className="text-sm text-gray-700 dark:text-slate-300 font-mono">
                  {formatNGN(install.amount)}
                </span>
                <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${styles.bg} ${styles.text}`}>
                  {meta.label}
                </span>
              </div>
              {!compact && (
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                  {install.status === 'paid' && install.paidAt
                    ? `Paid on ${formatDate(install.paidAt)}`
                    : install.status === 'manual'
                      ? `Marked paid${install.lastChargeMessage ? ` — ${install.lastChargeMessage}` : ''}`
                      : `Due ${formatDate(install.dueDate)}`}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
