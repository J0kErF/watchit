"use client";

import type Hls from "hls.js";
import Link from "next/link";
import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { Source } from "@/lib/types";
import { CaptionStylePanel, Captions } from "./Captions";
import {
  BackIcon,
  CheckIcon,
  EpisodesIcon,
  FullscreenIcon,
  NextIcon,
  PauseIcon,
  PipIcon,
  PlayIcon,
  SeekIcon,
  ServerIcon,
  SettingsIcon,
  SpeedIcon,
  SubtitlesIcon,
  VolumeIcon,
} from "./icons";
import { setPrefs, usePrefs } from "./prefs";
import { formatClock } from "./time";
import { parseThumbnails, type Thumbnail } from "./thumbnails";
import { Timeline } from "./Timeline";

const SKIP = 15;
const HIDE_AFTER = 3000;
/** The next-episode card shows this long before the end, and plays the next episode halfway through. */
const NEXT_CARD = 20;
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export interface PlayerServer {
  key: string;
  label: string;
}

export interface NextEpisode {
  label: string;
  title: string;
  still?: string;
  onPlay: () => void;
}

type Menu = "subtitles" | "style" | "speed" | "quality" | "servers";
type Flash = { kind: "play" | "pause" | "back" | "forward"; n: number };
type HlsModule = typeof import("hls.js").default;

interface TrackOption {
  /** Index in video.textTracks */
  index: number;
  label: string;
  lang: string;
}

type FullscreenVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

const subscribePip = () => () => {};
const pipSupported = () => typeof document !== "undefined" && document.pictureInPictureEnabled === true;

const sameLang = (a: string, b: string) => a.toLowerCase().split("-")[0] === b.toLowerCase().split("-")[0];

/** A Netflix-style player for HLS and MP4/WebM sources. Key it by source so each video starts fresh. */
export function VideoPlayer({
  source,
  heading,
  subheading,
  description,
  backHref,
  poster,
  getStartAt,
  next,
  servers,
  server,
  onServer,
  onEpisodes,
  onProgress,
}: {
  source: Source;
  heading: string;
  subheading?: string;
  description?: string;
  backHref: string;
  poster?: string;
  /** Where to start, read once the video has loaded. */
  getStartAt: () => number | null;
  next?: NextEpisode;
  servers: PlayerServer[];
  server: string;
  onServer: (key: string, time: number) => void;
  onEpisodes?: () => void;
  /** Playback position; `final` on pause and end, when it's worth saving right away. */
  onProgress: (time: number, duration: number, final: boolean) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<FullscreenVideo>(null);
  const hlsRef = useRef<Hls | null>(null);
  const prefs = usePrefs();
  const canPip = useSyncExternalStore(subscribePip, pipSupported, () => false);

  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [rate, setRate] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [pip, setPip] = useState(false);

  const [active, setActive] = useState(true);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [idle, setIdle] = useState(false);
  const [nextDismissed, setNextDismissed] = useState(false);

  const [tracks, setTracks] = useState<TrackOption[]>([]);
  const [trackIndex, setTrackIndex] = useState(-1);
  const [cues, setCues] = useState<string[]>([]);
  const [levels, setLevels] = useState<{ index: number; height: number; bitrate: number }[]>([]);
  const [level, setLevel] = useState(-1);
  const [playingLevel, setPlayingLevel] = useState(-1);
  const [audioTracks, setAudioTracks] = useState<{ id: number; label: string }[]>([]);
  const [audioTrack, setAudioTrack] = useState(-1);
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);

  const hideTimer = useRef<number | undefined>(undefined);
  const lastTap = useRef<{ at: number; side: number } | null>(null);
  const lastPointer = useRef("mouse");
  const advanced = useRef(false);
  const userPickedTrack = useRef(false);

  const visible = active || !playing || menu !== null || scrubbing || error !== null;

  const poke = () => {
    setActive(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setActive(false), HIDE_AFTER);
  };

  const showFlash = (kind: Flash["kind"]) => setFlash((f) => ({ kind, n: (f?.n ?? 0) + 1 }));

  const playNext = () => {
    if (!next || advanced.current) return;
    advanced.current = true;
    next.onPlay();
  };

  // ---- Playback actions ----

  const togglePlay = () => {
    const video = videoRef.current!;
    if (video.paused || video.ended) {
      video.play().catch(() => {});
      showFlash("play");
    } else {
      video.pause();
      showFlash("pause");
    }
  };

  const seek = (to: number) => {
    const video = videoRef.current!;
    const end = Number.isFinite(video.duration) ? video.duration : to;
    video.currentTime = Math.min(Math.max(to, 0), end);
    setTime(video.currentTime);
  };

  const skip = (delta: number) => {
    seek(videoRef.current!.currentTime + delta);
    showFlash(delta < 0 ? "back" : "forward");
    poke();
  };

  const setVolume = (volume: number) => {
    const v = Math.round(Math.min(Math.max(volume, 0), 1) * 100) / 100;
    setPrefs({ volume: v, muted: v === 0 });
  };

  const toggleMute = () => setPrefs({ muted: !prefs.muted, volume: prefs.muted && prefs.volume === 0 ? 0.5 : prefs.volume });

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (containerRef.current?.requestFullscreen) {
      containerRef.current.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
    } else {
      // iOS Safari only lets the video element itself go fullscreen.
      videoRef.current?.webkitEnterFullscreen?.();
    }
  };

  const togglePip = () => {
    const video = videoRef.current!;
    if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => {});
    else video.requestPictureInPicture().catch(() => {});
  };

  const changeRate = (r: number) => {
    videoRef.current!.playbackRate = r;
    setRate(r);
  };

  const pickTrack = (index: number) => {
    userPickedTrack.current = true;
    setTrackIndex(index);
    setPrefs({ captionLang: index < 0 ? "off" : (tracks.find((t) => t.index === index)?.lang ?? "off") });
  };

  const toggleCaptions = () => {
    if (trackIndex >= 0) return pickTrack(-1);
    const preferred = prefs.captionLang && prefs.captionLang !== "off" ? tracks.find((t) => sameLang(t.lang, prefs.captionLang!)) : undefined;
    const pick = preferred ?? tracks[0];
    if (pick) pickTrack(pick.index);
  };

  const pickLevel = (index: number) => {
    if (hlsRef.current) hlsRef.current.currentLevel = index;
    setLevel(index);
  };

  const pickAudio = (id: number) => {
    if (hlsRef.current) hlsRef.current.audioTrack = id;
    setAudioTrack(id);
  };

  const toggleMenu = (m: Menu) => {
    setMenu((open) => (open === m ? null : m));
    poke();
  };

  // ---- Loading the source ----

  const onFatal = useEffectEvent((message: string) => {
    setError(message);
    setWaiting(false);
  });

  const onLevels = useEffectEvent((hls: Hls) => {
    setLevels(
      hls.levels
        .map((l, index) => ({ index, height: l.height, bitrate: l.bitrate }))
        .sort((a, b) => b.height - a.height || b.bitrate - a.bitrate),
    );
  });

  const onAudioTracks = useEffectEvent((hls: Hls) => {
    setAudioTracks(hls.audioTracks.map((t, id) => ({ id, label: t.name || t.lang || `Track ${id + 1}` })));
    setAudioTrack(hls.audioTrack);
  });

  useEffect(() => {
    const video = videoRef.current!;
    let hls: Hls | null = null;
    let cancelled = false;

    const attach = (Hls: HlsModule | null) => {
      if (cancelled) return;
      if (source.kind === "hls" && Hls?.isSupported()) {
        let recovered = false;
        hls = new Hls({ capLevelToPlayerSize: true });
        hls.subtitleDisplay = false;
        hlsRef.current = hls;
        hls.on(Hls.Events.MANIFEST_PARSED, () => onLevels(hls!));
        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => setPlayingLevel(data.level));
        hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => onAudioTracks(hls!));
        hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_, data) => setAudioTrack(data.id));
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (!data.fatal) return;
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR && !recovered) {
            recovered = true;
            hls!.recoverMediaError();
          } else {
            onFatal(data.type === Hls.ErrorTypes.NETWORK_ERROR ? "This server couldn’t load the video." : "This video couldn’t be played.");
          }
        });
        hls.loadSource(source.url);
        hls.attachMedia(video);
      } else if (source.kind === "hls" && !video.canPlayType("application/vnd.apple.mpegurl")) {
        onFatal("This browser can’t play this stream.");
      } else {
        video.src = source.url;
        video.load();
      }
    };

    if (source.kind === "hls") {
      import("hls.js").then(
        (m) => attach(m.default),
        () => attach(null),
      );
    } else {
      attach(null);
    }

    return () => {
      cancelled = true;
      hls?.destroy();
      hlsRef.current = null;
      video.removeAttribute("src");
      video.load();
    };
  }, [source.kind, source.url, attempt]);

  useEffect(() => {
    if (!source.thumbnails) return;
    const url = source.thumbnails;
    const ctrl = new AbortController();
    fetch(url, { signal: ctrl.signal })
      .then((res) => (res.ok ? res.text() : ""))
      .then((vtt) => setThumbnails(parseThumbnails(vtt, url)))
      .catch(() => {});
    return () => ctrl.abort();
  }, [source.thumbnails]);

  // ---- Captions ----

  const refreshTracks = useEffectEvent(() => {
    const list = Array.from(videoRef.current!.textTracks).flatMap((t, index) =>
      t.kind === "subtitles" || t.kind === "captions"
        ? [{ index, label: (t.label || t.language.toUpperCase() || "Subtitles") + (t.kind === "captions" ? " (CC)" : ""), lang: t.language }]
        : [],
    );
    // Streams often carry the same language more than once; number the repeats.
    const seen = new Map<string, number>();
    for (const t of list) {
      const n = (seen.get(t.label) ?? 0) + 1;
      seen.set(t.label, n);
      if (n > 1) t.label += ` ${n}`;
    }
    setTracks(list);
    if (!userPickedTrack.current) {
      const lang = prefs.captionLang;
      setTrackIndex(lang && lang !== "off" ? (list.find((t) => sameLang(t.lang, lang))?.index ?? -1) : -1);
    }
  });

  useEffect(() => {
    const video = videoRef.current!;
    const listener = () => refreshTracks();
    video.textTracks.addEventListener("addtrack", listener);
    video.textTracks.addEventListener("removetrack", listener);
    video.addEventListener("loadedmetadata", listener);
    return () => {
      video.textTracks.removeEventListener("addtrack", listener);
      video.textTracks.removeEventListener("removetrack", listener);
      video.removeEventListener("loadedmetadata", listener);
    };
  }, []);

  // The chosen track is "hidden" so its cues load without the browser drawing them; the player draws them.
  // In picture-in-picture the player can't draw, so the browser shows them.
  useEffect(() => {
    const textTracks = videoRef.current!.textTracks;
    for (let i = 0; i < textTracks.length; i++) {
      const t = textTracks[i];
      if (t.kind !== "subtitles" && t.kind !== "captions") continue;
      t.mode = i === trackIndex ? (pip ? "showing" : "hidden") : "disabled";
    }
  }, [trackIndex, tracks, pip]);

  const delay = prefs.caption.delay;
  useEffect(() => {
    const video = videoRef.current!;
    let frame = 0;
    let last = "";
    const tick = () => {
      const track = trackIndex >= 0 ? video.textTracks[trackIndex] : undefined;
      const lines: string[] = [];
      if (track?.cues) {
        const t = video.currentTime - delay;
        for (let i = 0; i < track.cues.length; i++) {
          const cue = track.cues[i] as VTTCue;
          if (cue.startTime <= t && cue.endTime > t && cue.text) lines.push(cue.text);
        }
      }
      const key = lines.join("\u0000");
      if (key !== last) {
        last = key;
        setCues(lines);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [trackIndex, delay]);

  // ---- Browser state ----

  useEffect(() => {
    const video = videoRef.current!;
    video.volume = prefs.volume;
    video.muted = prefs.muted;
  }, [prefs.volume, prefs.muted]);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const video = videoRef.current!;
    const enter = () => setPip(true);
    const leave = () => setPip(false);
    video.addEventListener("enterpictureinpicture", enter);
    video.addEventListener("leavepictureinpicture", leave);
    return () => {
      video.removeEventListener("enterpictureinpicture", enter);
      video.removeEventListener("leavepictureinpicture", leave);
    };
  }, []);

  useEffect(() => {
    if (playing) return;
    const timer = window.setTimeout(() => setIdle(true), 8000);
    return () => window.clearTimeout(timer);
  }, [playing]);

  useEffect(() => {
    hideTimer.current = window.setTimeout(() => setActive(false), HIDE_AFTER);
    return () => window.clearTimeout(hideTimer.current);
  }, []);

  // Media keys, headset buttons and the lock screen.
  const onMediaAction = useEffectEvent((action: MediaSessionAction, details: MediaSessionActionDetails) => {
    const video = videoRef.current!;
    if (action === "play") video.play().catch(() => {});
    else if (action === "pause") video.pause();
    else if (action === "seekbackward") skip(-(details.seekOffset ?? SKIP));
    else if (action === "seekforward") skip(details.seekOffset ?? SKIP);
    else if (action === "seekto" && details.seekTime !== undefined) seek(details.seekTime);
    else if (action === "nexttrack") playNext();
  });

  const hasNext = Boolean(next);
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: subheading ? `${heading} · ${subheading}` : heading,
      artwork: poster ? [{ src: poster }] : [],
    });
    const actions: MediaSessionAction[] = ["play", "pause", "seekbackward", "seekforward", "seekto", "nexttrack"];
    for (const action of actions) {
      try {
        navigator.mediaSession.setActionHandler(action, action === "nexttrack" && !hasNext ? null : (d) => onMediaAction(action, d));
      } catch {
        // Not every browser supports every action.
      }
    }
    return () => {
      for (const action of actions) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {}
      }
    };
  }, [heading, subheading, poster, hasNext]);

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (e.ctrlKey || e.metaKey || e.altKey || target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
    if (target.tagName === "BUTTON" && (e.key === " " || e.key === "Enter")) return;
    const video = videoRef.current!;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    let handled = true;
    if (key === " " || key === "k") togglePlay();
    else if (key === "ArrowLeft" || key === "j") skip(-SKIP);
    else if (key === "ArrowRight" || key === "l") skip(SKIP);
    else if (key === "ArrowUp") setVolume((prefs.muted ? 0 : prefs.volume) + 0.1);
    else if (key === "ArrowDown") setVolume((prefs.muted ? 0 : prefs.volume) - 0.1);
    else if (key === "m") toggleMute();
    else if (key === "f") toggleFullscreen();
    else if (key === "c") toggleCaptions();
    else if (key === "p" && canPip) togglePip();
    else if (key === "n" && next) playNext();
    else if (key === "Home") seek(0);
    else if (key === "End") seek(video.duration);
    else if (key === "<" || key === ",") changeRate(SPEEDS[Math.max(SPEEDS.indexOf(rate) - 1, 0)]);
    else if (key === ">" || key === ".") changeRate(SPEEDS[Math.min(SPEEDS.indexOf(rate) + 1, SPEEDS.length - 1)]);
    else if (/^[0-9]$/.test(key) && video.duration) seek((Number(key) / 10) * video.duration);
    else if (key === "Escape" && menu) setMenu(null);
    else handled = false;
    if (handled) {
      e.preventDefault();
      poke();
    }
  });

  useEffect(() => {
    const listener = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  // ---- Video events ----

  const readBuffered = (video: HTMLVideoElement) => {
    const ranges = video.buffered;
    for (let i = 0; i < ranges.length; i++) {
      if (ranges.start(i) <= video.currentTime + 0.5 && ranges.end(i) >= video.currentTime) return ranges.end(i);
    }
    return 0;
  };

  const showNext = Boolean(next) && duration > 60 && duration - time <= NEXT_CARD && !nextDismissed && !error;
  const nextFill = Math.min(Math.max((time - (duration - NEXT_CARD)) / (NEXT_CARD / 2), 0), 1);

  // A tap shows or hides the controls; a double tap on the left or right third skips.
  const onSurfaceTap = (e: React.PointerEvent<HTMLDivElement>) => {
    lastPointer.current = e.pointerType;
    if (menu) {
      setMenu(null);
      return;
    }
    if (e.pointerType === "mouse") {
      if (e.button === 0) togglePlay();
      poke();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const side = x < 1 / 3 ? -1 : x > 2 / 3 ? 1 : 0;
    const now = performance.now();
    const prev = lastTap.current;
    lastTap.current = { at: now, side };
    if (prev && side !== 0 && prev.side === side && now - prev.at < 320) {
      skip(side * SKIP);
    } else if (visible && playing) {
      window.clearTimeout(hideTimer.current);
      setActive(false);
    } else {
      poke();
    }
  };

  const volumeLevel = prefs.muted ? 0 : prefs.volume;
  const autoHeight = levels.find((l) => l.index === playingLevel)?.height;

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[70] select-none overflow-hidden bg-black text-white ${visible ? "" : "cursor-none"}`}
      onPointerMove={(e) => e.pointerType === "mouse" && poke()}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full"
        // Subtitle files from another host need CORS; plain video files play without it.
        crossOrigin={source.subtitles.length ? "anonymous" : undefined}
        playsInline
        preload="auto"
        poster={poster}
        onLoadedMetadata={(e) => {
          const video = e.currentTarget;
          setDuration(video.duration);
          const start = getStartAt();
          if (start && start < video.duration - 10) video.currentTime = start;
          video.play().catch(() => setWaiting(false));
        }}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => {
          const video = e.currentTarget;
          setTime(video.currentTime);
          setBuffered(readBuffered(video));
          onProgress(video.currentTime, video.duration, false);
          if (next && !nextDismissed && video.duration > 60 && video.duration - video.currentTime <= NEXT_CARD / 2 && !video.paused) playNext();
        }}
        onProgress={(e) => setBuffered(readBuffered(e.currentTarget))}
        onPlay={() => {
          setPlaying(true);
          setIdle(false);
        }}
        onPause={(e) => {
          setPlaying(false);
          onProgress(e.currentTarget.currentTime, e.currentTarget.duration, true);
        }}
        onEnded={(e) => {
          setPlaying(false);
          onProgress(e.currentTarget.duration, e.currentTarget.duration, true);
          playNext();
        }}
        onWaiting={() => setWaiting(true)}
        onLoadStart={() => setWaiting(true)}
        onPlaying={() => {
          setWaiting(false);
          setError(null);
        }}
        onCanPlay={() => setWaiting(false)}
        onSeeked={() => setWaiting(false)}
        onError={(e) => {
          // With hls.js the video has no src of its own; its errors come through hls.js.
          if (hlsRef.current || !e.currentTarget.error) return;
          setError(e.currentTarget.error.code === MediaError.MEDIA_ERR_DECODE ? "This video couldn’t be played." : "This server couldn’t load the video.");
          setWaiting(false);
        }}
      >
        {source.subtitles.map((s) => (
          <track key={s.url} kind="subtitles" src={s.url} srcLang={s.lang} label={s.label} />
        ))}
      </video>

      <div className="absolute inset-0" onPointerUp={onSurfaceTap} onDoubleClick={() => lastPointer.current === "mouse" && toggleFullscreen()} />

      <Captions cues={cues} style={prefs.caption} raised={visible} />

      {waiting && !error && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="h-16 w-16 animate-spin rounded-full border-4 border-white/20 border-t-accent" aria-label="Loading" />
        </div>
      )}

      {flash && (
        <div key={flash.n} className="pointer-events-none absolute inset-0 grid place-items-center">
          <span
            className={`animate-player-flash grid h-24 w-24 place-items-center rounded-full bg-black/45 [&_svg]:size-12 ${
              flash.kind === "back" ? "-translate-x-[18vw]" : flash.kind === "forward" ? "translate-x-[18vw]" : ""
            }`}
          >
            {flash.kind === "play" ? <PlayIcon /> : flash.kind === "pause" ? <PauseIcon /> : <SeekIcon seconds={SKIP} forward={flash.kind === "forward"} />}
          </span>
        </div>
      )}

      {idle && !playing && !error && !menu && (
        <div className="pointer-events-none absolute inset-0 flex items-center bg-gradient-to-r from-black/85 via-black/50 to-transparent px-[6%] animate-fade-in">
          <div className="max-w-xl">
            <p className="text-lg text-white/70">You’re watching</p>
            <h2 className="mt-2 font-display text-4xl font-bold sm:text-5xl">{heading}</h2>
            {subheading && <p className="mt-3 text-xl font-semibold">{subheading}</p>}
            {description && <p className="mt-3 line-clamp-4 text-base text-white/80 sm:text-lg">{description}</p>}
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-black/80 px-6 text-center">
          <div className="max-w-md">
            <p className="text-xl font-semibold">{error}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setWaiting(true);
                  setAttempt((a) => a + 1);
                }}
                className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/85"
              >
                Try again
              </button>
              {servers
                .filter((s) => s.key !== server)
                .map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => onServer(s.key, time)}
                    className="rounded-full bg-white/15 px-5 py-2.5 text-sm font-semibold hover:bg-white/25"
                  >
                    Switch to {s.label}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div
        className={`absolute inset-x-0 top-0 z-10 flex items-center gap-4 bg-gradient-to-b from-black/80 to-transparent px-4 pb-12 pt-4 transition-opacity duration-300 sm:px-8 ${
          visible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <Link href={backHref} aria-label="Back to details" className="grid h-12 w-12 shrink-0 place-items-center rounded-full transition hover:scale-110">
          <BackIcon />
        </Link>
        <div className="min-w-0 flex-1 sm:hidden">
          <p className="truncate font-semibold">{heading}</p>
          {subheading && <p className="truncate text-xs text-white/70">{subheading}</p>}
        </div>
      </div>

      {/* Touch: big center controls */}
      <div
        className={`pointer-events-none absolute inset-0 z-10 hidden items-center justify-center gap-[12vw] transition-opacity duration-300 pointer-coarse:flex ${
          visible && !error ? "opacity-100" : "opacity-0"
        }`}
      >
        <button type="button" onClick={() => skip(-SKIP)} aria-label={`Back ${SKIP} seconds`} className={`[&_svg]:size-10 ${visible ? "pointer-events-auto" : ""}`}>
          <SeekIcon seconds={SKIP} />
        </button>
        <button type="button" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className={`[&_svg]:size-14 ${visible ? "pointer-events-auto" : ""}`}>
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button type="button" onClick={() => skip(SKIP)} aria-label={`Forward ${SKIP} seconds`} className={`[&_svg]:size-10 ${visible ? "pointer-events-auto" : ""}`}>
          <SeekIcon seconds={SKIP} forward />
        </button>
      </div>

      {/* Next episode */}
      {showNext && next && (
        <div className="absolute bottom-32 right-4 z-20 flex flex-col items-end gap-3 sm:bottom-36 sm:right-8 animate-fade-in">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setNextDismissed(true)}
              className="rounded-md bg-black/60 px-5 py-3 text-sm font-semibold ring-1 ring-white/40 backdrop-blur hover:bg-black/80"
            >
              Watch credits
            </button>
            <button
              type="button"
              onClick={playNext}
              className="relative overflow-hidden rounded-md bg-white/30 px-5 py-3 text-sm font-semibold text-black backdrop-blur"
            >
              <span className="absolute inset-y-0 left-0 bg-white transition-[width] duration-300 ease-linear" style={{ width: `${nextFill * 100}%` }} />
              <span className="relative flex items-center gap-2 [&_svg]:size-5">
                <NextIcon /> Next episode
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Menus */}
      {menu && (
        <div
          className="absolute bottom-28 right-2 z-30 max-h-[65vh] w-[min(92vw,30rem)] overflow-y-auto rounded-lg bg-neutral-900/95 p-5 shadow-2xl ring-1 ring-white/10 backdrop-blur sm:right-8"
          onPointerMove={poke}
        >
          {menu === "subtitles" && (
            <div className="space-y-5">
              <div className={`grid gap-6 ${audioTracks.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                {audioTracks.length > 1 && (
                  <MenuList title="Audio">
                    {audioTracks.map((t) => (
                      <MenuItem key={t.id} selected={t.id === audioTrack} onClick={() => pickAudio(t.id)}>
                        {t.label}
                      </MenuItem>
                    ))}
                  </MenuList>
                )}
                <MenuList title="Subtitles">
                  <MenuItem selected={trackIndex < 0} onClick={() => pickTrack(-1)}>
                    Off
                  </MenuItem>
                  {tracks.map((t) => (
                    <MenuItem key={t.index} selected={t.index === trackIndex} onClick={() => pickTrack(t.index)}>
                      {t.label}
                    </MenuItem>
                  ))}
                  {!tracks.length && <p className="px-3 py-2 text-sm text-white/50">No subtitles for this video</p>}
                </MenuList>
              </div>
              <button
                type="button"
                onClick={() => setMenu("style")}
                className="w-full rounded-md bg-white/10 px-4 py-2.5 text-left text-sm font-medium hover:bg-white/20"
              >
                Subtitle appearance & timing →
              </button>
            </div>
          )}

          {menu === "style" && (
            <div>
              <button type="button" onClick={() => setMenu("subtitles")} className="mb-4 text-sm font-semibold text-white/80 hover:text-white">
                ← Subtitle appearance
              </button>
              <CaptionStylePanel style={prefs.caption} />
            </div>
          )}

          {menu === "speed" && (
            <div>
              <h3 className="mb-5 text-xl font-semibold">Playback speed</h3>
              <div className="relative flex justify-between px-2">
                <div className="absolute inset-x-6 top-[9px] h-0.5 bg-white/30" />
                {SPEEDS.map((s) => (
                  <button key={s} type="button" onClick={() => changeRate(s)} className="relative flex flex-col items-center gap-3" aria-pressed={s === rate}>
                    <span className={`h-5 w-5 rounded-full border-2 ${s === rate ? "scale-125 border-white bg-white" : "border-white/60 bg-neutral-900"}`} />
                    <span className={`text-sm ${s === rate ? "font-semibold" : "text-white/70"}`}>{s === 1 ? "1x (Normal)" : `${s}x`}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {menu === "quality" && (
            <MenuList title="Quality">
              <MenuItem selected={level < 0} onClick={() => pickLevel(-1)}>
                Auto{level < 0 && autoHeight ? ` (${autoHeight}p)` : ""}
              </MenuItem>
              {levels.map((l) => (
                <MenuItem key={l.index} selected={l.index === level} onClick={() => pickLevel(l.index)}>
                  {l.height ? `${l.height}p` : `${Math.round(l.bitrate / 1000)} kbps`}
                  {l.height >= 2160 ? " 4K" : l.height >= 720 ? " HD" : ""}
                  {l.height > 0 && levels.filter((o) => o.height === l.height).length > 1 && (
                    <span className="text-white/50">· {(l.bitrate / 1_000_000).toFixed(1)} Mbps</span>
                  )}
                </MenuItem>
              ))}
            </MenuList>
          )}

          {menu === "servers" && (
            <MenuList title="Server">
              {servers.map((s) => (
                <MenuItem key={s.key} selected={s.key === server} onClick={() => s.key !== server && onServer(s.key, time)}>
                  {s.label}
                </MenuItem>
              ))}
            </MenuList>
          )}
        </div>
      )}

      {/* Bottom bar */}
      <div
        className={`absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-3 pt-16 transition-opacity duration-300 sm:px-8 sm:pb-5 ${
          visible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="flex items-center gap-4">
          <Timeline
            time={time}
            duration={duration}
            buffered={buffered}
            thumbnails={thumbnails}
            onSeek={seek}
            onScrub={(s) => {
              setScrubbing(s);
              if (!s) poke();
            }}
          />
          <span className="w-16 shrink-0 text-right text-sm tabular-nums text-white/90">{formatClock(duration - time)}</span>
        </div>

        <div className="mt-1 flex items-center gap-1 sm:gap-3 [&_svg]:size-6 sm:[&_svg]:size-8">
          <Control label={playing ? "Pause (space)" : "Play (space)"} onClick={togglePlay}>
            {playing ? <PauseIcon /> : <PlayIcon />}
          </Control>
          <Control label={`Back ${SKIP} seconds (←)`} onClick={() => skip(-SKIP)}>
            <SeekIcon seconds={SKIP} />
          </Control>
          <Control label={`Forward ${SKIP} seconds (→)`} onClick={() => skip(SKIP)}>
            <SeekIcon seconds={SKIP} forward />
          </Control>
          <div className="group/volume flex items-center pointer-coarse:hidden">
            <Control label={volumeLevel ? "Mute (m)" : "Unmute (m)"} onClick={toggleMute}>
              <VolumeIcon level={volumeLevel} />
            </Control>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volumeLevel}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume"
              className="w-0 cursor-pointer accent-accent opacity-0 transition-all duration-200 focus:w-24 focus:opacity-100 group-hover/volume:w-24 group-hover/volume:opacity-100"
            />
          </div>

          <p className="mx-2 hidden min-w-0 flex-1 truncate text-center text-base sm:block">
            <span className="font-semibold">{heading}</span>
            {subheading && <span className="ml-3 text-white/70">{subheading}</span>}
          </p>
          <span className="flex-1 sm:hidden" />

          {next && (
            <div className="group/next relative">
              <Control label="Next episode (n)" onClick={playNext}>
                <NextIcon />
              </Control>
              <div className="pointer-events-none absolute bottom-14 right-0 hidden w-72 overflow-hidden rounded-md bg-neutral-900 shadow-2xl ring-1 ring-white/10 group-hover/next:block">
                <p className="px-4 py-2 text-sm font-semibold">Next episode</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {next.still && <img src={next.still} alt="" className="aspect-video w-full object-cover" />}
                <p className="px-4 py-3 text-sm">
                  <span className="font-semibold">{next.label}</span> {next.title}
                </p>
              </div>
            </div>
          )}
          {onEpisodes && (
            <Control label="Episodes" onClick={onEpisodes}>
              <EpisodesIcon />
            </Control>
          )}
          <Control label="Audio & subtitles (c)" onClick={() => toggleMenu("subtitles")} active={menu === "subtitles" || menu === "style"}>
            <SubtitlesIcon />
          </Control>
          <Control label="Playback speed" onClick={() => toggleMenu("speed")} active={menu === "speed"}>
            <SpeedIcon />
          </Control>
          {levels.length > 1 && (
            <Control label="Quality" onClick={() => toggleMenu("quality")} active={menu === "quality"}>
              <SettingsIcon />
            </Control>
          )}
          {servers.length > 1 && (
            <Control label="Server" onClick={() => toggleMenu("servers")} active={menu === "servers"}>
              <ServerIcon />
            </Control>
          )}
          {canPip && (
            <Control label={pip ? "Exit picture-in-picture (p)" : "Picture-in-picture (p)"} onClick={togglePip} active={pip}>
              <PipIcon />
            </Control>
          )}
          <Control label={fullscreen ? "Exit full screen (f)" : "Full screen (f)"} onClick={toggleFullscreen}>
            <FullscreenIcon exit={fullscreen} />
          </Control>
        </div>
      </div>
    </div>
  );
}

function Control({ label, onClick, active, children }: { label: string; onClick: () => void; active?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      // Clicking doesn't move focus, so the space bar keeps controlling playback.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition hover:scale-110 sm:h-12 sm:w-12 ${active ? "text-accent" : ""}`}
    >
      {children}
    </button>
  );
}

function MenuList({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xl font-semibold">{title}</h3>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

function MenuItem({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onClick}
        className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left text-base transition hover:bg-white/10 ${selected ? "font-semibold" : "text-white/70"}`}
      >
        <span className="w-5 shrink-0">{selected && <CheckIcon />}</span>
        {children}
      </button>
    </li>
  );
}
