"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDuration } from "@/lib/format";
import { episodeKey, setWatched, useWatched } from "@/lib/library";
import type { Episode } from "@/lib/types";
import { useLang, useT } from "./LangProvider";

/** Episode list for one season at a time, with a season picker and watched marks. */
export function Episodes({ titleId, episodes }: { titleId: string; episodes: Episode[] }) {
  const lang = useLang();
  const t = useT();
  const watched = useWatched(titleId);
  const seasons = [...new Set(episodes.map((e) => e.season ?? 1))];
  const [season, setSeason] = useState(seasons[0]);
  const shown = episodes.filter((e) => (e.season ?? 1) === season);
  const keys = shown.map(episodeKey);
  const seen = keys.filter((k) => watched.has(k)).length;
  const allSeen = seen === keys.length;

  return (
    <section aria-labelledby="episodes-heading">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 id="episodes-heading" className="text-xl font-semibold sm:text-2xl">
          {t("Episodes")}
        </h2>
        {seasons.length > 1 && (
          <select
            value={season}
            onChange={(e) => setSeason(Number(e.target.value))}
            aria-label={t("Season")}
            className="rounded-md border border-white/30 bg-surface-2 px-4 py-2 text-sm font-semibold outline-none focus:border-white"
          >
            {seasons.map((s) => (
              <option key={s} value={s}>
                {t("Season {n}", { n: s })}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="mb-4 flex items-center gap-4 text-sm">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15" aria-hidden>
          <div className="h-full bg-accent transition-[width]" style={{ width: `${(seen / keys.length) * 100}%` }} />
        </div>
        <span className="shrink-0 text-muted tabular-nums">{t("{n} of {total} watched", { n: seen, total: keys.length })}</span>
        <button
          type="button"
          onClick={() => setWatched(titleId, keys, !allSeen)}
          className="shrink-0 rounded-full border border-white/25 px-3 py-1 text-xs font-semibold transition hover:border-white/70"
        >
          {t(allSeen ? "Mark season as not watched" : "Mark season as watched")}
        </button>
      </div>
      <ol className="divide-y divide-line border-y border-line">
        {shown.map((e) => {
          const key = episodeKey(e);
          const done = watched.has(key);
          return (
            <li key={e.path} className="flex items-center gap-2">
              <Link
                href={`/watch/${titleId}?ep=${e.index}`}
                className="group flex min-w-0 flex-1 items-center gap-4 rounded-md px-2 py-4 transition hover:bg-surface-2 sm:gap-6 sm:px-4"
              >
                <span className="hidden w-6 shrink-0 text-center text-2xl text-muted tabular-nums sm:block">
                  {e.number ?? e.index + 1}
                </span>
                <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded bg-surface-2 sm:w-40">
                  {e.still && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.still} alt="" loading="lazy" className={`h-full w-full object-cover ${done ? "opacity-60" : ""}`} />
                  )}
                  {done && <div className="absolute inset-x-0 bottom-0 h-1 bg-accent" />}
                  <span className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 transition group-hover:opacity-100">
                    <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-white bg-black/50">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M7 4.5v15l13-7.5z" />
                      </svg>
                    </span>
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate font-semibold">
                      <span className="sm:hidden">{e.number ?? e.index + 1}. </span>
                      {e.title}
                    </p>
                    <span className="shrink-0 text-sm text-muted">{formatDuration(e.duration, lang)}</span>
                  </div>
                  {e.overview && <p className="mt-1 line-clamp-2 text-sm text-muted">{e.overview}</p>}
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setWatched(titleId, [key], !done)}
                aria-pressed={done}
                aria-label={t(done ? "Mark {title} as not watched" : "Mark {title} as watched", { title: e.title })}
                title={t(done ? "Mark {title} as not watched" : "Mark {title} as watched", { title: e.title })}
                className={`me-2 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 transition ${
                  done ? "border-accent bg-accent text-accent-ink" : "border-white/30 text-transparent hover:border-white/70 hover:text-white/50"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                  <path d="M5 12.5l4.5 4.5L19 7" />
                </svg>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
