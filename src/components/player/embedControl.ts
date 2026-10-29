"use client";

import { useEffect, useEffectEvent, useMemo, useRef, type RefObject } from "react";

/** A command the embedded player accepts over postMessage. */
export type EmbedCommand =
  | { command: "play"; time?: number }
  | { command: "pause"; time?: number }
  | { command: "seek"; time: number }
  | { command: "volume"; level: number }
  | { command: "mute"; muted: boolean }
  | { command: "getStatus" };

export type EmbedEventName = "play" | "pause" | "seeked" | "ended" | "timeupdate" | "playerstatus";

/** A playback event posted by the embedded player. */
export interface EmbedEvent {
  /** One of the documented names, or whatever another player calls it. */
  event: EmbedEventName | (string & {});
  currentTime?: number;
  duration?: number;
  tmdbId?: number;
  mediaType?: "movie" | "tv";
  season?: number;
  episode?: number;
  playing?: boolean;
  muted?: boolean;
  volume?: number;
}

export interface EmbedStatus {
  currentTime: number;
  duration: number;
  playing: boolean;
  muted: boolean;
  volume: number;
}

export interface EmbedController {
  play: (time?: number) => void;
  pause: (time?: number) => void;
  seek: (time: number) => void;
  /** 0 to 1 */
  setVolume: (level: number) => void;
  setMuted: (muted: boolean) => void;
  /** Asks for a `playerstatus` event. */
  requestStatus: () => void;
  /** The last known playback state, from the player's events. */
  status: () => EmbedStatus;
  /** Forgets the state of the previous video, for when the frame loads a new one. */
  reset: () => void;
}

const INITIAL_STATUS: EmbedStatus = { currentTime: 0, duration: 0, playing: false, muted: false, volume: 1 };

/** Whether `origin` is the embed host or one of its subdomains. */
function fromEmbedHost(origin: string, embedUrl: string) {
  const host = new URL(embedUrl).hostname.replace(/^www\./, "");
  try {
    const { hostname, protocol } = new URL(origin);
    return protocol === "https:" && (hostname === host || hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

/**
 * An event posted by the embedded player. The documented shape is `{ type: "PLAYER_EVENT", data }`;
 * other players differ, so this also accepts JSON strings, fields at the top level and common
 * field names.
 */
export function readEmbedEvent(raw: unknown): EmbedEvent | null {
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
  const bool = (key: string) => (typeof fields[key] === "boolean" ? (fields[key] as boolean) : undefined);
  const event = String(fields.event ?? outer.event ?? "").toLowerCase();
  if (!event) return null;
  return {
    event,
    currentTime: num("currentTime", "time", "timestamp", "position"),
    duration: num("duration"),
    tmdbId: num("tmdbId"),
    mediaType: fields.mediaType === "movie" || fields.mediaType === "tv" ? fields.mediaType : undefined,
    season: num("season"),
    episode: num("episode"),
    playing: bool("playing"),
    muted: bool("muted"),
    volume: num("volume"),
  };
}

/**
 * Controls the embedded player in `frameRef` over its postMessage API and passes its events to
 * `onEvent`. Only messages from that frame on the embed host count, and commands go only to the
 * embed host, never to whatever else the frame may have navigated to.
 */
export function useEmbedPlayer(
  frameRef: RefObject<HTMLIFrameElement | null>,
  embedUrl: string,
  onEvent: (event: EmbedEvent) => void,
): EmbedController {
  const status = useRef<EmbedStatus>(INITIAL_STATUS);
  // The origin the player last posted from, which may be a subdomain of the embed host.
  const playerOrigin = useRef<string | null>(null);

  const onMessage = useEffectEvent((e: MessageEvent) => {
    const frame = frameRef.current;
    if (!frame || e.source !== frame.contentWindow || !fromEmbedHost(e.origin, embedUrl)) return;
    const event = readEmbedEvent(e.data);
    if (!event) return;
    playerOrigin.current = e.origin;
    const s = status.current;
    status.current = {
      currentTime: event.currentTime ?? s.currentTime,
      duration: event.duration || s.duration,
      playing:
        event.playing ??
        (event.event === "play" ? true : event.event === "pause" || event.event === "ended" ? false : s.playing),
      muted: event.muted ?? s.muted,
      volume: event.volume ?? s.volume,
    };
    onEvent(event);
  });

  useEffect(() => {
    const listener = (e: MessageEvent) => onMessage(e);
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, []);

  return useMemo(() => {
    // Commands update the known state right away, since the player doesn't report every change,
    // so a quick second key press builds on the first.
    const send = (command: EmbedCommand, change?: Partial<EmbedStatus>) => {
      const frame = frameRef.current?.contentWindow;
      if (!frame) return;
      frame.postMessage(command, playerOrigin.current ?? new URL(embedUrl).origin);
      if (change) status.current = { ...status.current, ...change };
    };
    const clampTime = (t: number) => Math.max(0, status.current.duration ? Math.min(t, status.current.duration) : t);
    const at = (time?: number) => (time === undefined ? {} : { time: clampTime(time) });
    return {
      play: (time) => send({ command: "play", ...at(time) }, { playing: true }),
      pause: (time) => send({ command: "pause", ...at(time) }, { playing: false }),
      seek: (time) => {
        const t = clampTime(time);
        send({ command: "seek", time: t }, { currentTime: t });
      },
      setVolume: (level) => {
        const volume = Math.min(Math.max(level, 0), 1);
        send({ command: "volume", level: volume }, { volume });
      },
      setMuted: (muted) => send({ command: "mute", muted }, { muted }),
      requestStatus: () => send({ command: "getStatus" }),
      status: () => status.current,
      reset: () => {
        status.current = INITIAL_STATUS;
        playerOrigin.current = null;
      },
    };
  }, [frameRef, embedUrl]);
}
