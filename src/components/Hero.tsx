import Link from "next/link";
import { formatDuration } from "@/lib/format";
import type { TitleDetail } from "@/lib/types";
import { Rating } from "./TitleCard";
import { WatchlistButton } from "./WatchlistButton";

export function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 4.5v15l13-7.5z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 11v6M12 7.5v.01" strokeLinecap="round" />
    </svg>
  );
}

export function titleLength(title: TitleDetail) {
  if (title.kind === "series") {
    return title.seasons && title.seasons > 1 ? `${title.seasons} seasons` : `${title.episodes.length} episodes`;
  }
  return formatDuration(title.episodes[0]?.duration);
}

/**
 * Full-bleed billboard: the backdrop with the title's logo (or name), facts and actions.
 * `detailed` is the title page version, with the tagline and no "More info".
 */
export function Hero({ title, eyebrow, detailed = false }: { title: TitleDetail; eyebrow?: string; detailed?: boolean }) {
  const facts = [title.year, titleLength(title), title.genres.slice(0, 3).join(" · ")].filter(Boolean);

  return (
    <section className="relative flex min-h-[80svh] items-end overflow-hidden pb-14 pt-28 sm:min-h-[92svh] sm:pb-24">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={title.backdrop}
        alt=""
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover object-[center_20%]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/50 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />

      <div className="relative w-full max-w-3xl animate-fade-in px-4 sm:px-12">
        {eyebrow && (
          <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-foreground/90">
            <span className="font-display text-2xl leading-none tracking-normal text-accent">W</span>
            {eyebrow}
          </p>
        )}
        {title.logo ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={title.logo}
              alt=""
              className="max-h-28 w-auto max-w-[80%] object-contain object-left drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] sm:max-h-40 sm:max-w-md"
            />
            <h1 className="sr-only">{title.title}</h1>
          </>
        ) : (
          <h1 className="font-display text-6xl leading-[0.9] tracking-wide drop-shadow-lg sm:text-8xl">{title.title}</h1>
        )}

        <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-foreground/85 sm:text-base">
          <Rating value={title.rating} />
          {facts.map((f, i) => (
            <span key={i} className="flex items-center gap-3">
              {(i > 0 || title.rating) && <span className="h-1 w-1 rounded-full bg-foreground/50" />}
              {f}
            </span>
          ))}
        </p>
        {detailed && title.tagline && <p className="mt-3 italic text-foreground/70">{title.tagline}</p>}
        {title.description && (
          <p
            className={`mt-4 max-w-2xl text-sm leading-relaxed text-foreground/90 drop-shadow sm:text-lg ${
              detailed ? "line-clamp-6" : "line-clamp-3"
            }`}
          >
            {title.description}
          </p>
        )}

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link
            href={`/watch/${title.id}`}
            className="inline-flex items-center gap-2.5 rounded-md bg-white px-6 py-2.5 text-base font-bold text-black transition hover:bg-white/80 sm:px-8 sm:py-3 sm:text-lg"
          >
            <PlayIcon />
            {title.kind === "series" ? "Play S1 E1" : "Play"}
          </Link>
          {!detailed && (
            <Link
              href={`/title/${title.id}`}
              className="inline-flex items-center gap-2.5 rounded-md bg-white/25 px-6 py-2.5 text-base font-bold backdrop-blur transition hover:bg-white/15 sm:px-8 sm:py-3 sm:text-lg"
            >
              <InfoIcon />
              More info
            </Link>
          )}
          <WatchlistButton
            title={{ id: title.id, kind: title.kind, title: title.title, poster: title.poster, year: title.year }}
          />
        </div>
      </div>
    </section>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative min-h-[80svh] bg-surface sm:min-h-[92svh]">
      <div className="absolute bottom-24 left-4 space-y-4 sm:left-12">
        <div className="h-16 w-80 max-w-[80vw] animate-pulse rounded bg-surface-2" />
        <div className="h-4 w-64 animate-pulse rounded bg-surface-2" />
        <div className="h-4 w-96 max-w-[80vw] animate-pulse rounded bg-surface-2" />
        <div className="flex gap-3 pt-3">
          <div className="h-12 w-32 animate-pulse rounded-md bg-surface-2" />
          <div className="h-12 w-36 animate-pulse rounded-md bg-surface-2" />
        </div>
      </div>
    </div>
  );
}
