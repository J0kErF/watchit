"use client";

import { useState, type ReactNode } from "react";
import type { Decade, Sort } from "@/lib/categories";
import type { Kind, TitleSummary } from "@/lib/types";
import { useKids, useLang, useT } from "./LangProvider";
import { Grid } from "./Row";

/**
 * The first batch of a category, rendered on the server (`children`), followed by the batches
 * fetched with Load more. Titles already shown are skipped, since TMDb pages can overlap.
 */
export function LoadMore({
  kind,
  slug,
  sub,
  sort,
  decade,
  initial,
  children,
}: {
  kind: Kind;
  slug: string;
  sub: string;
  sort: Sort;
  decade: Decade;
  initial: TitleSummary[];
  children: ReactNode;
}) {
  const lang = useLang();
  const kids = useKids();
  const t = useT();
  const [more, setMore] = useState<TitleSummary[]>([]);
  const [batch, setBatch] = useState(2);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "end">("idle");

  const load = async () => {
    setStatus("loading");
    try {
      const query = new URLSearchParams({ kind, slug, sub, sort, decade, batch: String(batch), lang, ...(kids && { kids: "1" }) });
      const res = await fetch(`/api/category?${query}`);
      if (!res.ok) throw new Error(String(res.status));
      const { results } = (await res.json()) as { results: TitleSummary[] };
      const seen = new Set([...initial, ...more].map((t) => t.id));
      const fresh = results.filter((t) => !seen.has(t.id));
      setMore((m) => [...m, ...fresh]);
      setBatch((b) => b + 1);
      setStatus(results.length ? "idle" : "end");
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      {children}
      {more.length > 0 && (
        <div className="mt-6">
          <Grid titles={more} lang={lang} />
        </div>
      )}
      {status !== "end" && (
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={load}
            disabled={status === "loading"}
            className="rounded-full border border-white/30 px-8 py-2.5 text-sm font-semibold transition hover:border-white hover:bg-white/10 disabled:opacity-60"
          >
            {t(status === "loading" ? "Loading…" : "Load more")}
          </button>
          {status === "error" && <p className="mt-3 text-sm text-muted">{t("Couldn’t load more titles. Try again.")}</p>}
        </div>
      )}
    </>
  );
}
