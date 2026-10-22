"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDuration } from "@/lib/format";
import type { Episode } from "@/lib/types";

/** Episode list for one season at a time, with a season picker. */
export function Episodes({ titleId, episodes }: { titleId: string; episodes: Episode[] }) {
  const seasons = [...new Set(episodes.map((e) => e.season ?? 1))];
  const [season, setSeason] = useState(seasons[0]);
  const shown = episodes.filter((e) => (e.season ?? 1) === season);

  return (
    <section aria-labelledby="episodes-heading">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 id="episodes-heading" className="text-xl font-semibold sm:text-2xl">
          Episodes
        </h2>
        {seasons.length > 1 && (
          <select
            value={season}
            onChange={(e) => setSeason(Number(e.target.value))}
            aria-label="Season"
            className="rounded-md border border-white/30 bg-surface-2 px-4 py-2 text-sm font-semibold outline-none focus:border-white"
          >
            {seasons.map((s) => (
              <option key={s} value={s}>
                Season {s}
              </option>
            ))}
          </select>
        )}
      </div>
      <ol className="divide-y divide-line border-y border-line">
        {shown.map((e) => (
          <li key={e.path}>
            <Link
              href={`/watch/${titleId}?ep=${e.index}`}
              className="group flex items-center gap-4 rounded-md px-2 py-4 transition hover:bg-surface-2 sm:gap-6 sm:px-4"
            >
              <span className="hidden w-6 shrink-0 text-center text-2xl text-muted tabular-nums sm:block">
                {e.number ?? e.index + 1}
              </span>
              <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded bg-surface-2 sm:w-40">
                {e.still && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.still} alt="" loading="lazy" className="h-full w-full object-cover" />
                )}
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
                  <span className="shrink-0 text-sm text-muted">{formatDuration(e.duration)}</span>
                </div>
                {e.overview && <p className="mt-1 line-clamp-2 text-sm text-muted">{e.overview}</p>}
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
