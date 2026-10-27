export type Kind = "movie" | "series";

// TMDb movie and TV ids overlap, so site ids carry the type: "tmdb-movie-278", "tmdb-tv-1399".
export const TITLE_ID_PATTERN = /^tmdb-(movie|tv)-(\d{1,10})$/;

/**
 * A TMDb query value that stands for today's date (YYYY-MM-DD). The TMDb client fills it in inside
 * cached functions, where reading the clock is allowed.
 */
export const TODAY = "{today}";

export interface TitleSummary {
  id: string;
  kind: Kind;
  title: string;
  year?: number;
  description: string;
  poster: string;
  /** Landscape still, for wide cards. */
  backdrop?: string;
  genres: string[];
  /** TMDb user score out of 10. */
  rating?: number;
  /** Made for children or families, by TMDb genre (see lib/kids). */
  family?: boolean;
}

export interface Episode {
  index: number;
  title: string;
  season?: number;
  number?: number;
  /** Seconds */
  duration?: number;
  overview?: string;
  still?: string;
  /** Path on the embed host, e.g. "/movie/550" or "/tv/1399/1/1". */
  path: string;
}

export interface CastMember {
  name: string;
  character?: string;
  photo?: string;
}

export interface TitleDetail extends TitleSummary {
  backdrop: string;
  /** Transparent title logo, when TMDb has one. */
  logo?: string;
  /** YouTube video id of the trailer. */
  trailer?: string;
  /** Age rating, e.g. "PG-13" or "TV-MA". */
  certification?: string;
  tagline?: string;
  creator?: string;
  cast: CastMember[];
  seasons?: number;
  episodes: Episode[];
}
