import { Link } from 'react-router-dom';

type Variant = 'mark' | 'full';

interface LogoProps {
  variant?: Variant;
  /** Height in px. Width auto-scales. Defaults: mark=40, full=48. */
  size?: number;
  /** If true, renders inside a Link to "/". */
  asLink?: boolean;
  /** Extra classes on the outer element. */
  className?: string;
  /** Wrap the mark in a white rounded badge — useful on dark backgrounds so the
   *  baked-in white background of the PNG reads as intentional. Only meaningful
   *  for variant="mark". */
  onDark?: boolean;
  /** Plain text wordmark next to the icon (only with variant="mark"). */
  withWordmark?: boolean;
  /** Color of the wordmark text. */
  wordmarkClass?: string;
}

/**
 * E-Bringgs brand logo. Two variants:
 *  - "mark" → just the eb icon (for tight UI: navbar, sidebars)
 *  - "full" → eb icon + e-bringgs technologies + Build. Launch. Grow.
 *
 * Files live in /public so they're referenced by absolute URL — no import
 * needed and they don't go through the bundler.
 */
export default function Logo({
  variant = 'mark',
  size,
  asLink = false,
  className = '',
  onDark = false,
  withWordmark = false,
  wordmarkClass = 'text-gray-900 dark:text-white',
}: LogoProps) {
  const src = variant === 'full' ? '/logo-full.jpg' : '/logo-mark.png';
  const height = size ?? (variant === 'full' ? 48 : 40);

  const img = (
    <img
      src={src}
      alt="E-Bringgs Technologies"
      style={{ height, width: 'auto' }}
      className={onDark && variant === 'mark' ? 'rounded-xl bg-white p-1' : ''}
      draggable={false}
    />
  );

  const content = withWordmark && variant === 'mark' ? (
    <div className="flex items-center gap-2">
      {img}
      <span className={`font-bold text-xl ${wordmarkClass}`}>e-bringgs</span>
    </div>
  ) : img;

  if (asLink) {
    return (
      <Link to="/" className={`inline-flex items-center ${className}`}>
        {content}
      </Link>
    );
  }

  return <div className={`inline-flex items-center ${className}`}>{content}</div>;
}
