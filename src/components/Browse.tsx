import type { ReactNode } from "react";
import { type Lang, t } from "@/lib/i18n";
import { getTitle } from "@/lib/titles";
import type { TitleSummary } from "@/lib/types";
import { Hero, HeroSkeleton } from "./Hero";
import { Row, RowSkeleton } from "./Row";

export interface RowSpec {
  /** English heading, translated here. */
  heading: string;
  titles: Promise<TitleSummary[]>;
  top10?: boolean;
}

/**
 * A browse page: a billboard for the first candidate with artwork, then rows. Rows that come back
 * empty are skipped, and a title appears in at most two rows so the page doesn't repeat itself.
 */
export async function Browse({
  lang,
  featured,
  eyebrow,
  rows,
  children,
}: {
  lang: Lang;
  featured: Promise<TitleSummary[]>;
  eyebrow?: string;
  rows: RowSpec[];
  /** Rendered between the billboard and the rows, e.g. Continue watching. */
  children?: ReactNode;
}) {
  const [candidates, ...lists] = await Promise.all([featured, ...rows.map((r) => r.titles)]);
  const pick = candidates.find((c) => c.backdrop && c.description);
  const hero = pick ? await getTitle(pick.id, lang) : null;

  const seen = new Map<string, number>();
  const shown = rows.map((row, i) => {
    const titles = row.top10
      ? lists[i]
      : lists[i].filter((title) => {
          const count = seen.get(title.id) ?? 0;
          seen.set(title.id, count + 1);
          return count < 2;
        });
    return { ...row, titles };
  });

  if (!hero && shown.every((r) => r.titles.length === 0)) {
    // The message names the settings in <code>, so it's split around the placeholders.
    const parts = t(lang, "Titles couldn’t be loaded from TMDB. Check that {key} or {token} is set, then reload.").split(
      /(\{key\}|\{token\})/,
    );
    return (
      <div className="grid min-h-[70vh] place-items-center px-4 pt-16 text-center">
        <div className="max-w-md">
          <p className="font-display text-4xl font-bold tracking-tight text-accent">{t(lang, "Nothing to show yet")}</p>
          <p className="mt-3 text-muted">
            {parts.map((part, i) =>
              part === "{key}" || part === "{token}" ? (
                <code key={i} className="text-foreground" dir="ltr">
                  {part === "{key}" ? "TMDB_API_KEY" : "TMDB_READ_TOKEN"}
                </code>
              ) : (
                part
              ),
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {hero ? <Hero title={hero} eyebrow={eyebrow && t(lang, eyebrow)} lang={lang} /> : <div className="h-24" />}
      <div className="relative z-10 -mt-12 space-y-1 pb-6 sm:-mt-20 sm:space-y-3">
        {children}
        {shown.map((row) => (
          <Row key={row.heading} heading={t(lang, row.heading)} titles={row.titles} top10={row.top10} lang={lang} />
        ))}
      </div>
    </>
  );
}

export function BrowseSkeleton() {
  return (
    <>
      <HeroSkeleton />
      <div className="-mt-12 sm:-mt-20">
        <RowSkeleton />
        <RowSkeleton />
        <RowSkeleton />
      </div>
    </>
  );
}
