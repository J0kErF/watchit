import type { Metadata } from "next";
import { Suspense } from "react";
import { Browse, BrowseSkeleton } from "@/components/Browse";
import { KidsBrowse } from "@/components/KidsBrowse";
import { categoryQuery, findCategory, findSub } from "@/lib/categories";
import { getKids, getLang } from "@/lib/lang";
import { discover, getTmdbList } from "@/lib/tmdb";

export const metadata: Metadata = { title: "Movies" };

export default function MoviesPage() {
  return (
    <Suspense fallback={<BrowseSkeleton />}>
      <MoviesView />
    </Suspense>
  );
}

async function MoviesView() {
  const [lang, kids] = await Promise.all([getLang(), getKids()]);
  if (kids) return <KidsBrowse scope="movie" lang={lang} />;
  const list = (path: string) => getTmdbList(path, {}, 1, 1, lang);
  const genre = (genres: string) => discover("movie", genres, ",", lang);
  // A row from a category page, e.g. ("horror", "zombies"): its first page, most popular first.
  const category = (slug: string, sub?: string) => {
    const c = findCategory("movie", slug)!;
    const { path, params } = categoryQuery("movie", c, "popular", "", findSub(c, sub));
    return getTmdbList(path, params, 1, 1, lang);
  };
  return (
    <Browse
      lang={lang}
      featured={list("/trending/movie/day")}
      eyebrow="Movie of the day"
      rows={[
        { heading: "Top 10 movies today", titles: list("/trending/movie/day"), top10: true },
        { heading: "Trending this week", titles: list("/trending/movie/week") },
        { heading: "New releases", titles: list("/movie/now_playing") },
        { heading: "Popular on Jawy", titles: list("/movie/popular") },
        { heading: "Coming soon", titles: list("/movie/upcoming") },
        { heading: "Critically acclaimed", titles: list("/movie/top_rated") },
        { heading: "Action", titles: genre("28") },
        { heading: "Adventure", titles: genre("12") },
        { heading: "Comedy", titles: genre("35") },
        { heading: "Thrillers", titles: genre("53") },
        { heading: "Sci-fi", titles: genre("878") },
        { heading: "Horror", titles: genre("27") },
        { heading: "Supernatural horror", titles: category("horror", "supernatural") },
        { heading: "Slasher movies", titles: category("horror", "slasher") },
        { heading: "Zombie movies", titles: category("horror", "zombies") },
        { heading: "Drama", titles: genre("18") },
        { heading: "Romance", titles: genre("10749") },
        { heading: "Crime", titles: genre("80") },
        { heading: "Family", titles: genre("10751") },
        { heading: "Animation", titles: genre("16") },
        { heading: "Anime", titles: category("anime") },
        { heading: "Documentaries", titles: genre("99") },
      ]}
    />
  );
}
