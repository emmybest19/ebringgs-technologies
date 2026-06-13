import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
  showValue?: boolean;
  showCount?: number;
}

export default function StarRating({
  value,
  onChange,
  size = 18,
  readOnly = false,
  showValue = false,
  showCount,
}: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <div className="inline-flex items-center gap-2">
      <div className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= display;
          const isHalf = !filled && star - 0.5 <= display;
          return (
            <button
              key={star}
              type="button"
              disabled={readOnly}
              onClick={() => !readOnly && onChange?.(star)}
              onMouseEnter={() => !readOnly && setHover(star)}
              onMouseLeave={() => !readOnly && setHover(0)}
              className={`${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
              aria-label={`${star} star${star === 1 ? '' : 's'}`}
            >
              <Star
                size={size}
                className={
                  filled
                    ? 'fill-amber-400 text-amber-400'
                    : isHalf
                    ? 'fill-amber-200 text-amber-400'
                    : 'fill-transparent text-gray-300 dark:text-slate-600'
                }
              />
            </button>
          );
        })}
      </div>
      {showValue && value > 0 && (
        <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">
          {value.toFixed(1)}
        </span>
      )}
      {showCount !== undefined && (
        <span className="text-xs text-gray-400 dark:text-slate-500">
          ({showCount.toLocaleString()})
        </span>
      )}
    </div>
  );
}
