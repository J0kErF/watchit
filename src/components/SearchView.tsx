"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Kind, TitleSummary } from "@/lib/types";
import { Grid } from "./Row";

const TYPES: { value: Kind | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "movie", label: "Movies" },
  { value: "series", label: "Series" },
];

type State = { status: "idle" | "loading" | "done" | "error"; results: TitleSummary[] };

export function SearchView() {
  const router = useRouter();
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
        const res = await fetch(`/api/search?${new URLSearchParams({ q, type })}`);
        const data = (await res.json()) as { results: TitleSummary[] };
        setState({ status: res.ok ? "done" : "error", results: data.results ?? [] });
      } catch {
        setState({ status: "error", results: [] });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query, type, router]);

  return (
    <>
      <input
        type="search"
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search classic movies & series…"
        aria-label="Search"
        className="w-full border-b border-line bg-transparent pb-3 font-display text-4xl outline-none placeholder:text-muted/60 focus:border-accent sm:text-6xl"
      />
      <div className="mb-8 mt-5 flex gap-2">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            aria-pressed={type === t.value}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              type === t.value ? "border-accent bg-accent text-accent-ink" : "border-line text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {state.status === "idle" && (
        <p className="text-muted">Try “Chaplin”, “noir”, “Sherlock” or “western”.</p>
      )}
      {state.status === "error" && <p className="text-muted">Search is unavailable right now. Try again in a moment.</p>}
      {state.status === "done" && state.results.length === 0 && (
        <p className="text-muted">No public-domain titles match “{query}”.</p>
      )}
      <div className={state.status === "loading" ? "opacity-50 transition-opacity" : "transition-opacity"}>
        <Grid titles={state.results} />
      </div>
    </>
  );
}
