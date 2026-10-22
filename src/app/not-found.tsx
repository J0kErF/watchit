import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-4 pt-16 text-center">
      <div>
        <p className="font-display text-8xl tracking-wide text-accent">The End</p>
        <p className="mt-3 text-muted">This title isn’t available — it may not be in the library, or it has no playable video.</p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink">
          Back to home
        </Link>
      </div>
    </div>
  );
}
