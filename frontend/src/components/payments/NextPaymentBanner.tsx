import { Link } from 'react-router-dom';
import { ArrowRight, AlertCircle, ShieldAlert, Clock } from 'lucide-react';
import type { PaymentPlan } from '../../services/queries';

/**
 * Reusable status banner for ANY page where it's useful to remind the user
 * of an outstanding installment. Three tones:
 *
 *   - `info`    (teal)  — Active plan, next installment > 7 days away.
 *   - `warning` (amber) — Next due in ≤ 7 days, or plan is overdue (charge failed).
 *   - `critical`(red)   — Plan is suspended (grace expired). Paid feature blocked
 *                         until they settle.
 *
 * Auto-derives the tone from `plan.status` + days-until-next-due. Renders
 * nothing for `completed` and `cancelled` plans — caller doesn't need to
 * pre-filter.
 *
 * Drops anywhere — Overview pages, ProjectDetail header, etc. Self-contained.
 */

interface Props {
  plan: PaymentPlan;
  /** Override the default "View plan" CTA destination. */
  ctaTo?: string;
}

function formatNGN(kobo: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })
    .format(kobo / 100);
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

export default function NextPaymentBanner({ plan, ctaTo }: Props) {
  // Don't render for plans the user has nothing to act on.
  if (plan.status === 'completed' || plan.status === 'cancelled') return null;

  const next = plan.nextInstallment;
  if (!next) return null;

  const days = daysUntil(next.dueDate);
  const amount = formatNGN(next.amount);
  const isSuspended = plan.status === 'suspended';
  const isOverdue = plan.status === 'overdue';
  const isUrgent = !isSuspended && !isOverdue && days <= 7 && days >= 0;

  const target = ctaTo || `/payments/plan/${plan._id}`;

  // ── Suspended (critical / red) ──────────────────────────────────────
  if (isSuspended) {
    return (
      <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl p-5 mb-4 flex items-center gap-4">
        <div className="inline-flex p-3 bg-red-100 dark:bg-red-900 rounded-xl shrink-0">
          <ShieldAlert size={22} className="text-red-700 dark:text-red-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 dark:text-white">Access paused</p>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            {plan.description} — settle {amount} to restore access.
          </p>
        </div>
        <Link
          to={target}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors shrink-0"
        >
          Pay {amount} <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  // ── Overdue (warning / amber) ───────────────────────────────────────
  if (isOverdue) {
    const graceLeft = plan.gracePeriodEndsAt ? Math.max(0, daysUntil(plan.gracePeriodEndsAt)) : 0;
    return (
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 mb-4 flex items-center gap-4">
        <div className="inline-flex p-3 bg-amber-100 dark:bg-amber-900 rounded-xl shrink-0">
          <AlertCircle size={22} className="text-amber-700 dark:text-amber-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 dark:text-white">Payment failed</p>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            {plan.description} — {amount} pending.
            {graceLeft > 0 && ` Access will pause in ${graceLeft} day${graceLeft === 1 ? '' : 's'} if not resolved.`}
          </p>
        </div>
        <Link
          to={target}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 transition-colors shrink-0"
        >
          Pay now <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  // ── Active + urgent (warning / amber, but softer copy) ──────────────
  if (isUrgent) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 mb-4 flex items-center gap-4">
        <div className="inline-flex p-3 bg-amber-100 dark:bg-amber-900 rounded-xl shrink-0">
          <Clock size={22} className="text-amber-700 dark:text-amber-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 dark:text-white">
            Next payment {days === 0 ? 'due today' : `due in ${days} day${days === 1 ? '' : 's'}`}
          </p>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            {amount} for {plan.description}. We'll auto-charge your saved card.
          </p>
        </div>
        <Link
          to={target}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-sm font-semibold rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors shrink-0"
        >
          View plan <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  // Not urgent (next installment > 7 days away) — render nothing. The user
  // doesn't need a banner; the PaymentScheduleCard on /payments/plan/:id is
  // enough.
  return null;
}

/**
 * Convenience helper: given a list of plans, pick the most-urgent active one
 * to show in a banner. Returns null if no plan needs surfacing.
 *
 * Priority order: suspended > overdue > urgent (≤7d) > nothing.
 */
export function pickMostUrgentPlan(plans: PaymentPlan[] | undefined): PaymentPlan | null {
  if (!plans?.length) return null;
  const suspended = plans.find((p) => p.status === 'suspended');
  if (suspended) return suspended;
  const overdue = plans.find((p) => p.status === 'overdue');
  if (overdue) return overdue;
  const urgent = plans
    .filter((p) => p.status === 'active' && p.nextInstallment)
    .map((p) => ({ p, days: daysUntil(p.nextInstallment!.dueDate) }))
    .filter((x) => x.days <= 7 && x.days >= 0)
    .sort((a, b) => a.days - b.days)[0];
  return urgent?.p ?? null;
}
