export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' }[size];
  return (
    <div className={`${s} animate-spin rounded-full border-2 border-gray-200 dark:border-slate-700 border-t-teal-600`} />
  );
}

export function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
