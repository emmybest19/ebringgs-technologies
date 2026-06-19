import { useState } from 'react';
import { CheckCircle2, XCircle, Star as StarIcon, Trash2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import StarRating from '../components/reviews/StarRating';
import {
  useAdminReviews, useSetReviewApproval, useSetReviewFeatured, useAdminDeleteReview,
  type AdminReviewFilter,
} from '../services/queries';
import { useSEO } from '@ebringgs/ui';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const initials = (name: string) =>
  name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

export default function AdminReviews() {
  useSEO({ title: 'Reviews', siteName: 'E-Bringgs Admin' });
  const [filter, setFilter] = useState<AdminReviewFilter>('pending');
  const { data: reviews = [], isLoading: loading } = useAdminReviews(filter);
  const approveReview = useSetReviewApproval();
  const featureReview = useSetReviewFeatured();
  const deleteReview = useAdminDeleteReview();

  const setApproval = (id: string, isApproved: boolean) => {
    approveReview.mutate({ id, isApproved }, {
      onSuccess: () => toast.success(isApproved ? 'Review approved.' : 'Review unapproved.'),
      onError: () => toast.error('Could not update approval.'),
    });
  };

  const setFeatured = (id: string, isFeatured: boolean) => {
    featureReview.mutate({ id, isFeatured }, {
      onSuccess: () => toast.success(isFeatured ? 'Marked as featured.' : 'Removed from featured.'),
      onError: () => toast.error('Could not update featured status.'),
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Permanently delete this review?')) return;
    deleteReview.mutate(id, {
      onSuccess: () => toast.success('Review deleted.'),
      onError: () => toast.error('Could not delete review.'),
    });
  };

  const counts = {
    pending: reviews.filter((r) => !r.isApproved).length,
    approved: reviews.filter((r) => r.isApproved).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reviews & Testimonials</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Approve reviews to publish them on the site. Feature your best ones to highlight on the landing page.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {[
          { id: 'pending', label: 'Pending' },
          { id: 'approved', label: 'Approved' },
          { id: 'all', label: 'All' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id as AdminReviewFilter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === t.id
                ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-12 text-center">
          <StarIcon size={40} className="text-gray-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="font-medium text-gray-500 dark:text-slate-400">
            No {filter === 'all' ? '' : filter} reviews
          </p>
        </div>
      ) : (
        <>
          <div className="text-xs text-gray-500 dark:text-slate-400">
            Showing {reviews.length} {filter === 'all' ? '' : filter} review{reviews.length === 1 ? '' : 's'}
            {filter === 'all' && ` (${counts.pending} pending, ${counts.approved} approved)`}
          </div>
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r._id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {initials(r.user.name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{r.user.name}</p>
                      <span className="text-xs text-gray-400 dark:text-slate-500 capitalize">
                        {r.user.role || 'User'} · {r.user.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <StarRating value={r.rating} readOnly size={14} />
                      <span className="text-xs text-gray-400 dark:text-slate-500">{formatDate(r.createdAt)}</span>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 rounded font-medium capitalize">
                        {r.targetType}
                      </span>
                    </div>
                    {r.title && <p className="font-bold text-gray-900 dark:text-white text-sm">{r.title}</p>}
                    <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{r.content}</p>
                    {r.targetName && (
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
                        About: <span className="font-medium">{r.targetName}</span>
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                      {r.isApproved ? (
                        <button
                          onClick={() => setApproval(r._id, false)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-lg hover:bg-amber-100 transition-colors"
                        >
                          <XCircle size={13} /> Unapprove
                        </button>
                      ) : (
                        <button
                          onClick={() => setApproval(r._id, true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle2 size={13} /> Approve & publish
                        </button>
                      )}

                      {r.isApproved && (
                        <button
                          onClick={() => setFeatured(r._id, !r.isFeatured)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                            r.isFeatured
                              ? 'bg-purple-600 text-white hover:bg-purple-700'
                              : 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-400 hover:bg-purple-100'
                          }`}
                        >
                          <Shield size={13} /> {r.isFeatured ? 'Unfeature' : 'Feature on landing'}
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(r._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors ml-auto"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
