import type { ElementType } from 'react';

interface EmptyStateProps {
  icon: ElementType;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="inline-flex p-4 bg-gray-100 dark:bg-slate-800 rounded-2xl mb-4">
        <Icon size={32} className="text-gray-400 dark:text-slate-500" />
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 dark:text-slate-400 max-w-xs">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
