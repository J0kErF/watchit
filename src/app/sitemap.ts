import type { MetadataRoute } from "next";
import { CATEGORIES, categoryPath } from "@/lib/categories";
import { SITE_URL } from "@/lib/site";
import { getSeriesFrom, getTmdbList } from "@/lib/tmdb";
import type { Kind } from "@/lib/types";

/**
 * The pages for search engines: the browse pages, every category, and the titles people look for
 * most (popular, trending and top-rated, plus Turkish and Arabic series). Refreshed with the lists.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lists = await Promise.all([
    getTmdbList("/movie/popular", {}, 5),
    getTmdbList("/tv/popular", {}, 5),
    getTmdbList("/trending/all/week", {}, 3),
    getTmdbList("/movie/top_rated", {}, 3),
    getTmdbList("/tv/top_rated", {}, 3),
    getSeriesFrom("turkish", "popular"),
    getSeriesFrom("arabic", "popular"),
  ]);
  const titles = [...new Set(lists.flat().map((t) => t.id))];

  const page = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({ url: SITE_URL + path, priority });
  return [
    page("/", 1),
    page("/movies", 0.9),
    page("/series", 0.9),
    page("/search", 0.5),
    ...(["movie", "series"] as Kind[]).flatMap((kind) => CATEGORIES[kind].map((c) => page(categoryPath(kind, c.slug), 0.7))),
    ...titles.map((id) => page(`/title/${id}`, 0.6)),
  ];
}
