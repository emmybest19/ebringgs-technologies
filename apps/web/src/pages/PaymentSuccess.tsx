import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight, BookOpen, Loader2, XCircle, ClipboardList } from 'lucide-react';
import { useAuthStore } from '@ebringgs/auth';
import { useVerifyPayment, useMyPaymentPlan } from '../services/queries';
import PaymentScheduleCard from '../components/payments/PaymentScheduleCard';
import { useSEO } from '@ebringgs/ui';

export default function PaymentSuccess() {
  useSEO({ title: 'Payment successful', noIndex: true });
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference') || searchParams.get('trxref');
  const { user, fetchMe } = useAuthStore();

  // staleTime: Infinity inside the hook, a given reference is verified once
  // per cache lifetime even if the user re-mounts this page.
  const { data, isLoading: verifying, isError } = useVerifyPayment(reference);

  // Refresh the auth user so the spent referral credit (and any other
  // server-side balance changes) reflect immediately in the dashboard.
  useEffect(() => {
    if (data?.paymentStatus === 'succeeded') {
      fetchMe().catch(() => {});
    }
  }, [data?.paymentStatus, fetchMe]);

  const verified = !!reference && data?.paymentStatus === 'succeeded';
  const failed = !!reference && (isError || (!!data && data.paymentStatus !== 'succeeded'));
  const projectId = data?.projectId;
  const purchaseType = data?.purchaseType;
  const paymentPlanId = data?.paymentPlanId;

  // When the transaction was installment 1, load the plan so we can show the
  // user the full schedule + next-due dates right on the success page.
  const { data: plan } = useMyPaymentPlan(paymentPlanId);

  if (verifying) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-teal-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 p-10 max-w-md w-full text-center">
          <Loader2 size={48} className="animate-spin text-teal-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Verifying payment...</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm">Please wait while we confirm your transaction.</p>
        </div>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-teal-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 p-10 max-w-md w-full text-center">
          <div className="inline-flex p-5 bg-red-50 dark:bg-red-950 rounded-full mb-6">
            <XCircle size={48} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Payment failed</h1>
          <p className="text-gray-500 dark:text-slate-400 mb-6">Your payment could not be verified. Please try again or contact support.</p>
          <Link to="/pricing"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors">
            Try again
          </Link>
        </div>
      </div>
    );
  }

  // Service purchase: send the client straight to the brief intake form.
  if (verified && purchaseType === 'service' && projectId) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-teal-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 p-10 max-w-md w-full text-center">
          <div className="inline-flex p-5 bg-green-50 dark:bg-green-950 rounded-full mb-6">
            <CheckCircle2 size={48} className="text-green-500" />
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Payment confirmed</h1>
          <p className="text-gray-500 dark:text-slate-400 mb-6">
            One quick step before we kick off, tell us about your project so we can hit the ground running.
          </p>

          <div className="bg-teal-50 dark:bg-teal-950 rounded-xl p-4 mb-8 text-left border border-teal-100 dark:border-teal-900">
            <p className="text-sm font-semibold text-teal-800 dark:text-teal-200 mb-1">Next steps</p>
            <ol className="space-y-2 text-sm text-teal-700 dark:text-teal-300 list-decimal list-inside">
              <li>Fill out a short brief (5 minutes)</li>
              <li>We review and confirm within 1 business day</li>
              <li>Track progress in your client dashboard</li>
            </ol>
          </div>

          <Link to={`/client/projects/${projectId}/brief`}
            className="flex items-center justify-center gap-2 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors">
            <ClipboardList size={16} /> Tell us about your project
          </Link>
          <Link to="/client/projects"
            className="block mt-3 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200">
            I'll do this later
          </Link>

          {reference && (
            <p className="mt-6 text-xs text-gray-400 dark:text-slate-500 font-mono bg-gray-50 dark:bg-slate-800 rounded-lg px-3 py-1.5 inline-block">
              Ref: {reference.slice(-12).toUpperCase()}
            </p>
          )}
        </div>
        {plan && (
          <div className="w-full max-w-md mt-4">
            <PaymentScheduleCard plan={plan} />
          </div>
        )}
      </div>
    );
  }

  const dashboardLink = user?.role === 'client' ? '/client' : '/dashboard';

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-teal-50 dark:from-slate-950 dark:to-slate-900 flex flex-col items-center justify-center px-4 py-12 gap-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 p-10 max-w-md w-full text-center">
        <div className="inline-flex p-5 bg-green-50 dark:bg-green-950 rounded-full mb-6">
          <CheckCircle2 size={48} className="text-green-500" />
        </div>

        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Payment successful!</h1>
        <p className="text-gray-500 dark:text-slate-400 mb-2">Your account has been upgraded. Welcome aboard.</p>
        {reference && (
          <p className="text-xs text-gray-400 dark:text-slate-500 font-mono bg-gray-50 dark:bg-slate-800 rounded-lg px-3 py-1.5 mb-6 inline-block">
            Ref: {reference.slice(-12).toUpperCase()}
          </p>
        )}

        <div className="bg-teal-50 dark:bg-teal-950 rounded-xl p-4 mb-8 text-left border border-teal-100 dark:border-teal-900">
          <p className="text-sm font-semibold text-teal-800 dark:text-teal-200 mb-1">What happens next?</p>
          <ul className="space-y-2 text-sm text-teal-700 dark:text-teal-300">
            <li className="flex items-start gap-2"><CheckCircle2 size={14} className="shrink-0 mt-0.5" /> A confirmation email has been sent to you</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={14} className="shrink-0 mt-0.5" /> Your dashboard is now unlocked</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={14} className="shrink-0 mt-0.5" /> Our team will contact you with onboarding details</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Link to={dashboardLink}
            className="flex items-center justify-center gap-2 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors">
            <BookOpen size={16} /> Go to dashboard
          </Link>
          <Link to="/pricing"
            className="flex items-center justify-center gap-2 py-3 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm">
            View programs <ArrowRight size={14} />
          </Link>
        </div>
      </div>
      {plan && (
        <div className="w-full max-w-md">
          <PaymentScheduleCard plan={plan} />
        </div>
      )}
    </div>
  );
}
