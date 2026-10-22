// The Jawy wordmark and shadda mark. Geometry matches the files in public/brand.

const SHADDA = "M-30 -22V0A15 10 0 0 0 0 0V-10M0 0A15 10 0 0 0 30 0V-22";
const LETTERS =
  "M0 0V120A35 35 0 0 1 -35 155M88 0A50 50 0 1 0 88 100A50 50 0 1 0 88 0ZM138 0V100M176 0V70A30 30 0 0 0 236 70V22M236 70A30 30 0 0 0 296 70V0M334 0V60A40 40 0 0 0 414 60M414 0V120A35 35 0 0 1 379 155";

/** "jawy" with the shadda over the w. Letters take the text color; the shadda takes the accent. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="-48 -80 485 248" className={className} role="img" aria-label="Jawy">
      <path d={LETTERS} fill="none" stroke="currentColor" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="0" cy="-46" r="13.64" fill="currentColor" />
      <path
        transform="translate(238 -44) scale(0.92) skewX(-14)"
        d={SHADDA}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={15 / 0.92}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The shadda alone, in the current text color. */
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" className={className} aria-hidden>
      <path
        transform="translate(62 52) scale(1.6) skewX(-14)"
        d={SHADDA}
        fill="none"
        stroke="currentColor"
        strokeWidth={15 / 1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
