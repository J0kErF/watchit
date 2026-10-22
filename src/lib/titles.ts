import { getTmdbTitle } from "./tmdb";
import type { TitleDetail } from "./types";

/** Any title by site id. Titles come from TMDb and play from the viewer's chosen embed host. */
export function getTitle(id: string): Promise<TitleDetail | null> {
  return getTmdbTitle(id);
}
