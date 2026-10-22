"use client";

import Link from "next/link";
import { useWatchlist } from "@/lib/library";
import { TITLE_ID_PATTERN } from "@/lib/types";
import { ContinueWatching } from "./ContinueWatching";
import { Grid } from "./Row";

export function MyList() {
  // Titles saved from removed sources have ids that no longer resolve.
  const list = useWatchlist().filter((t) => TITLE_ID_PATTERN.test(t.id));
  return (
    <>
      <ContinueWatching />
      <section className="px-4 py-4 sm:px-12">
        <h2 className="mb-4 text-lg font-semibold sm:text-xl lg:text-2xl">Saved titles</h2>
        {list.length === 0 ? (
          <p className="text-muted">
            Nothing saved yet. Hit <span className="text-foreground">+ My List</span> on any title, or{" "}
            <Link href="/movies" className="font-semibold text-foreground underline-offset-4 hover:underline">
              browse movies
            </Link>
            .
          </p>
        ) : (
          <Grid titles={list.map((t) => ({ ...t, description: "", genres: [] }))} />
        )}
      </section>
    </>
  );
}
