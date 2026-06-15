import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import StarRating from './StarRating';
import { useSubmitReview, type ReviewTargetType } from '../../services/queries';

interface ReviewFormProps {
  targetType: ReviewTargetType;
  targetId?: string;
  targetName?: string;
  onSubmitted?: () => void;
}

export default function ReviewForm({ targetType, targetId, targetName, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const submitReview = useSubmitReview();
  const submitting = submitReview.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a star rating.');
      return;
    }
    if (content.trim().length < 10) {
      toast.error('Please write at least 10 characters.');
      return;
    }

    submitReview.mutate(
      {
        rating,
        title: title.trim() || undefined,
        content: content.trim(),
        targetType,
        targetId,
        targetName,
      },
      {
        onSuccess: () => {
          toast.success('Thanks! Your review is awaiting approval.');
          setRating(0);
          setTitle('');
          setContent('');
          onSubmitted?.();
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            || 'Could not submit review. Please try again.';
          toast.error(msg);
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
          Your rating
        </label>
        <StarRating value={rating} onChange={setRating} size={28} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
          Title <span className="text-gray-400 dark:text-slate-500 text-xs font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="Sum up your experience in a few words"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
          Your review
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={5}
          maxLength={1000}
          placeholder="Share your honest experience, what worked, what could be better..."
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none text-sm resize-none"
        />
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
          {content.length}/1000 characters · Minimum 10
        </p>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-60 transition-colors"
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        {submitting ? 'Submitting...' : 'Submit review'}
      </button>

      <p className="text-xs text-gray-400 dark:text-slate-500">
        Reviews are moderated before appearing on the site. This usually takes 1-2 business days.
      </p>
    </form>
  );
}
