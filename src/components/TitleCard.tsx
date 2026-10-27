import Link from "next/link";
import { type Lang, t } from "@/lib/i18n";
import type { TitleSummary } from "@/lib/types";

export function Rating({ value, className = "" }: { value?: number; className?: string }) {
  if (!value) return null;
  return (
    <span className={`inline-flex items-center gap-1 font-semibold text-emerald-400 ${className}`}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
      </svg>
      {value.toFixed(1)}
    </span>
  );
}

export function NewEpisodeBadge({ lang, className = "absolute bottom-2 start-2" }: { lang: Lang; className?: string }) {
  return (
    <span className={`${className} rounded-sm bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow`}>
      {t(lang, "New episode")}
    </span>
  );
}

function SeriesBadge({ lang }: { lang: Lang }) {
  return (
    <span className="absolute start-2 top-2 rounded-sm bg-accent px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-ink">
      {t(lang, "Series")}
    </span>
  );
}

/** Portrait poster card, for grids. */
export function TitleCard({
  title,
  newEpisode = false,
  lang,
  className = "",
}: {
  title: TitleSummary;
  newEpisode?: boolean;
  lang: Lang;
  className?: string;
}) {
  return (
    <Link href={`/title/${title.id}`} className={`group block ${className}`}>
      <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-surface-2 ring-1 ring-white/5 transition duration-300 group-hover:ring-white/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={title.poster}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {title.kind === "series" && <SeriesBadge lang={lang} />}
        {newEpisode && <NewEpisodeBadge lang={lang} />}
      </div>
      <p className="mt-2 line-clamp-1 text-sm font-medium">{title.title}</p>
      <p className="flex items-center gap-2 text-xs text-muted">
        <Rating value={title.rating} />
        {title.year}
      </p>
    </Link>
  );
}

/** Landscape card with the title over the artwork, for rows. */
export function WideCard({ title, lang, className = "" }: { title: TitleSummary; lang: Lang; className?: string }) {
  return (
    <Link
      href={`/title/${title.id}`}
      className={`group relative block aspect-video shrink-0 snap-start overflow-hidden rounded-md bg-surface-2 ring-1 ring-white/5 transition duration-300 hover:ring-white/50 focus-visible:ring-2 focus-visible:ring-white ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={title.backdrop ?? title.poster}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      {title.kind === "series" && <SeriesBadge lang={lang} />}
      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="line-clamp-1 text-sm font-semibold drop-shadow sm:text-base">{title.title}</p>
        <p className="mt-0.5 flex items-center gap-2 text-xs text-white/75">
          <Rating value={title.rating} />
          {title.year && <span>{title.year}</span>}
          {title.genres[0] && <span className="line-clamp-1">{title.genres.slice(0, 2).join(" · ")}</span>}
        </p>
      </div>
    </Link>
  );
}

/** Poster with an outlined rank numeral, for Top 10 rows. */
export function RankCard({ title, rank }: { title: TitleSummary; rank: number }) {
  return (
    <Link
      href={`/title/${title.id}`}
      aria-label={`${rank}. ${title.title}`}
      className="group relative flex h-44 w-48 shrink-0 snap-start items-end sm:h-56 sm:w-60"
    >
      <span
        aria-hidden
        className={`rank-numeral absolute bottom-[-0.12em] start-0 font-display leading-none ${
          rank === 10 ? "text-[7.5rem] tracking-[-0.12em] sm:text-[9.5rem]" : "text-[9rem] sm:text-[11.5rem]"
        }`}
      >
        {rank}
      </span>
      <div className="relative ms-auto aspect-[2/3] h-full overflow-hidden rounded-md bg-surface-2 ring-1 ring-white/5 transition duration-300 group-hover:ring-white/50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={title.poster} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      </div>
    </Link>
  );
}
