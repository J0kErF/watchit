// src/components/CleanCustomPlayer.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import ReactPlayer from "react-player";
import type { TitleDetail } from "@/lib/types";
import { formatDuration } from "@/lib/format";
import { getProgress, saveProgress } from "@/lib/library";

/**
 * Solid, ad‑free player that extracts the raw HLS manifest from Vidfast's embed page
 * (via the `/api/video-source` route) and feeds it to `react-player`.
 *
 * It mirrors the UX of the original Player component – episode navigation,
 * resume‑where‑you‑left‑off, and progress persistence – but completely avoids the
 * remote iframe, eliminating all pop‑under ads, redirects and malicious scripts.
 */
export default function CleanCustomPlayer({
  title,
  initialEp,
  embedUrl,
}: {
  title: TitleDetail;
  initialEp: number;
  embedUrl: string;
}) {
  // Episode selection state (same logic as original Player)
  const [ep, setEp] = useState(() =>
    Math.min(Math.max(initialEp, 0), title.episodes.length - 1),
  );
  const episode = title.episodes[ep];
  const next = title.episodes[ep + 1];
  const seasonLabel =
    episode.season && episode.number
      ? `S${episode.season} E${episode.number}`
      : undefined;

  // URL of the embed page (host + path) – we fetch this to extract the .m3u8 link.
  const embedPageUrl = embedUrl + episode.path;

  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Resume handling – same as original Player.
  const lastSave = useRef(0);
  const resumeAt = useRef<number | null>(null);
  useEffect(() => {
    const saved = getProgress(title.id);
    resumeAt.current =
      saved && saved.ep === ep && saved.time / saved.duration < 0.95
        ? saved.time
        : null;
  }, [ep, title.id]);

  // Fetch the clean HLS stream URL whenever the episode changes.
  useEffect(() => {
    setLoading(true);
    setStreamUrl(null);
    fetch(`/api/video-source?url=${encodeURIComponent(embedPageUrl)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.streamUrl) setStreamUrl(data.streamUrl);
        else console.error("Stream URL not found", data);
      })
      .catch((err) => console.error("Error fetching stream", err))
      .finally(() => setLoading(false));
  }, [embedPageUrl]);

  // Persist progress – identical to the original implementation.
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

  // React‑Player `onProgress` fires frequently – we use it for throttled saves.
  const handleProgress = (state: { playedSeconds: number; loadedSeconds: number }) => {
    const { playedSeconds, loadedSeconds } = state;
    // `loadedSeconds` is an approximation of the total duration.
    persistThrottled(playedSeconds, loadedSeconds);
  };

  // When the video ends, automatically advance to the next episode if available.
  const handleEnded = () => {
    if (next) setEp((e) => e + 1);
  };

  // UI ---------------------------------------------------------------------
  if (loading) {
    return (
      <div className="animate-pulse bg-neutral-900 aspect-video rounded-lg flex items-center justify-center text-white">
        Extracting secure stream…
      </div>
    );
  }

  if (!streamUrl) {
    return (
      <div className="text-center text-red-500 p-4">
        Unable to locate a clean video stream. Please try again later.
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black">
      {/* Controls & navigation (mirrors the original Player UI) */}
      <div className="absolute inset-0 z-10 flex items-center justify-between px-4 py-2">
        {/* Back button */}
        <a href={`/title/${title.id}`} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        </a>
        {/* Episode selector */}
        {title.kind === "series" && (
          <button
            type="button"
            onClick={() => setEp((e) => (e - 1 >= 0 ? e - 1 : e))}
            className="rounded-full bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20"
          >
            ◀ Prev
          </button>
        )}
        {title.kind === "series" && (
          <button
            type="button"
            onClick={() => setEp((e) => (e + 1 < title.episodes.length ? e + 1 : e))}
            className="rounded-full bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20"
          >
            Next ▶
          </button>
        )}
      </div>

      <ReactPlayer
        url={streamUrl}
        controls
        playing
        width="100%"
        height="100%"
        config={{ file: { forceHLS: true, hlsOptions: { lowLatencyMode: true } } }}
        // Start at the saved position if we have one.
        {...(resumeAt.current ? { startTime: Math.floor(resumeAt.current) } : {})}
        onProgress={handleProgress}
        onEnded={handleEnded}
      />
    </div>
  );
}
