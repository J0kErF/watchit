"use client";

import Link from "next/link";
import { clearProgress, useNewEpisodes, useProgress } from "@/lib/library";
import { TITLE_ID_PATTERN } from "@/lib/types";
import { useLang, useT } from "./LangProvider";
import { RowScroller } from "./RowScroller";
import { NewEpisodeBadge } from "./TitleCard";

export function ContinueWatching() {
  const lang = useLang();
  const t = useT();
  const progress = useProgress();
  // Progress saved for titles from removed sources has ids that no longer resolve.
  const items = Object.values(progress)
    .filter((p) => TITLE_ID_PATTERN.test(p.id) && p.duration > 0 && p.time / p.duration < 0.95)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 12);
  const newEpisodes = useNewEpisodes(items.map((p) => ({ id: p.id, since: p.updatedAt })));

  if (items.length === 0) return null;

  return (
    <section className="py-2 sm:py-3" aria-label={t("Continue watching")}>
      <h2 className="px-4 text-lg font-semibold tracking-tight sm:px-12 sm:text-xl lg:text-2xl">{t("Continue watching")}</h2>
      <RowScroller label={t("Continue watching")}>
        {items.map((p) => (
          <div key={p.id} className="group relative w-64 shrink-0 snap-start sm:w-72 lg:w-80">
            <Link href={`/watch/${p.id}?ep=${p.ep}`} className="block">
              <div className="relative aspect-video overflow-hidden rounded-md bg-surface-2 ring-1 ring-white/5 transition group-hover:ring-white/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.backdrop ?? p.poster} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                {newEpisodes.has(p.id) && <NewEpisodeBadge lang={lang} className="absolute start-2 top-2" />}
                <span className="absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100">
                  <span className="grid h-12 w-12 place-items-center rounded-full border-2 border-white bg-black/50">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M7 4.5v15l13-7.5z" />
                    </svg>
                  </span>
                </span>
                <div className="absolute inset-x-3 bottom-3">
                  <p className="line-clamp-1 text-sm font-semibold sm:text-base">{p.title}</p>
                  <p className="line-clamp-1 text-xs text-white/75">
                    {p.kind === "series" && p.epTitle
                      ? `${p.epLabel ?? t("Ep {n}", { n: p.ep + 1 })} · ${p.epTitle}`
                      : t("{n} min left", { n: Math.ceil((p.duration - p.time) / 60) })}
                  </p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/25">
                    <div className="h-full bg-accent" style={{ width: `${(p.time / p.duration) * 100}%` }} />
                  </div>
                </div>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => clearProgress(p.id)}
              aria-label={t("Remove {title} from Continue watching", { title: p.title })}
              className="absolute end-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white/80 opacity-0 transition hover:text-white focus:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
            >
              ×
            </button>
          </div>
        ))}
      </RowScroller>
    </section>
  );
}
