import { useState } from 'react';
import { Plus, Trash2, Clock, CheckCircle2, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import StarRating from './StarRating';
import ReviewForm from './ReviewForm';
import { useMyReviews, useDeleteMyReview, type ReviewTargetType } from '../../services/queries';

interface Props {
  /** Default targetType when creating a new review (e.g. 'program' for students). */
  targetType: ReviewTargetType;
  /** Optional default name to associate with the review. */
  defaultTargetName?: string;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function MyReviewsTab({ targetType, defaultTargetName }: Props) {
  const { data: reviews = [], isLoading: loading } = useMyReviews();
  const deleteReview = useDeleteMyReview();
  const [showForm, setShowForm] = useState(false);

  const handleDelete = (id: string) => {
    if (!confirm('Delete this review?')) return;
    deleteReview.mutate(id, {
      onSuccess: () => toast.success('Review deleted.'),
      onError: () => toast.error('Could not delete review.'),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Reviews</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Share your experience to help others choose.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors"
          >
            <Plus size={16} /> Leave a review
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white">Write a review</h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-slate-300"
            >
              Cancel
            </button>
          </div>
          <ReviewForm
            targetType={targetType}
            targetName={defaultTargetName}
            onSubmitted={() => setShowForm(false)}
          />
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-gray-400">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-12 text-center">
          <Star size={40} className="text-gray-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="font-medium text-gray-500 dark:text-slate-400">No reviews yet</p>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
            Click "Leave a review" above to share your experience.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <StarRating value={r.rating} readOnly size={14} />
                    {r.isApproved ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 text-[10px] font-semibold rounded-full">
                        <CheckCircle2 size={10} /> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-[10px] font-semibold rounded-full">
                        <Clock size={10} /> Pending review
                      </span>
                    )}
                    {r.isFeatured && (
                      <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 text-[10px] font-semibold rounded-full">
                        Featured
                      </span>
                    )}
                  </div>
                  {r.title && <p className="font-bold text-gray-900 dark:text-white text-sm">{r.title}</p>}
                  <p className="text-sm text-gray-600 dark:text-slate-400 mt-1 leading-relaxed">{r.content}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
                    {r.targetName && <>About {r.targetName} · </>}
                    {formatDate(r.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleDelete(r._id)}
                    title="Delete review"
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

