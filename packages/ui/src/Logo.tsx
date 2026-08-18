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
   * What kind of surface the logo is sitting on.
   *  - "dark" (default) / "auto" — the artwork sits directly on the surface.
   *  - "light" — the surface is light or printed, so the art goes on a dark
   *    rounded plate. The mark is white and cyan; without the plate its light
   *    half disappears entirely. The printable certificate is the one caller
   *    that needs this.
   */
  tone?: 'auto' | 'light' | 'dark';
}

/**
 * E-Bringgs brand logo. Two variants:
 *  - "mark" → the hexagonal eb mark alone (navbars, sidebars, tight UI)
 *  - "full" → the stacked lockup: mark over e-bringgs / TECHNOLOGIES / tagline
 *
 * Both files live in each app's /public so they're referenced by absolute URL
 * and skip the bundler. Every app that renders this component needs its own
 * copy under public/ebrings/.
 *
 * The old art shipped in two tones because its "technologies" line was
 * near-black and vanished on dark surfaces. The current art is white and cyan
 * throughout, so there is a single file per variant and the tone prop now
 * controls a backing plate instead of swapping files.
 */
export default function Logo({
  variant = 'mark',
  size,
  asLink = false,
  className = '',
  withWordmark = false,
  wordmarkClass = 'text-white',
  tone = 'auto',
}: LogoProps) {
  const height = size ?? (variant === 'full' ? 48 : 40);
  const onLight = tone === 'light';

  // "mark" is a 3:2 canvas with the artwork centred in transparent padding —
  // clip it to a square so it sits flush. "full" is a 1:1 canvas rendered
  // uncropped: its tagline sits close enough to the edge that any clipping
  // cuts the line off.
  const art =
    variant === 'mark' ? (
      <span
        className="inline-flex shrink-0 items-center justify-center overflow-hidden"
        style={{ height, width: height }}
      >
        <img
          src="/ebrings/short.png"
          alt="E-Bringgs Technologies"
          draggable={false}
          style={{ height: height * 1.14, width: 'auto', maxWidth: 'none' }}
        />
      </span>
    ) : (
      <img
        src="/ebrings/main.png"
        alt="E-Bringgs Technologies"
        draggable={false}
        className="shrink-0 object-contain"
        style={{ height, width: 'auto' }}
      />
    );

  const plated = onLight ? (
    <span
      className="inline-flex items-center justify-center rounded-xl bg-slate-900"
      style={{ padding: Math.round(height * 0.14) }}
    >
      {art}
    </span>
  ) : (
    art
  );

  const content = withWordmark && variant === 'mark' ? (
    <span className="flex items-center gap-2.5">
      {plated}
      <span className={`text-xl font-extrabold tracking-tight ${wordmarkClass}`}>e-bringgs</span>
    </span>
  ) : (
    plated
  );

  if (asLink) {
    return (
      <Link to="/" className={`inline-flex items-center ${className}`}>
        {content}
      </Link>
    );
  }

  return <div className={`inline-flex items-center ${className}`}>{content}</div>;
}
