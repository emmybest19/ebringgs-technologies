import { Link, useSearchParams } from 'react-router-dom';
import { XCircle, RefreshCw, MessageSquare } from 'lucide-react';

export default function PaymentFailed() {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason') || 'Your payment could not be processed.';
  const plan = searchParams.get('plan');
  const billing = searchParams.get('billing');

  const retryUrl = plan ? `/checkout?plan=${plan}&billing=${billing || 'monthly'}` : '/pricing';

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-red-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 p-10 max-w-md w-full text-center">
        <div className="inline-flex p-5 bg-red-50 dark:bg-red-950 rounded-full mb-6">
          <XCircle size={48} className="text-red-500" />
        </div>

        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Payment failed</h1>
        <p className="text-gray-500 dark:text-slate-400 mb-6">{reason}</p>

        <div className="bg-amber-50 dark:bg-amber-950 rounded-xl p-4 mb-8 text-left border border-amber-100 dark:border-amber-900">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">Common reasons for failure</p>
          <ul className="space-y-1.5 text-sm text-amber-700 dark:text-amber-300">
            <li>• Insufficient funds on the card</li>
            <li>• Card details entered incorrectly</li>
            <li>• Card blocked for online transactions</li>
            <li>• Bank declined the transaction</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Link to={retryUrl}
            className="flex items-center justify-center gap-2 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors">
            <RefreshCw size={16} /> Try again
          </Link>
          <Link to="/contact"
            className="flex items-center justify-center gap-2 py-3 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm">
            <MessageSquare size={14} /> Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}
