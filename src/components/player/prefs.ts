"use client";

import { useSyncExternalStore } from "react";

export type CaptionEdge = "none" | "shadow" | "raised" | "depressed" | "outline";

export interface CaptionStyle {
  /** Multiplier of the base caption size. */
  size: number;
  color: string;
  font: "sans" | "serif" | "mono" | "display" | "casual";
  edge: CaptionEdge;
  background: string;
  /** 0 to 1 */
  backgroundOpacity: number;
  /** Seconds the captions are shifted by; positive shows them later. */
  delay: number;
}

export interface PlayerPrefs {
  volume: number;
  muted: boolean;
  /** Preferred caption language, "off", or null to follow the browser. */
  captionLang: string | null;
  caption: CaptionStyle;
}

export const DEFAULT_CAPTION: CaptionStyle = {
  size: 1,
  color: "#ffffff",
  font: "sans",
  edge: "shadow",
  background: "#000000",
  backgroundOpacity: 0,
  delay: 0,
};

const DEFAULTS: PlayerPrefs = { volume: 1, muted: false, captionLang: null, caption: DEFAULT_CAPTION };

const KEY = "watchit:player";
const EVENT = "watchit:player";

let cached: { raw: string | null; value: PlayerPrefs } | null = null;

function read(): PlayerPrefs {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    // Storage blocked: use the defaults.
  }
  if (cached && cached.raw === raw) return cached.value;
  let value = DEFAULTS;
  try {
    if (raw) {
      const saved = JSON.parse(raw) as Partial<PlayerPrefs>;
      value = { ...DEFAULTS, ...saved, caption: { ...DEFAULT_CAPTION, ...saved.caption } };
    }
  } catch {
    value = DEFAULTS;
  }
  cached = { raw, value };
  return value;
}

export function setPrefs(change: Partial<PlayerPrefs>) {
  const next = { ...read(), ...change };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Keep the change for this page only.
    cached = { raw: cached?.raw ?? null, value: next };
  }
  window.dispatchEvent(new Event(EVENT));
}

export const setCaptionStyle = (change: Partial<CaptionStyle>) => setPrefs({ caption: { ...read().caption, ...change } });

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export const usePrefs = () => useSyncExternalStore(subscribe, read, () => DEFAULTS);
