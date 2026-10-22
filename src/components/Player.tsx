"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { getProgress, saveProgress } from "@/lib/library";
import { formatDuration } from "@/lib/format";
import type { TitleDetail } from "@/lib/types";

// The site accent (--accent), for the embedded player's controls.
const EMBED_THEME = "e50914";

export function Player({ title, initialEp, embedUrl }: { title: TitleDetail; initialEp: number; embedUrl: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [ep, setEp] = useState(() => Math.min(Math.max(initialEp, 0), title.episodes.length - 1));
  const [showEpisodes, setShowEpisodes] = useState(false);
  const episode = title.episodes[ep];
  const next = title.episodes[ep + 1];
  const seasonLabel = episode.season && episode.number ? `S${episode.season} E${episode.number}` : undefined;
  const src = embedUrl + episode.path;
  const lastSave = useRef(0);

  // Resume where the viewer left off, once per episode load.
  const resumeAt = useRef<number | null>(null);
  useEffect(() => {
    const saved = getProgress(title.id);
    resumeAt.current = saved && saved.ep === ep && saved.time / saved.duration < 0.95 ? saved.time : null;
  }, [ep, title.id]);

  // The embedded player takes its start time as a URL parameter, which comes from localStorage,
  // so the URL is set after hydration, once per episode.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const url = new URL(src);
    url.search = new URLSearchParams({
      autoPlay: "true",
      title: "false",
      theme: EMBED_THEME,
      nextButton: "false",
      autoNext: "false",
    }).toString();
    if (resumeAt.current) url.searchParams.set("startAt", String(Math.floor(resumeAt.current)));
    frame.src = url.href;
  }, [src]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (title.kind === "series") url.searchParams.set("ep", String(ep));
    window.history.replaceState(null, "", url);
  }, [ep, title.kind]);

  const persist = (time: number, duration: number) => {
    if (!duration || !Number.isFinite(duration)) return;
    saveProgress({
      id: title.id,
      kind: title.kind,
      title: title.title,
      poster: title.poster,
      backdrop: episode.still ?? title.backdrop,
      year: title.year,
      ep,
      epLabel: seasonLabel,
      epTitle: title.kind === "series" ? episode.title : undefined,
      time,
      duration,
      updatedAt: Date.now(),
    });
  };

  const persistThrottled = (time: number, duration: number) => {
    const now = Date.now();
    if (now - lastSave.current > 5000) {
      lastSave.current = now;
      persist(time, duration);
    }
  };

  const onPlayerMessage = useEffectEvent((e: MessageEvent) => {
    const host = new URL(embedUrl).hostname.replace(/^www\./, "");
    let origin: string;
    try {
      origin = new URL(e.origin).hostname;
    } catch {
      return;
    }
    if (origin !== host && !origin.endsWith(`.${host}`)) return;
    const update = readPlayerMessage(e.data);
    if (!update) return;
    if (update.time !== undefined && update.duration) {
      if (update.event === "pause" || update.event === "ended") persist(update.time, update.duration);
      else persistThrottled(update.time, update.duration);
    }
    if ((update.event === "ended" || update.event === "complete") && next) setEp(ep + 1);
  });

  useEffect(() => {
    const listener = (e: MessageEvent) => onPlayerMessage(e);
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black">
      <div className="relative z-10 flex items-center gap-4 bg-gradient-to-b from-black/90 to-transparent px-4 py-4 sm:px-8">
        <Link
          href={`/title/${title.id}`}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
          aria-label="Back to details"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold sm:text-xl">{title.title}</p>
          {title.kind === "series" && (
            <p className="truncate text-xs text-muted sm:text-sm">
              {seasonLabel ?? `Episode ${ep + 1}`} · {episode.title}
            </p>
          )}
        </div>
        {title.kind === "series" && (
          <button
            type="button"
            onClick={() => setShowEpisodes((s) => !s)}
            className="shrink-0 rounded-full bg-white/10 px-4 py-2 text-sm transition hover:bg-white/20"
          >
            Episodes
          </button>
        )}
      </div>

      <iframe
        key={src}
        ref={frameRef}
        title={title.kind === "series" ? `${title.title} · ${episode.title}` : title.title}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        scrolling="no"
        className="w-full flex-1 border-0"
      />

      {next && (
        <button
          type="button"
          onClick={() => setEp(ep + 1)}
          className="absolute bottom-20 right-4 z-10 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink shadow-lg transition hover:brightness-110 sm:right-8"
        >
          Next episode →
        </button>
      )}

      {showEpisodes && (
        <aside className="absolute inset-y-0 right-0 z-20 flex w-full max-w-sm flex-col border-l border-line bg-surface/95 backdrop-blur">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-xl font-semibold">Episodes</h2>
            <button type="button" onClick={() => setShowEpisodes(false)} className="text-2xl text-muted hover:text-foreground" aria-label="Close episodes">
              ×
            </button>
          </div>
          <ol className="flex-1 overflow-y-auto">
            {title.episodes.map((e, i) => (
              <li key={e.path}>
                {e.season && e.season !== title.episodes[i - 1]?.season && (
                  <p className="px-5 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted">Season {e.season}</p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setEp(e.index);
                    setShowEpisodes(false);
                  }}
                  className={`flex w-full items-baseline gap-3 px-5 py-3 text-left text-sm transition hover:bg-surface-2 ${
                    e.index === ep ? "text-accent" : ""
                  }`}
                >
                  <span className="w-6 shrink-0 text-muted tabular-nums">{e.number ?? e.index + 1}</span>
                  <span className="flex-1">{e.title}</span>
                  <span className="shrink-0 text-xs text-muted">{formatDuration(e.duration)}</span>
                </button>
              </li>
            ))}
          </ol>
        </aside>
      )}
    </div>
  );
}

/**
 * A playback update posted by the embedded player. Players differ in message shape, so this
 * accepts JSON strings, fields at the top level or under `data`, and the common field names.
 */
function readPlayerMessage(raw: unknown) {
  let msg = raw;
  if (typeof msg === "string") {
    try {
      msg = JSON.parse(msg);
    } catch {
      return null;
    }
  }
  if (!msg || typeof msg !== "object") return null;
  const outer = msg as Record<string, unknown>;
  const fields = (outer.data && typeof outer.data === "object" ? outer.data : outer) as Record<string, unknown>;
  const num = (...keys: string[]) =>
    keys.map((k) => fields[k]).find((v): v is number => typeof v === "number" && Number.isFinite(v));
  return {
    time: num("currentTime", "time", "timestamp", "position"),
    duration: num("duration"),
    event: String(fields.event ?? outer.event ?? "").toLowerCase(),
  };
}
