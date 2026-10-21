"use client";

import { useMemo, useState } from "react";
import { LANGUAGE_CODES, languageName, normalizeLanguage, ORIGINAL, QUICK_LANGUAGES } from "@/lib/languages";

export function SubtitleMenu({
  value,
  onChange,
  onClose,
}: {
  value: string | null;
  onChange: (lang: string | null) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const locale = typeof navigator === "undefined" ? "en" : navigator.language;

  const all = useMemo(
    () =>
      LANGUAGE_CODES.map((code) => ({ code, name: languageName(code, locale), english: languageName(code) })).sort((a, b) =>
        a.name.localeCompare(b.name, locale),
      ),
    [locale],
  );

  const q = query.trim().toLowerCase();
  const matches = q
    ? all.filter((l) => l.name.toLowerCase().includes(q) || l.english.toLowerCase().includes(q) || l.code.toLowerCase() === q)
    : all.filter((l) => QUICK_LANGUAGES.includes(l.code));
  // Let people type any other BCP-47 code, e.g. "yue" or "es-MX".
  const typed = normalizeLanguage(query.trim());
  const custom = typed && typed !== ORIGINAL && !matches.some((l) => l.code === typed) ? typed : null;

  const option = (lang: string | null, label: string, hint?: string) => (
    <li key={lang ?? "off"}>
      <button
        type="button"
        onClick={() => {
          onChange(lang);
          onClose();
        }}
        aria-pressed={value === lang}
        className={`flex w-full items-center justify-between gap-3 px-5 py-2.5 text-left text-sm transition hover:bg-surface-2 ${
          value === lang ? "text-accent" : ""
        }`}
      >
        <span>{label}</span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </button>
    </li>
  );

  return (
    <aside className="absolute inset-y-0 right-0 z-20 flex w-full max-w-sm flex-col border-l border-line bg-surface/95 backdrop-blur">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <h2 className="font-display text-2xl">Subtitles</h2>
          <p className="text-xs text-muted">Generated live from the audio by AI</p>
        </div>
        <button type="button" onClick={onClose} className="text-2xl text-muted hover:text-foreground" aria-label="Close subtitles">
          ×
        </button>
      </div>
      <div className="border-b border-line px-5 py-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search any language…"
          aria-label="Search languages"
          className="w-full rounded-full border border-line bg-background px-4 py-2 text-sm outline-none placeholder:text-muted focus:border-accent"
        />
      </div>
      <ul className="flex-1 overflow-y-auto py-2">
        {!q && option(null, "Off")}
        {!q && option(ORIGINAL, "Original language", "no translation")}
        {!q && <li className="px-5 pb-1 pt-3 text-xs uppercase tracking-wider text-muted">Translate to</li>}
        {matches.map((l) => option(l.code, l.name, l.name !== l.english ? l.english : undefined))}
        {custom && option(custom, languageName(custom, locale), custom)}
        {q && matches.length === 0 && !custom && <li className="px-5 py-3 text-sm text-muted">No language matches “{query}”.</li>}
      </ul>
    </aside>
  );
}
