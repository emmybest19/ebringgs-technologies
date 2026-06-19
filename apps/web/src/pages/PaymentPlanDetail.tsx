import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, Lock } from 'lucide-react';
import {
  useMyPaymentPlan, useInitializePayment,
  type PaymentPlan,
} from '../services/queries';
import PaymentScheduleCard from '../components/payments/PaymentScheduleCard';
import NextPaymentBanner from '../components/payments/NextPaymentBanner';
import { useAuthStore } from '../store/auth.store';

/**
 * The destination page for "View plan" CTAs and the 403 PAYMENT_REQUIRED
 * redirect. Shows the user:
 *
 *   - A status banner (NextPaymentBanner, auto-coloured by plan state)
 *   - The full payment schedule (PaymentScheduleCard)
 *   - A "Pay now" button that fires a fresh Paystack checkout for the next
 *     unpaid installment, used to manually retry after an auto-charge failed
 *     or to restore access after suspension
 *
 * Route mounted at `/payments/plan/:id`, accessible to any logged-in user
 * (their own plans only; the API enforces ownership).
 */

export default function PaymentPlanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { data: plan, isLoading, isError } = useMyPaymentPlan(id);

  if (!isAuthenticated) {
    // Defensive, should never hit because all routes that link here are gated
    navigate('/login');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-teal-600" />
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-10 max-w-md text-center">
          <AlertCircle size={32} className="text-red-500 mx-auto mb-3" />
          <p className="text-gray-700 dark:text-slate-300 mb-6">
            We could not load this payment plan. It may have been removed.
          </p>
          <Link
            to={user?.role === 'client' ? '/client/payments' : '/dashboard'}
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const dashboardPath = user?.role === 'client' ? '/client/payments' : '/dashboard';
  const dashboardLabel = user?.role === 'client' ? 'Back to payments' : 'Back to dashboard';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          to={dashboardPath}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={15} /> {dashboardLabel}
        </Link>

        <NextPaymentBanner plan={plan} />

        <PaymentScheduleCard plan={plan} />

        {/* Pay-now action, only when there's something to pay AND the plan is
            past auto-charge (i.e. user needs to act). For an active plan with
            an upcoming installment, the cron will handle it automatically. */}
        {(plan.status === 'overdue' || plan.status === 'suspended') && plan.nextInstallment && (
          <ManualPaySection plan={plan} />
        )}
      </div>
    </div>
  );
}

/* ─── Manual-pay block ───────────────────────────────────────────────── */

function ManualPaySection({ plan }: { plan: PaymentPlan }) {
  const initialize = useInitializePayment();
  const [error, setError] = useState('');
  const next = plan.nextInstallment!;
  const amountKobo = next.amount;

  const handlePay = () => {
    setError('');
    // Reuse the existing initialize flow, sends a fresh Paystack checkout
    // for just the outstanding installment amount. On success, verify +
    // webhook will mark this installment paid + flip status back to 'active'.
    initialize.mutate(
      {
        callbackUrl: `${window.location.origin}/payment/success`,
        amount: amountKobo,
        description: `${plan.description} (manual pay)`,
      },
      {
        onSuccess: (data) => { window.location.href = data.authorizationUrl; },
        onError: () => setError('Could not initialise payment. Please try again.'),
      },
    );
  };

  const formatNGN = (kobo: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })
      .format(kobo / 100);

  const processing = initialize.isPending || initialize.isSuccess;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 mt-4">
      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Pay manually</p>
      <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
        Your auto-charge didn't go through. Tap below to settle the outstanding installment with a fresh card or account.
      </p>
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400 mb-4">
          {error}
        </div>
      )}
      <button
        onClick={handlePay}
        disabled={processing}
        className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
      >
        {processing ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
        {processing ? 'Redirecting…' : `Pay ${formatNGN(amountKobo)} with Paystack`}
      </button>
    </div>
  );
}

