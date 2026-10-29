"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { Episode, Kind } from "./types";

export interface SavedTitle {
  id: string;
  kind: Kind;
  title: string;
  poster: string;
  /** Landscape artwork for Continue watching. */
  backdrop?: string;
  year?: number;
  /** When it was added to My List (ms), for the new episode badge. */
  addedAt?: number;
}

export interface Progress extends SavedTitle {
  ep: number;
  /** "S2 E5" for episodes with season numbers. */
  epLabel?: string;
  epTitle?: string;
  time: number;
  duration: number;
  updatedAt: number;
}

const LIST_KEY = "watchit:list";
const PROGRESS_KEY = "watchit:progress";
const WATCHED_KEY = "watchit:watched";
const EVENT = "watchit:library";

const cache = new Map<string, { raw: string | null; value: unknown }>();

function read<T>(key: string, fallback: T): T {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    // Storage blocked (private mode, disabled cookies): behave as empty.
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  let value: T = fallback;
  try {
    if (raw) value = JSON.parse(raw) as T;
  } catch {
    value = fallback;
  }
  cache.set(key, { raw, value });
  return value;
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota or blocked storage.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

const EMPTY_LIST: SavedTitle[] = [];
const EMPTY_PROGRESS: Record<string, Progress> = {};
const EMPTY_WATCHED: Record<string, string[]> = {};

export function useWatchlist() {
  return useSyncExternalStore(
    subscribe,
    () => read(LIST_KEY, EMPTY_LIST),
    () => EMPTY_LIST,
  );
}

export function useProgress() {
  return useSyncExternalStore(
    subscribe,
    () => read(PROGRESS_KEY, EMPTY_PROGRESS),
    () => EMPTY_PROGRESS,
  );
}

export function toggleWatchlist(title: SavedTitle) {
  const list = read(LIST_KEY, EMPTY_LIST);
  const next = list.some((t) => t.id === title.id)
    ? list.filter((t) => t.id !== title.id)
    : [{ ...title, addedAt: Date.now() }, ...list];
  write(LIST_KEY, next);
}

/**
 * Series with an episode that aired after `since` (ms): the last time it was watched, or when it was
 * saved. Checked once per set of series.
 */
export function useNewEpisodes(entries: { id: string; since?: number }[]) {
  const [aired, setAired] = useState<Record<string, string>>({});
  const ids = [...new Set(entries.filter((e) => e.since && e.id.startsWith("tmdb-tv-")).map((e) => e.id))].sort().join(",");

  useEffect(() => {
    if (!ids) return;
    const controller = new AbortController();
    fetch(`/api/new-episodes?ids=${ids}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: Record<string, string>) => setAired(data))
      .catch(() => {});
    return () => controller.abort();
  }, [ids]);

  // Air dates are days, so an episode counts as new when it aired on a later day than `since`.
  const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  return new Set(entries.filter((e) => e.since && aired[e.id] && aired[e.id] > day(e.since)).map((e) => e.id));
}

export function getProgress(id: string): Progress | undefined {
  return read(PROGRESS_KEY, EMPTY_PROGRESS)[id];
}

export function saveProgress(p: Progress) {
  const all = read(PROGRESS_KEY, EMPTY_PROGRESS);
  write(PROGRESS_KEY, { ...all, [p.id]: p });
}

export function clearProgress(id: string) {
  const next = { ...read(PROGRESS_KEY, EMPTY_PROGRESS) };
  delete next[id];
  write(PROGRESS_KEY, next);
}

/**
 * Watched episodes are kept by season and number ("2x5"), not list position, so the marks stay put
 * when new episodes are added.
 */
export const episodeKey = (e: Pick<Episode, "index" | "season" | "number">) => `${e.season ?? 1}x${e.number ?? e.index + 1}`;

/** The episode keys of a series marked watched. */
export function useWatched(titleId: string): Set<string> {
  const all = useSyncExternalStore(
    subscribe,
    () => read(WATCHED_KEY, EMPTY_WATCHED),
    () => EMPTY_WATCHED,
  );
  const keys = all[titleId];
  return useMemo(() => new Set(keys), [keys]);
}

/** Marks episodes of a series watched or not watched. */
export function setWatched(titleId: string, keys: string[], watched: boolean) {
  const all = read(WATCHED_KEY, EMPTY_WATCHED);
  const current = new Set(all[titleId]);
  if (keys.every((key) => current.has(key) === watched)) return;
  for (const key of keys) {
    if (watched) current.add(key);
    else current.delete(key);
  }
  const next = { ...all, [titleId]: [...current] };
  if (current.size === 0) delete next[titleId];
  write(WATCHED_KEY, next);
}
