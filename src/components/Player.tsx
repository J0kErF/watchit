"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { preconnect } from "react-dom";
import { episodeKey, getProgress, saveProgress, setWatched } from "@/lib/library";
import { formatDuration } from "@/lib/format";
import type { Source, TitleDetail } from "@/lib/types";
import { useLang, useT } from "./LangProvider";
import { useEmbedPlayer, type EmbedEvent } from "./player/embedControl";
import { VideoPlayer, type PlayerServer } from "./player/VideoPlayer";

// The site accent (--accent), for the embedded player's controls.
const EMBED_THEME = "ffb238";
const EMBED_KEY = "embed";
/** Seconds the arrow keys skip in the embedded player, as in the built-in one. */
const SKIP = 15;

const sourceKey = (s: Source, i: number) => `source:${i}:${s.label}`;

/**
 * The watch screen. Episodes with direct sources play in the built-in player, with the embed host as
 * the last server; the rest play from the embed host.
 */
export function Player({
  title,
  initialEp,
  embedUrl,
  initialSources,
  sourcesEnabled,
}: {
  title: TitleDetail;
  initialEp: number;
  embedUrl: string;
  /** Direct sources for `initialEp`. */
  initialSources: Source[];
  /** Whether the site has a source API, so other episodes are worth looking up. */
  sourcesEnabled: boolean;
}) {
  preconnect(embedUrl);
  const lang = useLang();
  const t = useT();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [ep, setEp] = useState(() => Math.min(Math.max(initialEp, 0), title.episodes.length - 1));
  const [loaded, setLoaded] = useState<{ ep: number; sources: Source[] }>(() => ({ ep, sources: initialSources }));
  // The server the viewer picked, kept across episodes when the next one has it too.
  const [chosen, setChosen] = useState<string | null>(null);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const episode = title.episodes[ep];
  const next = title.episodes[ep + 1];
  const seasonLabel =
    episode.season && episode.number ? t("S{season} E{episode}", { season: episode.season, episode: episode.number }) : undefined;
  const src = embedUrl + episode.path;
  const lastSave = useRef(0);
  // The embedded player's last reported position, for switching servers mid-episode.
  const lastTime = useRef(0);

  const ready = loaded.ep === ep || !sourcesEnabled;
  const sources = loaded.ep === ep ? loaded.sources : [];
  const servers: PlayerServer[] = [
    ...sources.map((s, i) => ({ key: sourceKey(s, i), label: s.label })),
    { key: EMBED_KEY, label: sources.length ? "Embedded player" : new URL(embedUrl).hostname },
  ];
  const server = servers.find((s) => s.key === chosen)?.key ?? servers[0].key;
  const source = sources.find((s, i) => sourceKey(s, i) === server);

  // Direct sources for episodes after the first one.
  useEffect(() => {
    if (!sourcesEnabled || loaded.ep === ep) return;
    const ctrl = new AbortController();
    fetch(`/api/sources/${title.id}?ep=${ep}`, { signal: ctrl.signal })
      .then((res) => (res.ok ? res.json() : []))
      .catch(() => [])
      .then((list: Source[]) => {
        if (!ctrl.signal.aborted) setLoaded({ ep, sources: Array.isArray(list) ? list : [] });
      });
    return () => ctrl.abort();
  }, [ep, loaded.ep, sourcesEnabled, title.id]);

  // Resume where the viewer left off, once per episode load, or where they were when switching servers.
  const resumeAt = useRef<number | null>(null);
  useEffect(() => {
    const saved = getProgress(title.id);
    resumeAt.current = saved && saved.ep === ep && saved.time / saved.duration < 0.95 ? saved.time : null;
  }, [ep, title.id]);

  const switchServer = (key: string, time: number) => {
    resumeAt.current = time;
    setChosen(key);
  };

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
  }, [src, server, ready]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (title.kind === "series") url.searchParams.set("ep", String(ep));
    window.history.replaceState(null, "", url);
  }, [ep, title.kind]);

  const persist = (time: number, duration: number) => {
    if (!duration || !Number.isFinite(duration)) return;
    // Nine tenths in counts as watched; the credits rarely play to the end.
    if (title.kind === "series" && time / duration >= 0.9) setWatched(title.id, [episodeKey(episode)], true);
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

  // The embedded player's playback events keep Continue Watching and resume working.
  const onEmbedEvent = (update: EmbedEvent) => {
    if (source) return;
    const { event, currentTime: time, duration } = update;
    if (time !== undefined) lastTime.current = time;
    if (time !== undefined && duration) {
      if (event === "pause" || event === "ended") persist(time, duration);
      else persistThrottled(time, duration);
    }
    if ((event === "ended" || event === "complete") && next) setEp(ep + 1);
  };
  const embed = useEmbedPlayer(frameRef, embedUrl, onEmbedEvent);

  // Keyboard shortcuts for the embedded player, as in the built-in one. They work while this page
  // has focus; once the viewer clicks into the player, its own shortcuts take over.
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (source || !ready) return;
    const target = e.target as HTMLElement;
    if (e.ctrlKey || e.metaKey || e.altKey || target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
    if (target.tagName === "BUTTON" && (e.key === " " || e.key === "Enter")) return;
    const s = embed.status();
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    let handled = true;
    if (key === " " || key === "k") {
      if (s.playing) embed.pause();
      else embed.play();
    } else if (key === "ArrowLeft" || key === "j") embed.seek(s.currentTime - SKIP);
    else if (key === "ArrowRight" || key === "l") embed.seek(s.currentTime + SKIP);
    else if (key === "ArrowUp" || key === "ArrowDown") {
      if (s.muted) embed.setMuted(false);
      embed.setVolume((s.muted ? 0 : s.volume) + (key === "ArrowUp" ? 0.1 : -0.1));
    } else if (key === "m") embed.setMuted(!s.muted);
    else if (key === "n" && next) setEp(ep + 1);
    else if (key === "Home") embed.seek(0);
    else if (key === "End" && s.duration) embed.seek(s.duration);
    else if (/^[0-9]$/.test(key) && s.duration) embed.seek((Number(key) / 10) * s.duration);
    else handled = false;
    if (handled) e.preventDefault();
  });

  useEffect(() => {
    const listener = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  const heading = title.title;
  const subheading = title.kind === "series" ? `${seasonLabel ?? t("Episode {n}", { n: ep + 1 })} · ${episode.title}` : undefined;

  const episodesPanel = showEpisodes && (
    <aside className="fixed inset-y-0 end-0 z-[80] flex w-full max-w-sm flex-col border-s border-line bg-surface/95 backdrop-blur">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="text-xl font-semibold">{t("Episodes")}</h2>
        <button type="button" onClick={() => setShowEpisodes(false)} className="text-2xl text-muted hover:text-foreground" aria-label={t("Close episodes")}>
          ×
        </button>
      </div>
      <ol className="flex-1 overflow-y-auto">
        {title.episodes.map((e, i) => (
          <li key={e.path}>
            {e.season && e.season !== title.episodes[i - 1]?.season && (
              <p className="px-5 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted">{t("Season {n}", { n: e.season })}</p>
            )}
            <button
              type="button"
              onClick={() => {
                setEp(e.index);
                setShowEpisodes(false);
              }}
              className={`flex w-full items-baseline gap-3 px-5 py-3 text-start text-sm transition hover:bg-surface-2 ${
                e.index === ep ? "text-accent" : ""
              }`}
            >
              <span className="w-6 shrink-0 text-muted tabular-nums">{e.number ?? e.index + 1}</span>
              <span className="flex-1">{e.title}</span>
              <span className="shrink-0 text-xs text-muted">{formatDuration(e.duration, lang)}</span>
            </button>
          </li>
        ))}
      </ol>
    </aside>
  );

  if (!ready) {
    return (
      <div className="fixed inset-0 z-[70] grid place-items-center bg-black">
        <span className="h-16 w-16 animate-spin rounded-full border-4 border-white/20 border-t-accent" aria-label="Loading" />
      </div>
    );
  }

  if (source) {
    return (
      <>
        <VideoPlayer
          key={`${ep}:${server}`}
          source={source}
          heading={heading}
          subheading={subheading}
          description={title.kind === "series" ? (episode.overview ?? title.description) : title.description}
          backHref={`/title/${title.id}`}
          poster={episode.still ?? title.backdrop}
          getStartAt={() => resumeAt.current}
          next={
            next
              ? {
                  label: next.season && next.number ? `S${next.season} E${next.number}` : `Episode ${next.index + 1}`,
                  title: next.title,
                  still: next.still,
                  onPlay: () => setEp(ep + 1),
                }
              : undefined
          }
          servers={servers}
          server={server}
          onServer={switchServer}
          onEpisodes={title.kind === "series" ? () => setShowEpisodes((s) => !s) : undefined}
          onProgress={(time, duration, final) => (final ? persist(time, duration) : persistThrottled(time, duration))}
        />
        {episodesPanel}
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black">
      <div className="relative z-10 flex items-center gap-4 bg-gradient-to-b from-black/90 to-transparent px-4 py-4 sm:px-8">
        <Link
          href={`/title/${title.id}`}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
          aria-label={t("Back to details")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="rtl:-scale-x-100">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold sm:text-xl">{heading}</p>
          {subheading && <p className="truncate text-xs text-muted sm:text-sm">{subheading}</p>}
        </div>
        {servers.length > 1 && (
          <select
            aria-label="Server"
            value={server}
            onChange={(e) => switchServer(e.target.value, lastTime.current || (resumeAt.current ?? 0))}
            className="shrink-0 rounded-full bg-white/10 px-4 py-2 text-sm outline-none transition hover:bg-white/20"
          >
            {servers.map((s) => (
              <option key={s.key} value={s.key} className="bg-surface">
                {s.label}
              </option>
            ))}
          </select>
        )}
        {title.kind === "series" && (
          <button
            type="button"
            onClick={() => setShowEpisodes((s) => !s)}
            className="shrink-0 rounded-full bg-white/10 px-4 py-2 text-sm transition hover:bg-white/20"
          >
            {t("Episodes")}
          </button>
        )}
      </div>

      <iframe
        key={src}
        ref={frameRef}
        title={subheading ? `${heading} · ${episode.title}` : heading}
        // Allow scripts, forms, and media, but EXCLUDE 'allow-popups' and 'allow-top-navigation'
        sandbox="allow-scripts allow-same-origin allow-presentation allow-encrypted-media"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        scrolling="no"
        className="w-full flex-1 border-0"
        onLoad={() => {
          embed.reset();
          embed.requestStatus();
        }}
      />

      {next && (
        <button
          type="button"
          onClick={() => setEp(ep + 1)}
          className="absolute bottom-20 end-4 z-10 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink shadow-lg transition hover:brightness-110 sm:end-8"
        >
          {t("Next episode →")}
        </button>
      )}

      {episodesPanel}
    </div>
  );
}
