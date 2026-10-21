import Link from "next/link";
import { formatDuration, formatRuntime } from "@/lib/format";
import type { TitleDetail } from "@/lib/types";
import { WatchlistButton } from "./WatchlistButton";

export function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 4.5v15l13-7.5z" />
    </svg>
  );
}

export function Hero({ title, eyebrow, detailed = false }: { title: TitleDetail; eyebrow?: string; detailed?: boolean }) {
  const length =
    title.kind === "series"
      ? `${title.episodes.length} episodes`
      : formatRuntime(title.runtime) || formatDuration(title.episodes[0]?.duration);
  const meta = [title.year, length, ...title.genres].filter(Boolean);

  return (
    <section className="relative flex min-h-[78vh] items-end overflow-hidden pb-12 pt-28 sm:min-h-[85vh] sm:pb-16">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={title.backdrop} alt="" className="absolute inset-0 h-full w-full scale-105 object-cover blur-[2px]" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-background/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />

      <div className="relative flex w-full items-end gap-8 px-4 sm:px-10">
        {detailed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={title.poster}
            alt={`${title.title} poster`}
            className="hidden w-52 shrink-0 rounded-md shadow-2xl ring-1 ring-line md:block lg:w-64"
          />
        )}
        <div className="max-w-2xl">
          {eyebrow && <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-accent">{eyebrow}</p>}
          <h1 className="font-display text-5xl leading-[0.95] sm:text-7xl">{title.title}</h1>
          <p className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
            {meta.map((m, i) => (
              <span key={i}>{m}</span>
            ))}
          </p>
          {title.description && (
            <p className={`mt-4 whitespace-pre-line text-base leading-relaxed text-foreground/85 ${detailed ? "line-clamp-6" : "line-clamp-3"}`}>
              {title.description}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={`/watch/${title.id}`}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink transition hover:brightness-110"
            >
              <PlayIcon />
              {title.kind === "series" ? "Play episode 1" : "Play"}
            </Link>
            {!detailed && (
              <Link
                href={`/title/${title.id}`}
                className="inline-flex items-center rounded-full border border-foreground/30 bg-black/30 px-5 py-2.5 text-sm font-medium backdrop-blur transition hover:border-foreground"
              >
                More info
              </Link>
            )}
            <WatchlistButton
              title={{ id: title.id, kind: title.kind, title: title.title, poster: title.poster, year: title.year }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function HeroSkeleton() {
  return <div className="min-h-[78vh] animate-pulse bg-surface sm:min-h-[85vh]" />;
}
