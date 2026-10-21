"use client";

import Link from "next/link";
import { useWatchlist } from "@/lib/library";
import { ContinueWatching } from "./ContinueWatching";
import { Grid } from "./Row";

export function MyList() {
  const list = useWatchlist();
  return (
    <>
      <ContinueWatching />
      <section className="px-4 py-4 sm:px-10">
        <h2 className="mb-4 font-display text-2xl sm:text-3xl">Saved titles</h2>
        {list.length === 0 ? (
          <p className="text-muted">
            Nothing saved yet. Hit <span className="text-foreground">+ My List</span> on any title, or{" "}
            <Link href="/movies" className="text-accent underline-offset-4 hover:underline">
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
