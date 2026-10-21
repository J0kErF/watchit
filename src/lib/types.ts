export type Kind = "movie" | "series";

export interface TitleSummary {
  id: string;
  kind: Kind;
  title: string;
  year?: number;
  description: string;
  poster: string;
  genres: string[];
  runtime?: string;
}

export interface Episode {
  index: number;
  title: string;
  season?: number;
  number?: number;
  /** Seconds */
  duration?: number;
  src: string;
  /** Other encodes of the same video, tried in order if `src` can't be decoded. */
  fallbacks: string[];
}

export interface TitleDetail extends TitleSummary {
  backdrop: string;
  license?: string;
  creator?: string;
  episodes: Episode[];
}
