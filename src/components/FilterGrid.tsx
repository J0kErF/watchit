"use client";

import { useState } from "react";
import type { TitleSummary } from "@/lib/types";
import { Grid } from "./Row";

export function FilterGrid({ titles }: { titles: TitleSummary[] }) {
  const genres = [...new Set(titles.flatMap((t) => t.genres))].sort();
  const [genre, setGenre] = useState<string | null>(null);
  const shown = genre ? titles.filter((t) => t.genres.includes(genre)) : titles;

  return (
    <>
      <div className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {[null, ...genres].map((g) => (
          <button
            key={g ?? "all"}
            type="button"
            onClick={() => setGenre(g)}
            aria-pressed={genre === g}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${
              genre === g
                ? "border-accent bg-accent text-accent-ink"
                : "border-line text-muted hover:border-foreground/40 hover:text-foreground"
            }`}
          >
            {g ?? "All"}
          </button>
        ))}
      </div>
      <Grid titles={shown} />
    </>
  );
}
