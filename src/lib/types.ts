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
  tagline?: string;
  creator?: string;
  cast: CastMember[];
  seasons?: number;
  episodes: Episode[];
}

export interface Subtitle {
  /** BCP 47 language code, e.g. "en" or "ar". */
  lang: string;
  label: string;
  /** WebVTT file. */
  url: string;
}

/** A video the built-in player can play directly. */
export interface Source {
  label: string;
  /** "hls" for .m3u8 playlists, "file" for MP4 or WebM. */
  kind: "hls" | "file";
  url: string;
  subtitles: Subtitle[];
  /** WebVTT file of timeline preview images (sprites with #xywh=), WebP or JPEG. */
  thumbnails?: string;
}
