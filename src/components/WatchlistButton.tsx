"use client";

import { toggleWatchlist, useWatchlist, type SavedTitle } from "@/lib/library";

export function WatchlistButton({ title }: { title: SavedTitle }) {
  const list = useWatchlist();
  const saved = list.some((t) => t.id === title.id);
  return (
    <button
      type="button"
      onClick={() => toggleWatchlist(title)}
      aria-pressed={saved}
      className="inline-flex items-center gap-2 rounded-full border border-foreground/30 bg-black/30 px-5 py-2.5 text-sm font-medium backdrop-blur transition hover:border-foreground"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        {saved ? <path d="m5 12 5 5L20 7" /> : <path d="M12 5v14M5 12h14" />}
      </svg>
      {saved ? "In My List" : "My List"}
    </button>
  );
}
