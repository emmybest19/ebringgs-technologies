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
  /** Plain text wordmark next to the icon (only with variant="mark"). */
  withWordmark?: boolean;
  /** Color of the wordmark text. */
  wordmarkClass?: string;
  /**
   * Which tone of the artwork to use. Only affects variant="full", whose
   * "technologies" wordmark is near-black in the default art and slate-200 in
   * the -dark art. variant="mark" is entirely gold/teal and legible anywhere.
   *  - "auto"  (default) follow the theme: light art in light mode, dark art
   *            in dark mode. Correct for surfaces that themselves theme.
   *  - "dark"  always the dark art — for surfaces that are dark in both themes
   *            (footer, sidebars, auth panels).
   *  - "light" always the light art — for surfaces that are light in both
   *            themes (the printable certificate).
   */
  tone?: 'auto' | 'light' | 'dark';
}

/**
 * E-Bringgs brand logo. Two variants:
 *  - "mark" → just the eb icon (for tight UI: navbar, sidebars)
 *  - "full" → eb icon + e-bringgs technologies + Build. Launch. Grow.
 *
 * Files live in /public so they're referenced by absolute URL, no import
 * needed and they don't go through the bundler.
 */
export default function Logo({
  variant = 'mark',
  size,
  asLink = false,
  className = '',
  withWordmark = false,
  wordmarkClass = 'text-gray-900 dark:text-white',
  tone = 'auto',
}: LogoProps) {
  // All assets have transparent backgrounds (the -full PNGs are the source JPG
  // with its white background keyed out), so they sit directly on any surface.
  //
  // The "full" art contains a near-black "technologies" wordmark that
  // disappears on dark surfaces, so it ships in two tones: the default and
  // -dark, where that word is recoloured to slate-200. The "mark" art is all
  // gold/teal and needs no such treatment.
  const src = variant === 'full' ? '/logo-full.png' : '/logo-mark.png';
  const darkSrc = variant === 'full' ? '/logo-full-dark.png' : '/logo-mark.png';
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

  const imgStyle = { height: height * cropScale, width: 'auto', maxWidth: 'none' } as const;
  // Only "full" has two tones, and only "auto" needs both rendered so CSS can
  // pick per theme. Pinned tones render a single image.
  const swapsWithTheme = variant === 'full' && tone === 'auto';

  const img = (
    <span className="inline-flex items-center justify-center shrink-0">
      <span
        className="overflow-hidden inline-flex items-center justify-center"
        style={{ height, width: boxWidth }}
      >
        <img
          src={tone === 'dark' ? darkSrc : src}
          alt="E-Bringgs Technologies"
          style={imgStyle}
          className={swapsWithTheme ? 'dark:hidden' : undefined}
          draggable={false}
        />
        {swapsWithTheme && (
          <img
            src={darkSrc}
            alt=""
            aria-hidden="true"
            style={imgStyle}
            className="hidden dark:block"
            draggable={false}
          />
        )}
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
