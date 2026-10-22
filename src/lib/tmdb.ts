import { cacheLife } from "next/cache";
import { embedPath } from "./embed";
import { type CastMember, type Episode, type Kind, TITLE_ID_PATTERN, type TitleDetail, type TitleSummary } from "./types";

const API = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";
// Either credential works: a v4 Read Access Token, or a v3 API key.
const TOKEN = process.env.TMDB_READ_TOKEN;
const API_KEY = process.env.TMDB_API_KEY;

export const tmdbEnabled = Boolean(TOKEN || API_KEY);

type MediaType = "movie" | "tv";

const titleId = (type: MediaType, id: number) => `tmdb-${type}-${id}`;

function parseId(id: string) {
  const m = id.match(TITLE_ID_PATTERN);
  return m ? { type: m[1] as MediaType, id: Number(m[2]) } : null;
}

export const isTmdbId = (id: string) => TITLE_ID_PATTERN.test(id);

export function tmdbPageUrl(id: string) {
  const ref = parseId(id);
  return ref ? `https://www.themoviedb.org/${ref.type}/${ref.id}` : undefined;
}

const image = (size: string, path?: string | null) => (path ? `${IMG}/${size}${path}` : undefined);

// Cached functions below never throw: an error inside "use cache" fails the whole prerender, even
// when the caller catches it. Incomplete results are cached for minutes instead, so they're retried soon.

/** GET a TMDb endpoint, or null when it fails. Failures other than 404 are logged. */
async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
  if (!tmdbEnabled) return null;
  const url = new URL(API + path);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  if (!TOKEN && API_KEY) url.searchParams.set("api_key", API_KEY);
  try {
    const res = await fetch(url, {
      headers: TOKEN ? { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" } : { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) return (await res.json()) as T;
    if (res.status !== 404) console.error(`TMDb ${path} failed: ${res.status}`);
  } catch (err) {
    console.error(`TMDb ${path} failed: ${err}`);
  }
  return null;
}

interface Item {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  vote_average?: number;
  vote_count?: number;
}

interface Detail extends Item {
  genres?: { id: number; name: string }[];
  runtime?: number | null;
  tagline?: string;
  number_of_seasons?: number;
  seasons?: { season_number: number; episode_count: number }[];
  created_by?: { name: string }[];
  credits?: {
    cast?: { name: string; character?: string; profile_path?: string | null }[];
    crew?: { job?: string; name: string }[];
  };
  images?: { logos?: { file_path: string; iso_639_1?: string | null }[] };
}

interface Season {
  episodes?: {
    season_number: number;
    episode_number: number;
    name?: string;
    overview?: string;
    still_path?: string | null;
    runtime?: number | null;
    air_date?: string | null;
  }[];
}

// Shorter genre names for cards and filters.
const GENRE_NAMES: Record<string, string> = { "Science Fiction": "Sci-Fi" };
const genreName = (name: string) => GENRE_NAMES[name] ?? name;

async function genreMap(): Promise<Record<number, string>> {
  "use cache";

  const lists = await Promise.all(
    (["movie", "tv"] as const).map((type) => tmdb<{ genres: { id: number; name: string }[] }>(`/genre/${type}/list`)),
  );
  if (lists.every(Boolean)) cacheLife("days");
  else cacheLife("minutes");
  return Object.fromEntries(lists.flatMap((l) => l?.genres ?? []).map((g) => [g.id, genreName(g.name)]));
}

const parseYear = (date?: string) => (date && /^\d{4}/.test(date) ? Number(date.slice(0, 4)) : undefined);

const score = (vote?: number, count?: number) => (vote && count && count >= 5 ? Math.round(vote * 10) / 10 : undefined);

/** Card data for a TMDb list, discover or search endpoint, skipping people and titles without a poster. */
async function tmdbResults(path: string, params: Record<string, string> = {}, pages = 1): Promise<TitleSummary[]> {
  "use cache";

  const fixedType: MediaType | undefined = /\/movie(\/|$)/.test(path) ? "movie" : /\/tv(\/|$)/.test(path) ? "tv" : undefined;
  const [genres, ...responses] = await Promise.all([
    genreMap(),
    ...Array.from({ length: pages }, (_, i) => tmdb<{ results?: Item[] }>(path, { ...params, page: String(i + 1) })),
  ]);
  if (responses.every(Boolean)) cacheLife("hours");
  else cacheLife("minutes");
  const seen = new Set<string>();
  return responses
    .flatMap((r) => r?.results ?? [])
    .flatMap((item) => {
      const type = fixedType ?? item.media_type;
      if ((type !== "movie" && type !== "tv") || !item.poster_path) return [];
      const id = titleId(type, item.id);
      if (seen.has(id)) return [];
      seen.add(id);
      return [
        {
          id,
          kind: (type === "movie" ? "movie" : "series") as Kind,
          title: item.title ?? item.name ?? "",
          year: parseYear(item.release_date ?? item.first_air_date),
          description: item.overview ?? "",
          poster: image("w342", item.poster_path)!,
          backdrop: image("w780", item.backdrop_path),
          genres: (item.genre_ids ?? []).flatMap((g) => (genres[g] ? [genres[g]] : [])),
          rating: score(item.vote_average, item.vote_count),
        },
      ];
    });
}

/** Titles from a TMDb list or discover endpoint, e.g. "/trending/all/week" or "/discover/movie". */
export async function getTmdbList(path: string, params: Record<string, string> = {}, pages = 1): Promise<TitleSummary[]> {
  return tmdbResults(path, params, pages);
}

/**
 * Popular, well-reviewed titles in some genres: comma-separated TMDb genre ids, all of which must
 * match, or any of which may match when `join` is "|".
 */
export async function discover(type: MediaType, genres: string, join: "," | "|" = ","): Promise<TitleSummary[]> {
  return tmdbResults(`/discover/${type}`, {
    with_genres: genres.split(",").join(join),
    sort_by: "popularity.desc",
    "vote_count.gte": type === "movie" ? "300" : "100",
    include_adult: "false",
  });
}

const isoDaysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

/** Popular series that premiered in the last three months, leaving out news, reality and talk shows. */
export async function getNewSeries(): Promise<TitleSummary[]> {
  "use cache";
  cacheLife("hours");

  return tmdbResults("/discover/tv", {
    "first_air_date.gte": isoDaysAgo(90),
    "first_air_date.lte": isoDaysAgo(0),
    sort_by: "popularity.desc",
    without_genres: "10763,10764,10767",
    "vote_count.gte": "5",
    include_adult: "false",
  });
}

export async function searchTmdb(query: string, type: Kind | "all" = "all"): Promise<TitleSummary[]> {
  const q = query.trim();
  if (!q) return [];
  const path = type === "movie" ? "/search/movie" : type === "series" ? "/search/tv" : "/search/multi";
  return tmdbResults(path, { query: q, include_adult: "false" });
}

/** Recommendations for a title, or similar titles when TMDb has no recommendations yet. */
export async function getTmdbRecommendations(id: string): Promise<TitleSummary[]> {
  const ref = parseId(id);
  if (!ref) return [];
  const recommended = await tmdbResults(`/${ref.type}/${ref.id}/recommendations`);
  return recommended.length ? recommended : tmdbResults(`/${ref.type}/${ref.id}/similar`);
}

async function tmdbDetail(type: MediaType, id: number): Promise<TitleDetail | null> {
  "use cache";

  const d = await tmdb<Detail>(`/${type}/${id}`, {
    append_to_response: "credits,images",
    include_image_language: "en,null",
  });
  if (!d) {
    cacheLife("minutes");
    return null;
  }
  const title = d.title ?? d.name ?? "";

  let episodes: Episode[];
  if (type === "movie") {
    episodes = [{ index: 0, title, duration: d.runtime ? d.runtime * 60 : undefined, path: embedPath(id) }];
    cacheLife("days");
  } else {
    // Season 0 holds specials; list the regular seasons, aired episodes only.
    const seasons = await Promise.all(
      (d.seasons ?? [])
        .filter((s) => s.season_number > 0 && s.episode_count > 0)
        .map((s) => tmdb<Season>(`/tv/${id}/season/${s.season_number}`)),
    );
    if (seasons.every(Boolean)) cacheLife("days");
    else cacheLife("minutes");
    const today = new Date().toISOString().slice(0, 10);
    episodes = seasons
      .flatMap((s) => s?.episodes ?? [])
      .filter((e) => e.air_date && e.air_date <= today)
      .map((e, index) => ({
        index,
        title: e.name || `Episode ${e.episode_number}`,
        season: e.season_number,
        number: e.episode_number,
        duration: e.runtime ? e.runtime * 60 : undefined,
        overview: e.overview || undefined,
        still: image("w300", e.still_path),
        path: embedPath(id, e.season_number, e.episode_number),
      }));
  }
  if (episodes.length === 0) return null;

  const poster = image("w500", d.poster_path) ?? "";
  const creators =
    type === "movie"
      ? (d.credits?.crew ?? []).filter((c) => c.job === "Director").map((c) => c.name)
      : (d.created_by ?? []).map((c) => c.name);
  const logos = d.images?.logos ?? [];
  const logo = logos.find((l) => l.iso_639_1 === "en") ?? logos[0];
  const cast: CastMember[] = (d.credits?.cast ?? []).slice(0, 15).map((c) => ({
    name: c.name,
    character: c.character || undefined,
    photo: image("w185", c.profile_path),
  }));

  return {
    id: titleId(type, id),
    kind: type === "movie" ? "movie" : "series",
    title,
    year: parseYear(d.release_date ?? d.first_air_date),
    description: d.overview ?? "",
    poster,
    genres: (d.genres ?? []).map((g) => genreName(g.name)),
    rating: score(d.vote_average, d.vote_count),
    backdrop: image("w1280", d.backdrop_path) ?? poster,
    logo: image("w500", logo?.file_path),
    tagline: d.tagline || undefined,
    creator: creators.length ? creators.join(", ") : undefined,
    cast,
    seasons: type === "tv" ? new Set(episodes.map((e) => e.season)).size : undefined,
    episodes,
  };
}

/** A title by site id, or null when it isn't a TMDb id or TMDb doesn't have it. */
export async function getTmdbTitle(id: string): Promise<TitleDetail | null> {
  const ref = parseId(id);
  if (!ref) return null;
  return tmdbDetail(ref.type, ref.id);
}
