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
      aria-label={saved ? `Remove ${title.title} from My List` : `Add ${title.title} to My List`}
      title={saved ? "Remove from My List" : "Add to My List"}
      className="grid h-11 w-11 place-items-center rounded-full border-2 border-white/60 bg-black/40 backdrop-blur transition hover:border-white sm:h-12 sm:w-12"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
        {saved ? <path d="m5 12 5 5L20 7" /> : <path d="M12 5v14M5 12h14" />}
      </svg>
    </button>
  );
}
