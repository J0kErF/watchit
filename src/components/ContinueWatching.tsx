"use client";

import Link from "next/link";
import { clearProgress, useProgress } from "@/lib/library";

export function ContinueWatching() {
  const progress = useProgress();
  const items = Object.values(progress)
    .filter((p) => p.duration > 0 && p.time / p.duration < 0.95)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 12);

  if (items.length === 0) return null;

  return (
    <section className="py-4">
      <h2 className="mb-3 px-4 font-display text-2xl sm:px-10 sm:text-3xl">Continue watching</h2>
      <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 sm:gap-4 sm:scroll-px-10 sm:px-10">
        {items.map((p) => (
          <div key={p.id} className="group relative w-60 shrink-0 snap-start sm:w-72">
            <Link href={`/watch/${p.id}?ep=${p.ep}`} className="block">
              <div className="relative aspect-video overflow-hidden rounded-md bg-surface-2 ring-1 ring-line transition group-hover:ring-accent/70">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.poster} alt="" className="h-full w-full object-cover opacity-80" />
                <span className="absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-ink">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 4.5v15l13-7.5z" />
                    </svg>
                  </span>
                </span>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
                  <div className="h-full bg-accent" style={{ width: `${(p.time / p.duration) * 100}%` }} />
                </div>
              </div>
              <p className="mt-2 line-clamp-1 text-sm font-medium">{p.title}</p>
              <p className="line-clamp-1 text-xs text-muted">
                {p.kind === "series" && p.epTitle ? `Ep ${p.ep + 1} · ${p.epTitle}` : `${Math.ceil((p.duration - p.time) / 60)} min left`}
              </p>
            </Link>
            <button
              type="button"
              onClick={() => clearProgress(p.id)}
              aria-label={`Remove ${p.title} from Continue watching`}
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-muted opacity-0 transition hover:text-foreground focus:opacity-100 group-hover:opacity-100"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
