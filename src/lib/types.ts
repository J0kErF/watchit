export type Kind = "movie" | "series";

// TMDb movie and TV ids overlap, so site ids carry the type: "tmdb-movie-278", "tmdb-tv-1399".
export const TITLE_ID_PATTERN = /^tmdb-(movie|tv)-(\d{1,10})$/;

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
  /** Path on the embed host: "/550" for a movie, "/1399/1/1" for an episode. */
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
  tagline?: string;
  creator?: string;
  cast: CastMember[];
  seasons?: number;
  episodes: Episode[];
}
