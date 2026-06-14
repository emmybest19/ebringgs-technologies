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

  // Both source files are square 1:1 canvases with the brand sitting in the
  // middle surrounded by dead whitespace. We render the image larger than the
  // visible box and clip the edges so the brand fills the container.
  //   - "full" brand is roughly 1.6:1 (mark + wordmark + tagline) and fills
  //     ~55% of the canvas height → scale 1.9x and use a wide box.
  //   - "mark" brand is roughly square and fills ~70% of the canvas → scale
  //     1.4x in a square box.
  const cropScale = variant === 'full' ? 1.9 : 1.4;
  const boxAspect = variant === 'full' ? 1.7 : 1;
  const boxWidth = height * boxAspect;

  // Light mode: mix-blend-mode: multiply makes the baked-in white background
  // blend into the page surface — no visible white card.
  // Dark mode: render an actual white "card" around the logo (padding +
  // rounded corners + soft shadow + hairline ring) so the brand colors stay
  // legible and the badge looks like an intentional design element.
  const cardClass = onDark
    ? 'rounded-xl bg-white p-2 shadow-md ring-1 ring-black/5'
    : 'dark:rounded-xl dark:bg-white dark:p-2 dark:shadow-md dark:ring-1 dark:ring-black/5';

  const imgClass = onDark
    ? ''
    : '[mix-blend-mode:multiply] dark:[mix-blend-mode:normal]';

  const img = (
    <span className={`inline-flex items-center justify-center shrink-0 ${cardClass}`}>
      <span
        className="overflow-hidden inline-flex items-center justify-center"
        style={{ height, width: boxWidth }}
      >
        <img
          src={src}
          alt="E-Bringgs Technologies"
          style={{ height: height * cropScale, width: 'auto', maxWidth: 'none' }}
          className={imgClass}
          draggable={false}
        />
      </span>
    </span>
  );

  const content = withWordmark && variant === 'mark' ? (
    <div className="flex items-center gap-2">
      {img}
      <span className={`font-extrabold text-xl tracking-tight ${wordmarkClass}`}>e-bringgs</span>
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
