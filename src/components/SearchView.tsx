"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Kind, TitleSummary } from "@/lib/types";
import { useKids, useLang, useT } from "./LangProvider";
import { Grid } from "./Row";

const TYPES: { value: Kind | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "movie", label: "Movies" },
  { value: "series", label: "Series" },
];

type State = { status: "idle" | "loading" | "done" | "error"; results: TitleSummary[] };

export function SearchView() {
  const router = useRouter();
  const lang = useLang();
  const kids = useKids();
  const t = useT();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [type, setType] = useState<Kind | "all">((params.get("type") as Kind | null) ?? "all");
  const [state, setState] = useState<State>({ status: "idle", results: [] });

  useEffect(() => {
    const q = query.trim();
    const timer = setTimeout(async () => {
      router.replace(`/search?${new URLSearchParams({ ...(q && { q }), ...(type !== "all" && { type }) })}`, {
        scroll: false,
      });
      if (!q) {
        setState({ status: "idle", results: [] });
        return;
      }
      setState((s) => ({ ...s, status: "loading" }));
      try {
        const res = await fetch(`/api/search?${new URLSearchParams({ q, type, lang, ...(kids && { kids: "1" }) })}`);
        const data = (await res.json()) as { results: TitleSummary[] };
        setState({ status: res.ok ? "done" : "error", results: data.results ?? [] });
      } catch {
        setState({ status: "error", results: [] });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query, type, lang, kids, router]);

  return (
    <>
      <input
        type="search"
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("Search movies & series…")}
        aria-label={t("Search")}
        className="w-full border-b border-line bg-transparent pb-3 text-3xl font-semibold tracking-tight outline-none placeholder:text-muted/50 focus:border-white/60 sm:text-5xl"
      />
      <div className="mb-8 mt-5 flex gap-2">
        {TYPES.map((type_) => (
          <button
            key={type_.value}
            type="button"
            onClick={() => setType(type_.value)}
            aria-pressed={type === type_.value}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              type === type_.value ? "border-accent bg-accent text-accent-ink" : "border-line text-muted hover:text-foreground"
            }`}
          >
            {t(type_.label)}
          </button>
        ))}
      </div>

      {state.status === "idle" && (
        <p className="text-muted">{t("Search movies and series by title.")}</p>
      )}
      {state.status === "error" && <p className="text-muted">{t("Search is unavailable right now. Try again in a moment.")}</p>}
      {state.status === "done" && state.results.length === 0 && (
        <p className="text-muted">{t("No titles match “{query}”.", { query })}</p>
      )}
      <div className={state.status === "loading" ? "opacity-50 transition-opacity" : "transition-opacity"}>
        <Grid titles={state.results} lang={lang} />
      </div>
    </>
  );
}
