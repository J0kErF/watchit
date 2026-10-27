"use client";

import Link from "next/link";
import { useNewEpisodes, useProgress, useWatchlist } from "@/lib/library";
import { TITLE_ID_PATTERN } from "@/lib/types";
import { ContinueWatching } from "./ContinueWatching";
import { useLang, useT } from "./LangProvider";
import { Grid } from "./Row";

export function MyList() {
  const lang = useLang();
  const t = useT();
  // Titles saved from removed sources have ids that no longer resolve.
  const list = useWatchlist().filter((title) => TITLE_ID_PATTERN.test(title.id));
  const progress = useProgress();
  const newEpisodes = useNewEpisodes(list.map((title) => ({ id: title.id, since: progress[title.id]?.updatedAt ?? title.addedAt })));
  // The empty message holds a highlighted button name and a link, so it's split around them.
  const empty = t("Nothing saved yet. Hit {button} on any title, or {link}.").split(/(\{button\}|\{link\})/);

  return (
    <>
      <ContinueWatching />
      <section className="px-4 py-4 sm:px-12">
        <h2 className="mb-4 text-lg font-semibold sm:text-xl lg:text-2xl">{t("Saved titles")}</h2>
        {list.length === 0 ? (
          <p className="text-muted">
            {empty.map((part, i) =>
              part === "{button}" ? (
                <span key={i} className="text-foreground">
                  {t("+ My List")}
                </span>
              ) : part === "{link}" ? (
                <Link key={i} href="/movies" className="font-semibold text-foreground underline-offset-4 hover:underline">
                  {t("browse movies")}
                </Link>
              ) : (
                part
              ),
            )}
          </p>
        ) : (
          <Grid titles={list.map((title) => ({ ...title, description: "", genres: [] }))} newEpisodes={newEpisodes} lang={lang} />
        )}
      </section>
    </>
  );
}
