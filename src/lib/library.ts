"use client";

import { useSyncExternalStore } from "react";
import type { Kind } from "./types";

export interface SavedTitle {
  id: string;
  kind: Kind;
  title: string;
  poster: string;
  /** Landscape artwork for Continue watching. */
  backdrop?: string;
  year?: number;
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
    : [title, ...list];
  write(LIST_KEY, next);
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
