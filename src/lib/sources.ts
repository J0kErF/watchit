import { connection } from "next/server";
import { fill, matches } from "./embed";
import { TITLE_ID_PATTERN, type Episode, type Source, type Subtitle } from "./types";

// Direct videos for the built-in player come from a source API the site owner runs or licenses,
// which answers JSON for a title. Placeholders: {id} (TMDb id), {season}, {episode}. Without these,
// titles play from the embed host only.
const MOVIE_URL = process.env.SOURCE_MOVIE_URL;
const TV_URL = process.env.SOURCE_TV_URL;

export const sourcesEnabled = Boolean(MOVIE_URL || TV_URL);

// Hosts the player may load video, subtitles and thumbnails from (SOURCE_HOSTS, comma-separated,
// "*.example.com" for subdomains). Defaults to the source API's hosts and their subdomains.
const API_HOSTS = [MOVIE_URL, TV_URL].flatMap((u) => {
  try {
    return u ? [new URL(u).hostname.toLowerCase()] : [];
  } catch {
    return [];
  }
});
const MEDIA_HOSTS = (process.env.SOURCE_HOSTS ?? API_HOSTS.flatMap((h) => [h, `*.${h}`]).join(","))
  .split(",")
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

/** An absolute https URL on an allowed media host, resolved against `base`, or null. */
function mediaUrl(value: unknown, base: string): string | null {
  if (typeof value !== "string" || !value) return null;
  try {
    const url = new URL(value, base);
    return url.protocol === "https:" && matches(url.hostname.toLowerCase(), MEDIA_HOSTS) ? url.href : null;
  } catch {
    return null;
  }
}

const text = (...values: unknown[]) => values.find((v): v is string => typeof v === "string" && v.trim() !== "")?.trim();
const list = (value: unknown) => (Array.isArray(value) ? value : []).filter((v): v is Record<string, unknown> => !!v && typeof v === "object");

/**
 * Sources from a source API response. APIs differ, so this accepts `sources` (or a top-level array),
 * `subtitles` or `tracks`, and the common field names for each.
 */
function readSources(raw: unknown, base: string): Source[] {
  const body = (Array.isArray(raw) ? { sources: raw } : raw ?? {}) as Record<string, unknown>;
  const subtitles: Subtitle[] = list(body.subtitles ?? body.tracks).flatMap((t) => {
    const url = mediaUrl(t.url ?? t.file ?? t.src, base);
    if (!url || (typeof t.kind === "string" && !/subtitles|captions/i.test(t.kind))) return [];
    const lang = text(t.lang, t.srclang, t.language) ?? "und";
    return [{ lang, label: text(t.label, t.name) ?? lang.toUpperCase(), url }];
  });
  const thumbnails = mediaUrl(body.thumbnails ?? body.thumbnail, base) ?? undefined;

  return list(body.sources).flatMap((s, i) => {
    const url = mediaUrl(s.url ?? s.file ?? s.src, base);
    if (!url) return [];
    const type = text(s.type, s.kind)?.toLowerCase() ?? "";
    const kind = /hls|m3u8|mpegurl/.test(type) || /\.m3u8(\?|$)/i.test(url) ? "hls" : "file";
    return [{ label: text(s.label, s.name, s.quality) ?? `Server ${i + 1}`, kind, url, subtitles, thumbnails }];
  });
}

/** Direct sources for an episode (or a movie's only episode), or none when there's no source API or it fails. */
export async function getSources(titleId: string, episode: Episode): Promise<Source[]> {
  const ref = TITLE_ID_PATTERN.exec(titleId);
  if (!ref) return [];
  const id = Number(ref[2]);
  const template = ref[1] === "movie" ? MOVIE_URL : TV_URL;
  if (!template || (ref[1] === "tv" && (episode.season === undefined || episode.number === undefined))) return [];
  const url = ref[1] === "movie" ? fill(template, { id }) : fill(template, { id, season: episode.season!, episode: episode.number! });

  // Stream URLs usually carry short-lived tokens, so they're looked up per request and not cached.
  await connection();
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(6000), headers: { accept: "application/json" } });
    if (!res.ok) {
      if (res.status !== 404) console.error(`Source API failed: ${res.status}`);
      return [];
    }
    return readSources(await res.json(), url);
  } catch (err) {
    console.error(`Source API failed: ${err}`);
    return [];
  }
}
