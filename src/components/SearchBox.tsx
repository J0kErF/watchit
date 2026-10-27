"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import type { TitleSummary } from "@/lib/types";
import { useKids, useLang, useT } from "./LangProvider";

const MAX_SUGGESTIONS = 6;

/** The navbar search field, with title suggestions while typing. Enter opens the full results. */
export function SearchBox() {
  const router = useRouter();
  const lang = useLang();
  const kids = useKids();
  const title = useT();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TitleSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const q = query.trim();
    // Shorter queries hide the list (see showList), so old suggestions can stay in state.
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const query = new URLSearchParams({ q, lang, ...(kids && { kids: "1" }) });
        const res = await fetch(`/api/search?${query}`, { signal: controller.signal });
        const data = (await res.json()) as { results?: TitleSummary[] };
        setResults((data.results ?? []).slice(0, MAX_SUGGESTIONS));
        setActive(-1);
      } catch {
        // Aborted by a newer query, or offline: keep the last suggestions.
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, lang, kids]);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(href);
  };

  const showList = open && query.trim().length >= 2 && results.length > 0;

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (active >= 0 && results[active]) go(`/title/${results[active].id}`);
        else go(`/search?q=${encodeURIComponent(query.trim())}`);
      }}
      className="relative"
    >
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          if (!showList) return;
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            // -1 is the field itself; the arrows wrap around through it.
            const last = results.length - 1;
            if (e.key === "ArrowDown") setActive((i) => (i >= last ? -1 : i + 1));
            else setActive((i) => (i <= -1 ? last : i - 1));
          }
        }}
        placeholder={title("Search titles")}
        aria-label={title("Search titles")}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        className="w-44 rounded-md border border-white/20 bg-black/50 px-3.5 py-1.5 text-sm outline-none transition-[width,border-color] placeholder:text-muted focus:w-60 focus:border-white/70 lg:w-56 lg:focus:w-72"
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          // Keep focus in the field while clicking a suggestion, so blur doesn't close the list first.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute end-0 top-full mt-2 w-80 overflow-hidden rounded-md border border-white/10 bg-background/95 py-1 shadow-xl shadow-black/50 backdrop-blur"
        >
          {results.map((t, i) => (
            <li key={t.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
              <Link
                href={`/title/${t.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  go(`/title/${t.id}`);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex items-center gap-3 px-3 py-2 ${i === active ? "bg-white/10" : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.poster} alt="" className="h-14 w-10 shrink-0 rounded-sm bg-surface-2 object-cover" />
                <span className="min-w-0">
                  <span className="line-clamp-1 text-sm font-medium">{t.title}</span>
                  <span className="text-xs text-muted">
                    {[title(t.kind === "series" ? "Series" : "Movie"), t.year].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </Link>
            </li>
          ))}
          <li className="border-t border-white/10">
            <Link
              href={`/search?q=${encodeURIComponent(query.trim())}`}
              onClick={(e) => {
                e.preventDefault();
                go(`/search?q=${encodeURIComponent(query.trim())}`);
              }}
              className="block px-3 py-2 text-sm text-accent hover:bg-white/10"
            >
              {title("See all results for “{query}”", { query: query.trim() })}
            </Link>
          </li>
        </ul>
      )}
    </form>
  );
}
