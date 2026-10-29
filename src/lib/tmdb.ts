import { cacheLife } from "next/cache";
import { embedPath } from "./embed";
import { type Lang, t, tmdbLanguage } from "./i18n";
import { isFamily, kidsFilter } from "./kids";
import { type CastMember, type Episode, type Kind, TITLE_ID_PATTERN, TODAY, type TitleDetail, type TitleSummary } from "./types";

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
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value === TODAY ? isoDaysAgo(0) : value);
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
  in_production?: boolean;
  seasons?: { season_number: number; episode_count: number }[];
  created_by?: { name: string }[];
  credits?: {
    cast?: { name: string; character?: string; profile_path?: string | null }[];
    crew?: { job?: string; name: string }[];
  };
  images?: { logos?: { file_path: string; iso_639_1?: string | null }[] };
  videos?: { results?: { key: string; site: string; type: string; official?: boolean }[] };
  release_dates?: { results?: { iso_3166_1: string; release_dates: { certification?: string }[] }[] };
  content_ratings?: { results?: { iso_3166_1: string; rating?: string }[] };
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

/** TMDb parameters for text in the interface language. English is TMDb's default. */
const inLang = (lang: Lang): Record<string, string> => (lang === "en" ? {} : { language: tmdbLanguage(lang) });

async function genreMap(lang: Lang): Promise<Record<number, string>> {
  "use cache";

  const lists = await Promise.all(
    (["movie", "tv"] as const).map((type) =>
      tmdb<{ genres: { id: number; name: string }[] }>(`/genre/${type}/list`, inLang(lang)),
    ),
  );
  if (lists.every(Boolean)) cacheLife("days");
  else cacheLife("minutes");
  return Object.fromEntries(
    lists.flatMap((l) => l?.genres ?? []).map((g) => [g.id, lang === "en" ? genreName(g.name) : g.name]),
  );
}

const parseYear = (date?: string) => (date && /^\d{4}/.test(date) ? Number(date.slice(0, 4)) : undefined);

const score = (vote?: number, count?: number) => (vote && count && count >= 5 ? Math.round(vote * 10) / 10 : undefined);

/** Card data for a TMDb list, discover or search endpoint, skipping people and titles without a poster. */
async function tmdbResults(
  path: string,
  params: Record<string, string> = {},
  pages = 1,
  firstPage = 1,
  lang: Lang = "en",
): Promise<TitleSummary[]> {
  "use cache";

  const fixedType: MediaType | undefined = /\/movie(\/|$)/.test(path) ? "movie" : /\/tv(\/|$)/.test(path) ? "tv" : undefined;
  const [genres, ...responses] = await Promise.all([
    genreMap(lang),
    ...Array.from({ length: pages }, (_, i) =>
      tmdb<{ results?: Item[] }>(path, { ...params, ...inLang(lang), page: String(firstPage + i) }),
    ),
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
          family: isFamily(type, item.genre_ids ?? []),
        },
      ];
    });
}

/** Titles from a TMDb list or discover endpoint, e.g. "/trending/all/week" or "/discover/movie". */
export async function getTmdbList(
  path: string,
  params: Record<string, string> = {},
  pages = 1,
  firstPage = 1,
  lang: Lang = "en",
): Promise<TitleSummary[]> {
  return tmdbResults(path, params, pages, firstPage, lang);
}

/**
 * Popular, well-reviewed titles in some genres: comma-separated TMDb genre ids, all of which must
 * match, or any of which may match when `join` is "|".
 */
export async function discover(
  type: MediaType,
  genres: string,
  join: "," | "|" = ",",
  lang: Lang = "en",
): Promise<TitleSummary[]> {
  return tmdbResults(
    `/discover/${type}`,
    {
      with_genres: genres.split(",").join(join),
      sort_by: "popularity.desc",
      "vote_count.gte": type === "movie" ? "300" : "100",
      include_adult: "false",
    },
    1,
    1,
    lang,
  );
}

const isoDaysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

/** Popular series that premiered in the last three months, leaving out news, reality and talk shows. */
export async function getNewSeries(lang: Lang = "en"): Promise<TitleSummary[]> {
  "use cache";
  cacheLife("hours");

  return tmdbResults(
    "/discover/tv",
    {
      "first_air_date.gte": isoDaysAgo(90),
      "first_air_date.lte": isoDaysAgo(0),
      sort_by: "popularity.desc",
      without_genres: "10763,10764,10767",
      "vote_count.gte": "5",
      include_adult: "false",
    },
    1,
    1,
    lang,
  );
}

// Series by origin: the TMDb filter, and the minimum votes for the popular and top-rated lists (Arabic
// series get far fewer TMDb votes than Turkish ones).
const SERIES_ORIGINS = {
  turkish: { filter: { with_origin_country: "TR" }, popularVotes: "20", topVotes: "50" },
  arabic: { filter: { with_original_language: "ar" }, popularVotes: "5", topVotes: "20" },
  egyptian: { filter: { with_original_language: "ar", with_origin_country: "EG" }, popularVotes: "3", topVotes: "10" },
  levantine: { filter: { with_original_language: "ar", with_origin_country: "SY|LB" }, popularVotes: "1", topVotes: "5" },
};

// Ramadan 1447 ran from 18 February to 19 March 2026; Ramadan series premiere in the days before it.
const RAMADAN_2026 = { "first_air_date.gte": "2026-02-10", "first_air_date.lte": "2026-03-19" };

/**
 * Series by origin: "new" premiered in the last three months, "airing" had an episode in the last
 * week, "popular" by popularity, "top" the best rated, "netflix" and "shahid" streaming there in Saudi
 * Arabia, "ramadan" premiered for Ramadan 2026.
 */
export async function getSeriesFrom(
  origin: keyof typeof SERIES_ORIGINS,
  list: "new" | "airing" | "popular" | "top" | "netflix" | "shahid" | "ramadan",
  lang: Lang = "en",
): Promise<TitleSummary[]> {
  "use cache";
  cacheLife("hours");

  const { filter, popularVotes, topVotes } = SERIES_ORIGINS[origin];
  const today = isoDaysAgo(0);
  const filters: Record<typeof list, Record<string, string>> = {
    new: { "first_air_date.gte": isoDaysAgo(90), "first_air_date.lte": today, sort_by: "popularity.desc" },
    airing: { "air_date.gte": isoDaysAgo(7), "air_date.lte": today, sort_by: "popularity.desc" },
    popular: { sort_by: "popularity.desc", "vote_count.gte": popularVotes },
    top: { sort_by: "vote_average.desc", "vote_count.gte": topVotes },
    // TMDb providers 8 and 1715 are Netflix and Shahid VIP; Saudi Arabia's catalog has the most Arabic titles.
    netflix: { with_watch_providers: "8", watch_region: "SA", sort_by: "popularity.desc" },
    shahid: { with_watch_providers: "1715", watch_region: "SA", sort_by: "popularity.desc" },
    ramadan: { ...RAMADAN_2026, sort_by: "popularity.desc" },
  };
  return tmdbResults(
    "/discover/tv",
    { ...filter, without_genres: "10763,10764,10767", include_adult: "false", ...filters[list] },
    1,
    1,
    lang,
  );
}

/**
 * More series lists: "upcoming" premieres in the next six months, "best" the best rated with many
 * votes, "anime" Japanese animation.
 */
export async function getSeriesList(list: "upcoming" | "best" | "anime", lang: Lang = "en"): Promise<TitleSummary[]> {
  "use cache";
  cacheLife("hours");

  const filters: Record<typeof list, Record<string, string>> = {
    upcoming: { "first_air_date.gte": isoDaysAgo(-1), "first_air_date.lte": isoDaysAgo(-180), sort_by: "popularity.desc" },
    best: { sort_by: "vote_average.desc", "vote_count.gte": "3000" },
    anime: { with_genres: "16", with_original_language: "ja", sort_by: "popularity.desc", "vote_count.gte": "100" },
  };
  return tmdbResults(
    "/discover/tv",
    { without_genres: "10763,10764,10767", include_adult: "false", ...filters[list] },
    1,
    1,
    lang,
  );
}

// The main lists keep to animation and family titles: a PG rating alone lets in grown-up dramas.
const KIDS_GENRES = { with_genres: "16|10751|10762" };

const KIDS_LISTS = {
  popular: { ...KIDS_GENRES, sort_by: "popularity.desc", "vote_count.gte": "50" },
  top: { ...KIDS_GENRES, sort_by: "vote_average.desc", "vote_count.gte": "500" },
  animation: { with_genres: "16", sort_by: "popularity.desc", "vote_count.gte": "50" },
  family: { with_genres: "10751", sort_by: "popularity.desc", "vote_count.gte": "50" },
  adventure: { with_genres: "12", sort_by: "popularity.desc", "vote_count.gte": "50" },
  comedy: { with_genres: "35", sort_by: "popularity.desc", "vote_count.gte": "50" },
};

/** Lists for Kids mode: kids-rated movies or series, "new" released in the last six months. */
export async function getKidsList(
  type: MediaType,
  list: keyof typeof KIDS_LISTS | "new",
  lang: Lang = "en",
): Promise<TitleSummary[]> {
  "use cache";
  cacheLife("hours");

  const date = type === "movie" ? "primary_release_date" : "first_air_date";
  const filter =
    list === "new"
      ? {
          ...KIDS_GENRES,
          [`${date}.gte`]: isoDaysAgo(180),
          [`${date}.lte`]: isoDaysAgo(0),
          sort_by: "popularity.desc",
          "vote_count.gte": "5",
        }
      : KIDS_LISTS[list];
  return tmdbResults(
    `/discover/${type}`,
    {
      ...kidsFilter(type),
      ...(type === "tv" && { without_genres: "10763,10764,10767" }),
      include_adult: "false",
      ...filter,
    },
    1,
    1,
    lang,
  );
}

export async function searchTmdb(query: string, type: Kind | "all" = "all", lang: Lang = "en"): Promise<TitleSummary[]> {
  const q = query.trim();
  if (!q) return [];
  const path = type === "movie" ? "/search/movie" : type === "series" ? "/search/tv" : "/search/multi";
  return tmdbResults(path, { query: q, include_adult: "false" }, 1, 1, lang);
}

/** Recommendations for a title, or similar titles when TMDb has no recommendations yet. */
export async function getTmdbRecommendations(id: string, lang: Lang = "en"): Promise<TitleSummary[]> {
  const ref = parseId(id);
  if (!ref) return [];
  const recommended = await tmdbResults(`/${ref.type}/${ref.id}/recommendations`, {}, 1, 1, lang);
  return recommended.length ? recommended : tmdbResults(`/${ref.type}/${ref.id}/similar`, {}, 1, 1, lang);
}

async function tmdbDetail(type: MediaType, id: number, lang: Lang = "en"): Promise<TitleDetail | null> {
  "use cache";

  const languages = lang === "en" ? "en,null" : `${lang},en,null`;
  const d = await tmdb<Detail>(`/${type}/${id}`, {
    ...inLang(lang),
    append_to_response: `credits,images,videos,${type === "movie" ? "release_dates" : "content_ratings"}`,
    include_image_language: languages,
    include_video_language: languages,
  });
  if (!d) {
    cacheLife("minutes");
    return null;
  }
  // Not every title has a translated overview; fall back to the English one.
  if (lang !== "en" && !d.overview) {
    const en = await tmdb<Pick<Detail, "overview" | "tagline">>(`/${type}/${id}`);
    d.overview = en?.overview;
    d.tagline ||= en?.tagline;
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
        .map((s) => tmdb<Season>(`/tv/${id}/season/${s.season_number}`, inLang(lang))),
    );
    // Series still on the air get new episodes weekly, so they're refreshed hourly.
    if (!seasons.every(Boolean)) cacheLife("minutes");
    else if (d.in_production) cacheLife("hours");
    else cacheLife("days");
    const today = new Date().toISOString().slice(0, 10);
    episodes = seasons
      .flatMap((s) => s?.episodes ?? [])
      .filter((e) => e.air_date && e.air_date <= today)
      .map((e, index) => ({
        index,
        title: e.name || t(lang, "Episode {n}", { n: e.episode_number }),
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
  const logo = logos.find((l) => l.iso_639_1 === lang) ?? logos.find((l) => l.iso_639_1 === "en") ?? logos[0];
  const cast: CastMember[] = (d.credits?.cast ?? []).slice(0, 15).map((c) => ({
    name: c.name,
    character: c.character || undefined,
    photo: image("w185", c.profile_path),
  }));

  return {
    id: titleId(type, id),
    kind: type === "movie" ? "movie" : "series",
    family: isFamily(type, (d.genres ?? []).map((g) => g.id)),
    title,
    year: parseYear(d.release_date ?? d.first_air_date),
    description: d.overview ?? "",
    poster,
    genres: (d.genres ?? []).map((g) => (lang === "en" ? genreName(g.name) : g.name)),
    rating: score(d.vote_average, d.vote_count),
    backdrop: image("w1280", d.backdrop_path) ?? poster,
    logo: image("w500", logo?.file_path),
    trailer: trailerKey(d),
    certification: certification(d),
    tagline: d.tagline || undefined,
    creator: creators.length ? creators.join(", ") : undefined,
    cast,
    seasons: type === "tv" ? new Set(episodes.map((e) => e.season)).size : undefined,
    episodes,
  };
}

/**
 * The air date (YYYY-MM-DD) of a series' latest aired episode, by site id, or null when it isn't a
 * series or TMDb doesn't know. Refreshed hourly so new episodes show up the day they air.
 */
export async function getLastAired(id: string): Promise<string | null> {
  "use cache";

  const ref = parseId(id);
  if (ref?.type !== "tv") return null;
  const d = await tmdb<{ last_episode_to_air?: { air_date?: string | null } | null }>(`/tv/${ref.id}`);
  if (d) cacheLife("hours");
  else cacheLife("minutes");
  return d?.last_episode_to_air?.air_date ?? null;
}

/** The YouTube id of the title's trailer: official trailers first, then any trailer, then a teaser. */
function trailerKey(d: Detail) {
  const videos = (d.videos?.results ?? []).filter((v) => v.site === "YouTube");
  const pick =
    videos.find((v) => v.type === "Trailer" && v.official) ??
    videos.find((v) => v.type === "Trailer") ??
    videos.find((v) => v.type === "Teaser");
  return pick?.key;
}

/** The age rating, e.g. "PG-13" or "TV-MA": the US one when there is one, otherwise any country's. */
function certification(d: Detail) {
  const ratings = [
    ...(d.release_dates?.results ?? []).map((r) => ({
      country: r.iso_3166_1,
      rating: r.release_dates.find((x) => x.certification)?.certification,
    })),
    ...(d.content_ratings?.results ?? []).map((r) => ({ country: r.iso_3166_1, rating: r.rating })),
  ].filter((r) => r.rating);
  return (ratings.find((r) => r.country === "US") ?? ratings[0])?.rating;
}

/** A title by site id, or null when it isn't a TMDb id or TMDb doesn't have it. */
export async function getTmdbTitle(id: string, lang: Lang = "en"): Promise<TitleDetail | null> {
  const ref = parseId(id);
  if (!ref) return null;
  return tmdbDetail(ref.type, ref.id, lang);
}
