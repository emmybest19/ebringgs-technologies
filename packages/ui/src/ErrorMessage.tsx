import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message = 'Something went wrong.', onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="inline-flex p-4 bg-red-50 dark:bg-red-950 rounded-2xl mb-4">
        <AlertCircle size={32} className="text-red-400" />
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Error</h3>
      <p className="text-sm text-gray-500 dark:text-slate-400 max-w-xs">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950 transition-colors"
        >
          <RefreshCw size={14} /> Try again
        </button>
      )}
    </div>
  );
}
