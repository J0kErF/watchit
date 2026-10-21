"use client";

import { type RefObject, useEffect, useState } from "react";
import { languageName } from "@/lib/languages";

const CHUNK_SECONDS = 30;
const MAX_IN_FLIGHT = 2;
const RETRY_AFTER_MS = 30_000;

export type SubtitleStatus =
  | { state: "off" }
  | { state: "loading" }
  | { state: "ready" }
  | { state: "error"; code: string; message: string };

interface Cue {
  start: number;
  end: number;
  text: string;
}

interface TrackState {
  track: TextTrack;
  loaded: Set<number>;
  pending: Set<number>;
  failed: Map<number, { at: number; code: string; message: string }>;
}

// One generated track per language per <video> element; the element is remounted for each source.
const tracks = new WeakMap<HTMLVideoElement, Map<string, TrackState>>();

function trackFor(video: HTMLVideoElement, lang: string): TrackState {
  let byLang = tracks.get(video);
  if (!byLang) tracks.set(video, (byLang = new Map()));
  let state = byLang.get(lang);
  if (!state) {
    const track = video.addTextTrack("subtitles", `${languageName(lang)} (AI)`, lang === "original" ? "" : lang);
    state = { track, loaded: new Set(), pending: new Set(), failed: new Map() };
    byLang.set(lang, state);
  }
  return state;
}

/**
 * Streams AI-generated subtitles into a native text track: fetches the 30-second window
 * being watched plus the next one, so captions are ready before playback reaches them.
 */
export function useSubtitles(
  videoRef: RefObject<HTMLVideoElement | null>,
  opts: { titleId: string; ep: number; videoKey: string; lang: string | null },
): SubtitleStatus {
  const { titleId, ep, videoKey, lang } = opts;
  const [status, setStatus] = useState<SubtitleStatus>({ state: "off" });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    for (const s of tracks.get(video)?.values() ?? []) s.track.mode = "disabled";
    if (!lang) return;

    const state = trackFor(video, lang);
    state.track.mode = "showing";
    let active = true;

    const report = () => {
      if (!active) return;
      const chunk = Math.floor(video.currentTime / CHUNK_SECONDS);
      const failure = state.failed.get(chunk);
      setStatus((prev) => {
        const next: SubtitleStatus = state.loaded.has(chunk)
          ? { state: "ready" }
          : failure
            ? { state: "error", code: failure.code, message: failure.message }
            : { state: "loading" };
        return prev.state === next.state && (next.state !== "error" || (prev.state === "error" && prev.code === next.code))
          ? prev
          : next;
      });
    };

    const request = async (chunk: number) => {
      if (chunk < 0 || state.loaded.has(chunk) || state.pending.has(chunk)) return;
      if (Number.isFinite(video.duration) && chunk * CHUNK_SECONDS >= video.duration) return;
      const failure = state.failed.get(chunk);
      if (failure && Date.now() - failure.at < RETRY_AFTER_MS) return;
      if (state.pending.size >= MAX_IN_FLIGHT) return;

      state.pending.add(chunk);
      report();
      try {
        const qs = new URLSearchParams({ id: titleId, ep: String(ep), chunk: String(chunk), lang });
        const res = await fetch(`/api/subtitles?${qs}`);
        const data = (await res.json()) as { cues?: Cue[]; error?: string; message?: string };
        if (!res.ok) throw Object.assign(new Error(data.message ?? "Subtitles failed"), { code: data.error ?? "failed" });
        for (const c of data.cues ?? []) {
          state.track.addCue(new VTTCue(c.start, Math.max(c.end, c.start + 0.8), c.text));
        }
        state.loaded.add(chunk);
        state.failed.delete(chunk);
      } catch (err) {
        const e = err as Error & { code?: string };
        state.failed.set(chunk, { at: Date.now(), code: e.code ?? "network", message: e.message });
      } finally {
        state.pending.delete(chunk);
        report();
        if (active) tick();
      }
    };

    const tick = () => {
      if (video.seeking) return;
      const chunk = Math.floor(video.currentTime / CHUNK_SECONDS);
      void request(chunk);
      // Stay one window ahead of playback once the current window is under way.
      if (state.loaded.has(chunk) || state.pending.has(chunk)) void request(chunk + 1);
      report();
    };

    // Wait for scrubbing to settle before requesting, so seeking doesn't fan out into paid requests.
    let seekTimer: ReturnType<typeof setTimeout> | undefined;
    const onSeeked = () => {
      clearTimeout(seekTimer);
      seekTimer = setTimeout(tick, 500);
    };

    video.addEventListener("timeupdate", tick);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("loadedmetadata", tick);
    tick();

    return () => {
      active = false;
      clearTimeout(seekTimer);
      video.removeEventListener("timeupdate", tick);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("loadedmetadata", tick);
    };
  }, [videoRef, titleId, ep, videoKey, lang]);

  return lang ? status : { state: "off" };
}
