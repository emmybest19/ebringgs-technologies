import StarRating from './StarRating';

export interface ReviewCardData {
  _id: string;
  rating: number;
  title?: string;
  content: string;
  targetType: 'program' | 'service' | 'platform';
  targetName?: string;
  createdAt: string;
  user: {
    _id?: string;
    name: string;
    avatar?: string;
    role?: string;
  };
}

const initials = (name: string) =>
  name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

export default function ReviewCard({ review, dark }: { review: ReviewCardData; dark?: boolean }) {
  const cardClass = dark
    ? 'bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6'
    : 'bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6';
  const nameClass = dark ? 'text-white' : 'text-gray-900 dark:text-white';
  const metaClass = dark ? 'text-slate-400' : 'text-gray-400 dark:text-slate-500';
  const contentClass = dark ? 'text-slate-300' : 'text-gray-600 dark:text-slate-400';

  return (
    <div className={cardClass}>
      <div className="flex items-start gap-3 mb-3">
        {review.user.avatar ? (
          <img
            src={review.user.avatar}
            alt={review.user.name}
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {initials(review.user.name)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${nameClass}`}>{review.user.name}</p>
          <p className={`text-xs ${metaClass} capitalize`}>
            {review.user.role || 'User'} · {formatDate(review.createdAt)}
          </p>
        </div>
      </div>

      <div className="mb-2">
        <StarRating value={review.rating} readOnly size={14} />
      </div>

      {review.title && (
        <p className={`font-bold text-sm mb-1 ${nameClass}`}>{review.title}</p>
      )}
      <p className={`text-sm leading-relaxed ${contentClass}`}>{review.content}</p>

      {review.targetName && (
        <p className={`text-xs mt-3 ${metaClass}`}>
          Reviewed: <span className="font-medium">{review.targetName}</span>
        </p>
      )}
    </div>
  );
}
