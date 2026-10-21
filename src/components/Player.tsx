"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getProgress, saveProgress } from "@/lib/library";
import { formatDuration } from "@/lib/format";
import type { TitleDetail } from "@/lib/types";

export function Player({ title, initialEp }: { title: TitleDetail; initialEp: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ep, setEp] = useState(() => Math.min(Math.max(initialEp, 0), title.episodes.length - 1));
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const episode = title.episodes[ep];
  const next = title.episodes[ep + 1];
  // Some Archive originals use codecs browsers can't decode; step through the other encodes.
  const sources = [episode.src, ...episode.fallbacks];
  const [attempt, setAttempt] = useState({ src: episode.src, index: 0 });
  const sourceIndex = attempt.src === episode.src ? attempt.index : 0;
  const videoSrc = sources[sourceIndex];
  const lastSave = useRef(0);

  // Resume where the viewer left off, once per episode load.
  const resumeAt = useRef<number | null>(null);
  useEffect(() => {
    const saved = getProgress(title.id);
    resumeAt.current = saved && saved.ep === ep && saved.time / saved.duration < 0.95 ? saved.time : null;
  }, [ep, title.id]);

  const tryNextSource = () => {
    if (sourceIndex + 1 < sources.length) setAttempt({ src: episode.src, index: sourceIndex + 1 });
    else setFailedSrc(episode.src);
  };

  // The server-rendered <video> starts loading before hydration, so its first
  // loadedmetadata/error events can fire before React's handlers are attached.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.error) tryNextSource();
    else if (v.readyState >= 1 && resumeAt.current) v.currentTime = resumeAt.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoSrc]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (title.kind === "series") url.searchParams.set("ep", String(ep));
    window.history.replaceState(null, "", url);
  }, [ep, title.kind]);

  const persist = () => {
    const v = videoRef.current;
    if (!v || !v.duration || !Number.isFinite(v.duration)) return;
    saveProgress({
      id: title.id,
      kind: title.kind,
      title: title.title,
      poster: title.poster,
      year: title.year,
      ep,
      epTitle: title.kind === "series" ? episode.title : undefined,
      time: v.currentTime,
      duration: v.duration,
      updatedAt: Date.now(),
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black">
      <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-4 bg-gradient-to-b from-black/90 to-transparent px-4 py-4 sm:px-8">
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
          <p className="truncate font-display text-xl sm:text-2xl">{title.title}</p>
          {title.kind === "series" && (
            <p className="truncate text-xs text-muted sm:text-sm">
              Episode {ep + 1} · {episode.title}
            </p>
          )}
        </div>
        {title.kind === "series" && (
          <button
            type="button"
            onClick={() => setShowList((s) => !s)}
            className="shrink-0 rounded-full bg-white/10 px-4 py-2 text-sm transition hover:bg-white/20"
          >
            Episodes
          </button>
        )}
      </div>

      <video
        key={videoSrc}
        ref={videoRef}
        src={videoSrc}
        poster={title.backdrop}
        controls
        autoPlay
        playsInline
        preload="metadata"
        className="h-full w-full"
        onLoadedMetadata={(e) => {
          if (resumeAt.current) e.currentTarget.currentTime = resumeAt.current;
        }}
        onTimeUpdate={() => {
          const now = Date.now();
          if (now - lastSave.current > 5000) {
            lastSave.current = now;
            persist();
          }
        }}
        onPause={persist}
        onEnded={() => {
          persist();
          if (next) setEp(ep + 1);
        }}
        onError={tryNextSource}
      />

      {failedSrc === episode.src && (
        <div className="absolute inset-0 grid place-items-center bg-black/80 p-6 text-center">
          <div>
            <p className="font-display text-2xl">This video couldn’t be played in your browser.</p>
            <p className="mt-2 text-sm text-muted">
              You can still{" "}
              <a href={episode.src} className="text-accent underline-offset-4 hover:underline">
                open the file directly
              </a>{" "}
              or{" "}
              <a href={`https://archive.org/details/${title.id}`} className="text-accent underline-offset-4 hover:underline">
                watch it on the Internet Archive
              </a>
              .
            </p>
          </div>
        </div>
      )}

      {next && (
        <button
          type="button"
          onClick={() => setEp(ep + 1)}
          className="absolute bottom-20 right-4 z-10 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink shadow-lg transition hover:brightness-110 sm:right-8"
        >
          Next episode →
        </button>
      )}

      {showList && (
        <aside className="absolute inset-y-0 right-0 z-20 flex w-full max-w-sm flex-col border-l border-line bg-surface/95 backdrop-blur">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-display text-2xl">Episodes</h2>
            <button type="button" onClick={() => setShowList(false)} className="text-2xl text-muted hover:text-foreground" aria-label="Close episodes">
              ×
            </button>
          </div>
          <ol className="flex-1 overflow-y-auto">
            {title.episodes.map((e) => (
              <li key={e.src}>
                <button
                  type="button"
                  onClick={() => {
                    setEp(e.index);
                    setShowList(false);
                  }}
                  className={`flex w-full items-baseline gap-3 px-5 py-3 text-left text-sm transition hover:bg-surface-2 ${
                    e.index === ep ? "text-accent" : ""
                  }`}
                >
                  <span className="w-6 shrink-0 text-muted tabular-nums">{e.index + 1}</span>
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
